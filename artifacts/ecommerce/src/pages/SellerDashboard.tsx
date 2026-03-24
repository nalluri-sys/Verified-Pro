import { Layout } from "@/components/Layout";
import {
  getGetSellerStatsQueryKey,
  getListProductsQueryKey,
  getListSellerProductsQueryKey,
  useAddProductImage,
  useCreateProduct,
  useGetSellerStats,
  useListCategories,
  useListSellerProducts,
  useListSellerReturns,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Package, DollarSign, ShoppingCart, ArrowLeftRight, PlusCircle, ImagePlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FormEvent, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { entityId } from "@/lib/entity-id";
import { useQueryClient } from "@tanstack/react-query";

const MAX_IMAGE_DIMENSION = 1280;
const MAX_IMAGE_DATA_URL_LENGTH = 4_500_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function compressImageFile(file: File): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(rawDataUrl);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;

  ctx.drawImage(image, 0, 0, width, height);
  const compressed = canvas.toDataURL("image/jpeg", 0.82);
  return compressed || rawDataUrl;
}

export default function SellerDashboard() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: stats } = useGetSellerStats();
  const { data: products } = useListSellerProducts();
  const { data: returns } = useListSellerReturns();
  const { data: categories } = useListCategories();

  const { mutateAsync: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutateAsync: addProductImage, isPending: isAddingProductImage } = useAddProductImage();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const isSubmitting = isCreatingProduct || isAddingProductImage || isProcessingImages;

  async function handleImagesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      const nextImages: string[] = [];
      const selected = Array.from(files).slice(0, 6);

      for (const file of selected) {
        const compressed = await compressImageFile(file);
        if (!compressed || compressed.length > MAX_IMAGE_DATA_URL_LENGTH) {
          toast({
            title: "Image skipped",
            description: `${file.name} is too large after compression.`,
            variant: "destructive",
          });
          continue;
        }
        nextImages.push(compressed);
      }

      setImageDataUrls((prev) => [...prev, ...nextImages].slice(0, 6));
    } catch {
      toast({
        title: "Image processing failed",
        description: "Could not process one or more images.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImages(false);
    }
  }

  function removeImage(index: number) {
    setImageDataUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (!name.trim() || !description.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast({
        title: "Invalid product details",
        description: "Name, description and valid price are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const created = await createProduct({
        data: {
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          stock: Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : 0,
          ...(categoryId ? { categoryId } : {}),
        } as any,
      });

      const productId = entityId(created as any);
      for (let index = 0; index < imageDataUrls.length; index += 1) {
        await addProductImage({
          id: productId as any,
          data: {
            url: imageDataUrls[index],
            isPrimary: index === 0,
          },
        });
      }

      await qc.invalidateQueries({ queryKey: getListSellerProductsQueryKey() });
      await qc.invalidateQueries({ queryKey: getGetSellerStatsQueryKey() });
      await qc.invalidateQueries({ queryKey: getListProductsQueryKey() });

      toast({
        title: "Product added",
        description: `${name.trim()} is now live for customers. ${imageDataUrls.length} image(s) saved in database.`,
      });

      setName("");
      setDescription("");
      setPrice("0");
      setStock("1");
      setCategoryId("");
      setImageDataUrls([]);
    } catch (error: any) {
      toast({
        title: "Could not create product",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-display font-bold mb-8">Seller Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <h3 className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Orders</p>
                <h3 className="text-2xl font-bold">{stats?.totalOrders || 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Products</p>
                <h3 className="text-2xl font-bold">{stats?.totalProducts || 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Returns</p>
                <h3 className="text-2xl font-bold">{stats?.pendingReturns || 0} Pending</h3>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 md:p-8 bg-white border border-slate-200 mb-10">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New Product</h2>
              <p className="text-sm text-muted-foreground">
                Uploaded seller images are stored in database and used as AI reference images during return verification.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Wireless Headphones"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Select category</option>
                  {(categories ?? []).map((category: any) => (
                    <option key={entityId(category)} value={entityId(category)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-24"
                placeholder="Describe key features, condition, and included accessories"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <ImagePlus className="w-4 h-4" /> Product Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void handleImagesSelected(e.target.files)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Up to 6 images. First image becomes primary reference for display and AI checks.</p>

              {imageDataUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {imageDataUrls.map((url, index) => (
                    <div key={`${index}-${url.slice(0, 20)}`} className="relative">
                      <img src={url} alt={`Product preview ${index + 1}`} className="h-20 w-full object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 rounded-full bg-white border border-slate-300 p-1"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <span className="absolute left-1 bottom-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting}>
                Add Product
              </Button>
            </div>
          </form>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold mb-6">Your Products</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(products ?? []).map((product: any) => (
                    <tr key={entityId(product)}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          {product.images?.[0]?.url && (
                            <img src={product.images[0].url} alt={product.name} className="h-10 w-10 rounded-md object-cover border" />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4"><Badge>{product.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-6">Recent Returns</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">AI Verdict</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(returns ?? []).slice(0, 5).map((ret: any) => (
                    <tr key={entityId(ret)}>
                      <td className="px-6 py-4 font-medium">#{entityId(ret)}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{ret.status}</Badge></td>
                      <td className="px-6 py-4">
                        {ret.aiVerdict ? <Badge variant={ret.aiVerdict === "PASS" ? "success" : "destructive"}>{ret.aiVerdict}</Badge> : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/returns/${entityId(ret)}`} className="text-primary hover:underline text-sm font-semibold">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

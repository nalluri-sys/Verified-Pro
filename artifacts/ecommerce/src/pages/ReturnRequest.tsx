import { Layout } from "@/components/Layout";
import { useCreateReturn, useAddReturnImage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch, useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, UploadCloud } from "lucide-react";
import { entityId } from "@/lib/entity-id";

const MAX_IMAGE_DATA_URL_LENGTH = 4_500_000;
const MAX_IMAGE_DIMENSION = 1280;

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await loadImageFromDataUrl(originalDataUrl);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return originalDataUrl;

  ctx.drawImage(image, 0, 0, width, height);
  const compressed = canvas.toDataURL("image/jpeg", 0.78);
  return compressed || originalDataUrl;
}

export default function ReturnRequest() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const orderId = searchParams.get('orderId') || "";
  const itemId = searchParams.get('itemId') || "";
  
  const [reason, setReason] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { mutateAsync: addImage } = useAddReturnImage();
  const { mutate: createReturn, isPending } = useCreateReturn({
    mutation: {
      onSuccess: async (data) => {
        const returnId = entityId(data as any);
        const imageToSave = imageDataUrl || imgUrl;
        if (imageToSave) await addImage({ id: returnId as any, data: { url: imageToSave } });
        toast({ title: "Return Requested", description: "Your return is under review." });
        setLocation(`/returns/${returnId}`);
      }
    }
  });

  const onImageFileChange = async (file: File | null) => {
    if (!file) {
      setImageDataUrl("");
      setImageName("");
      return;
    }

    setIsProcessingImage(true);
    try {
      const result = await compressImageToDataUrl(file);
      if (!result || result.length > MAX_IMAGE_DATA_URL_LENGTH) {
        toast({
          title: "Image too large",
          description: "Please choose a smaller image (recommended under 4 MB).",
          variant: "destructive",
        });
        setImageDataUrl("");
        setImageName("");
        return;
      }

      setImageDataUrl(result);
      setImageName(file.name);
      setImgUrl("");
    } catch {
      toast({
        title: "Could not read image",
        description: "Please try another image file.",
        variant: "destructive",
      });
      setImageDataUrl("");
      setImageName("");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    if (!imgUrl && !imageDataUrl) {
      toast({
        title: "Image required",
        description: "Upload an image or provide an image URL.",
        variant: "destructive",
      });
      return;
    }
    createReturn({ data: { orderId, orderItemId: itemId, reason } });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-display font-bold mb-8">Request a Return</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Why are you returning this?</label>
            <textarea 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 p-4 min-h-32 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Please explain the issue..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center">
              <ImagePlus className="w-4 h-4 mr-2 text-primary" /> Upload Photo Evidence
            </label>
            <p className="text-xs text-muted-foreground mb-3">Our AI will verify the condition of the item based on the image provided.</p>
            <label className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 cursor-pointer hover:border-primary/50 transition-colors">
              <UploadCloud className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                {imageName || "Choose an image file (jpg, png, webp)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void onImageFileChange(e.target.files?.[0] ?? null);
                }}
              />
            </label>

            {isProcessingImage && (
              <p className="mt-2 text-xs text-muted-foreground">Optimizing image for upload...</p>
            )}

            {imageDataUrl && (
              <div className="mt-3">
                <img src={imageDataUrl} alt="Return evidence preview" className="w-full max-h-72 object-cover rounded-xl border border-slate-200" />
              </div>
            )}

            <div className="my-3 text-xs uppercase tracking-widest text-muted-foreground">or</div>
            <Input 
              value={imgUrl}
              onChange={e => setImgUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={Boolean(imageDataUrl)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isPending || isProcessingImage}>
            Submit Return Request
          </Button>
        </form>
      </div>
    </Layout>
  );
}

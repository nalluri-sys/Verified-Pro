import { Router, type IRouter } from "express";
import { Product, Category, User } from "@workspace/db";
import { CreateProductBody, UpdateProductBody, AddProductImageBody } from "@workspace/api-zod";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function getProductWithDetails(id: string) {
  const product = await Product.findById(id);
  if (!product) return null;
  
  let category = null;
  if (product.categoryId) {
    category = await Category.findById(product.categoryId);
  }
  
  const seller = await User.findById(product.sellerId).select("_id name email role isApproved createdAt");
  
  return {
    _id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    categoryId: product.categoryId,
    sellerId: product.sellerId,
    status: product.status,
    images: product.images || [],
    category: category ? { _id: category._id, name: category.name, slug: category.slug } : null,
    seller,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const { search, categoryId, minPrice, maxPrice, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  const query: any = { status: "approved" };
  if (search) query.name = { $regex: search, $options: "i" };
  if (categoryId) query.categoryId = categoryId;
  if (minPrice) query.price = { $gte: parseFloat(minPrice) };
  if (maxPrice) query.price = { ...(query.price || {}), $lte: parseFloat(maxPrice) };

  const count = await Product.countDocuments(query);
  const products = await Product.find(query).limit(limitNum).skip(offset);

  const detailed = await Promise.all(products.map((p) => getProductWithDetails(p._id.toString())));
  res.json({ products: detailed.filter(Boolean), total: count, page: pageNum, limit: limitNum });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const product = await getProductWithDetails(id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

router.post("/products", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  const product = await Product.create({
    ...parsed.data,
    sellerId: req.userId!,
    status: "approved",
  });
  
  const detailed = await getProductWithDetails(product._id.toString());
  res.status(201).json(detailed);
});

router.patch("/products/:id", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  await Product.findByIdAndUpdate(id, parsed.data);
  const detailed = await getProductWithDetails(id);
  
  if (!detailed) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(detailed);
});

router.delete("/products/:id", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  await Product.findByIdAndDelete(id);
  res.sendStatus(204);
});

router.post("/products/:id/images", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const parsed = AddProductImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = await Product.findByIdAndUpdate(
    id,
    {
      $push: {
        images: {
          url: parsed.data.url,
          isPrimary: Boolean(parsed.data.isPrimary),
        },
      },
    },
    { new: true }
  );

  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.status(201).json(parsed.data);
});

export default router;

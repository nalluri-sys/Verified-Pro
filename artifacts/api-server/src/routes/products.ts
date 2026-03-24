import { Router, type IRouter } from "express";
import { Product, Category, User } from "@workspace/db";
import { AddProductImageBody } from "@workspace/api-zod";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
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
  const body = req.body as Record<string, unknown>;
  const name = typeof body?.["name"] === "string" ? body["name"].trim() : "";
  const description = typeof body?.["description"] === "string" ? body["description"].trim() : "";
  const price = parseOptionalNumber(body?.["price"]);
  const stock = parseOptionalNumber(body?.["stock"]) ?? 0;
  const categoryId = typeof body?.["categoryId"] === "string" && body["categoryId"].trim() !== ""
    ? body["categoryId"].trim()
    : undefined;

  if (!name || !description || price === undefined) {
    res.status(400).json({ error: "Invalid request body: name, description and price are required" });
    return;
  }

  const images = Array.isArray(body?.["images"])
    ? body["images"]
        .map((img) => {
          if (!img || typeof img !== "object") return null;
          const val = img as Record<string, unknown>;
          const url = typeof val.url === "string" ? val.url.trim() : "";
          if (!url) return null;
          return {
            url,
            isPrimary: Boolean(val.isPrimary),
          };
        })
        .filter((img): img is { url: string; isPrimary: boolean } => Boolean(img))
    : [];
  
  const product = await Product.create({
    name,
    description,
    price,
    stock,
    categoryId,
    sellerId: req.userId!,
    status: "approved",
    images,
  });
  
  const detailed = await getProductWithDetails(product._id.toString());
  res.status(201).json(detailed);
});

router.patch("/products/:id", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const existing = await Product.findById(id);
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (req.userRole !== "admin" && String(existing.sellerId) !== String(req.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof body?.["name"] === "string" && body["name"].trim() !== "") update.name = body["name"].trim();
  if (typeof body?.["description"] === "string" && body["description"].trim() !== "") update.description = body["description"].trim();
  const price = parseOptionalNumber(body?.["price"]);
  if (price !== undefined) update.price = price;
  const stock = parseOptionalNumber(body?.["stock"]);
  if (stock !== undefined) update.stock = stock;
  if (typeof body?.["categoryId"] === "string") {
    update.categoryId = body["categoryId"].trim() || undefined;
  }
  if (typeof body?.["status"] === "string" && ["pending", "approved", "rejected"].includes(body["status"])) {
    update.status = body["status"];
  }
  
  await Product.findByIdAndUpdate(id, update);
  const detailed = await getProductWithDetails(id);
  
  if (!detailed) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(detailed);
});

router.delete("/products/:id", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const existing = await Product.findById(id);
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (req.userRole !== "admin" && String(existing.sellerId) !== String(req.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

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

  const product = await Product.findById(id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (req.userRole !== "admin" && String(product.sellerId) !== String(req.userId)) {
    res.status(403).json({ error: "Forbidden" });
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

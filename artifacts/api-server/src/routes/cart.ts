import { Router, type IRouter } from "express";
import { Product } from "@workspace/db";
import { UpdateCartItemBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

// In-memory cart store (per user session; in prod use Redis)
const carts: Map<string, Map<string, number>> = new Map();

async function buildCartResponse(userId: string) {
  const userCart = carts.get(userId) || new Map<string, number>();
  const items = [];
  let total = 0;
  
  for (const [productId, quantity] of userCart.entries()) {
    const product = await Product.findById(productId);
    if (!product) continue;
    
    const price = product.price;
    const subtotal = price * quantity;
    total += subtotal;
    
    items.push({
      productId,
      quantity,
      product: { 
        _id: product._id,
        name: product.name, 
        description: product.description,
        price, 
        stock: product.stock,
        images: product.images || [], 
        category: null, 
        seller: null 
      },
      subtotal,
    });
  }
  
  return { items, total, itemCount: items.length };
}

router.get("/cart", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const cart = await buildCartResponse(req.userId!);
  res.json(cart);
});

router.delete("/cart", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  carts.delete(req.userId!);
  res.sendStatus(204);
});

router.post("/cart/items", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const rawProductId = body?.["productId"];
  const rawQuantity = body?.["quantity"];

  const productId = typeof rawProductId === "string" ? rawProductId : String(rawProductId ?? "");
  const quantity = typeof rawQuantity === "number" ? rawQuantity : Number(rawQuantity);

  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    res.status(400).json({ error: "Invalid request body: productId and positive quantity are required" });
    return;
  }

  const product = await Product.findById(productId).select("_id");
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (!carts.has(req.userId!)) carts.set(req.userId!, new Map());
  const userCart = carts.get(req.userId!)!;
  const current = userCart.get(productId) || 0;
  userCart.set(productId, current + quantity);
  const cart = await buildCartResponse(req.userId!);
  res.json(cart);
});

router.patch("/cart/items/:productId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const productId = firstParam(req.params.productId);
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userCart = carts.get(req.userId!) || new Map<string, number>();
  if (parsed.data.quantity <= 0) {
    userCart.delete(productId);
  } else {
    userCart.set(productId, parsed.data.quantity);
  }
  carts.set(req.userId!, userCart);
  const cart = await buildCartResponse(req.userId!);
  res.json(cart);
});

router.delete("/cart/items/:productId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const productId = firstParam(req.params.productId);
  const userCart = carts.get(req.userId!) || new Map<string, number>();
  userCart.delete(productId);
  carts.set(req.userId!, userCart);
  const cart = await buildCartResponse(req.userId!);
  res.json(cart);
});

export default router;
export { carts };

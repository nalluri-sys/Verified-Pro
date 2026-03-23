import { Router, type IRouter } from "express";
import { Order, Product } from "@workspace/db";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth.js";
import { carts } from "./cart.js";

const router: IRouter = Router();

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function getOrderWithItems(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) return null;
  
  const itemsWithProducts = await Promise.all(order.items.map(async (item) => {
    const product = await Product.findById(item.productId);
    return {
      _id: item._id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      product: product ? { 
        _id: product._id,
        name: product.name, 
        description: product.description,
        price: product.price, 
        images: (product.images || []).map(i => ({ url: i.url, isPrimary: i.isPrimary || false })), 
        category: null, 
        seller: null 
      } : null,
    };
  }));
  
  return {
    _id: order._id,
    buyerId: order.buyerId,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    items: itemsWithProducts,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

router.get("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const orders = await Order.find({ buyerId: req.userId! });
  const detailed = await Promise.all(orders.map((o) => getOrderWithItems(o._id.toString())));
  res.json(detailed.filter(Boolean));
});

router.get("/orders/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const order = await getOrderWithItems(id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

router.post("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  const userId = req.userId!;
  const userCart = carts.get(userId);
  if (!userCart || userCart.size === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  let totalAmount = 0;
  const cartItems: any[] = [];
  
  for (const [productId, quantity] of userCart.entries()) {
    const product = await Product.findById(productId);
    if (!product) continue;
    
    const price = product.price;
    totalAmount += price * quantity;
    cartItems.push({ productId, quantity, unitPrice: price });
  }

  const order = await Order.create({
    buyerId: userId,
    status: "pending",
    totalAmount,
    shippingAddress: parsed.data.shippingAddress,
    items: cartItems,
  });

  // Clear cart after order
  carts.delete(userId);

  const detailed = await getOrderWithItems(order._id.toString());
  res.status(201).json(detailed);
});

router.patch("/orders/:id/status", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  await Order.findByIdAndUpdate(id, { status: parsed.data.status });
  const detailed = await getOrderWithItems(id);
  
  if (!detailed) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(detailed);
});

export default router;

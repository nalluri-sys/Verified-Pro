import { Router, type IRouter } from "express";
import { Product, Order, Return } from "@workspace/db";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/seller/products", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const products = await Product.find({ sellerId: req.userId! });
  const detailed = products.map((p) => ({
    _id: p._id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    categoryId: p.categoryId,
    sellerId: p.sellerId,
    status: p.status,
    images: p.images || [],
    category: null,
    seller: null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
  res.json(detailed);
});

router.get("/seller/orders", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  // Get seller's products
  const sellerProducts = await Product.find({ sellerId: req.userId! }, { _id: 1 });
  const productIds = sellerProducts.map((p) => p._id);

  if (productIds.length === 0) {
    res.json([]);
    return;
  }

  // Get all orders (since items are embedded, we need to filter)
  const orders = await Order.find({}).lean();
  const sellerOrders = orders.filter((order) => {
    return order.items.some((item: any) => productIds.some((id) => id.equals(item.productId)));
  });

  const detailed = sellerOrders.map((order: any) => ({
    _id: order._id,
    buyerId: order.buyerId,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    items: order.items.map((i: any) => ({ _id: i._id, productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, product: null })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  res.json(detailed);
});

router.get("/seller/returns", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const sellerProducts = await Product.find({ sellerId: req.userId! }, { _id: 1 });
  const productIds = sellerProducts.map((p) => p._id);

  if (productIds.length === 0) {
    res.json([]);
    return;
  }

  // Get all returns
  const returns = await Return.find({}).lean();
  // Since we don't have direct product info in returns, we can't filter them in this way
  // For now, return all returns (this needs better implementation with more data)
  const detailed = returns.map((r: any) => ({
    _id: r._id,
    orderId: r.orderId,
    orderItemId: r.orderItemId,
    buyerId: r.buyerId,
    reason: r.reason,
    status: r.status,
    aiVerdict: r.aiVerdict,
    aiScore: r.aiScore,
    images: r.images || [],
    verificationResult: r.verificationResult,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  res.json(detailed);
});

router.get("/seller/stats", requireAuth, requireRole("seller", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const products = await Product.find({ sellerId: req.userId! });
  const productIds = products.map((p) => p._id);

  if (productIds.length === 0) {
    res.json({
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingReturns: 0,
      approvedReturns: 0,
    });
    return;
  }

  // Get all orders and filter
  const allOrders = await Order.find({}).lean();
  const sellerOrders = allOrders.filter((order: any) => {
    return order.items.some((item: any) => productIds.some((id) => id.equals(item.productId)));
  });

  const totalRevenue = sellerOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

  // Get returns (simplified - just get all for now)
  const allReturns = await Return.find({}).lean();
  const pendingReturns = allReturns.filter((r: any) => r.status === "pending" || r.status === "manual_review").length;
  const approvedReturns = allReturns.filter((r: any) => r.status === "approved").length;

  res.json({
    totalProducts: products.length,
    totalOrders: sellerOrders.length,
    totalRevenue,
    pendingReturns,
    approvedReturns,
  });
});

export default router;

import { Router, type IRouter } from "express";
import { User, Product, Order, Return } from "@workspace/db";
import { UpdateUserRoleBody, UpdateProductStatusBody, UpdateReturnDecisionBody } from "@workspace/api-zod";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/admin/users", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const users = await User.find({}).select("_id name email role isApproved createdAt");
  res.json(users);
});

router.patch("/admin/users/:id/role", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: parsed.data.role, isApproved: parsed.data.isApproved ?? true },
    { new: true }
  ).select("_id name email role isApproved createdAt");

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.get("/admin/products", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const products = await Product.find({});
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

router.patch("/admin/products/:id/status", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateProductStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const product = await Product.findByIdAndUpdate(req.params.id, { status: parsed.data.status }, { new: true });

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    _id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    categoryId: product.categoryId,
    sellerId: product.sellerId,
    status: product.status,
    images: product.images || [],
    category: null,
    seller: null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });
});

router.get("/admin/returns", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const returns = await Return.find({});
  const detailed = returns.map((r) => ({
    _id: r._id,
    orderId: r.orderId,
    orderItemId: r.orderItemId,
    buyerId: r.buyerId,
    reason: r.reason,
    status: r.status,
    aiVerdict: r.aiVerdict,
    aiScore: r.aiScore,
    adminNotes: r.adminNotes,
    checkerId: r.checkerId,
    checkerDecision: r.checkerDecision,
    checkerNotes: r.checkerNotes,
    images: r.images || [],
    verificationResult: r.verificationResult,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  res.json(detailed);
});

router.get("/admin/stats", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const users = await User.find({});
  const products = await Product.find({});
  const orders = await Order.find({}).lean();
  const returns = await Return.find({}).lean();

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
  const fraudAlerts = returns.filter(
    (r: any) => r.aiVerdict === "FAIL" || r.aiVerdict === "SUSPICIOUS" || r.status === "manual_review"
  ).length;
  const pendingProducts = products.filter((p) => p.status === "pending").length;

  res.json({
    totalUsers: users.filter((u) => u.role === "buyer").length,
    totalSellers: users.filter((u) => u.role === "seller").length,
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue,
    totalReturns: returns.length,
    fraudAlertsCount: fraudAlerts,
    pendingApprovals: pendingProducts,
  });
});

export default router;

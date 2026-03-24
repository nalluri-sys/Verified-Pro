import { Router, type IRouter } from "express";
import { Return, Product } from "@workspace/db";
import { AddReturnImageBody, UpdateReturnDecisionBody } from "@workspace/api-zod";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth.js";
import { verifyReturnImages } from "../lib/ai-verifier.js";

const router: IRouter = Router();

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function getReturnWithDetails(returnId: string) {
  const ret = await Return.findById(returnId);
  if (!ret) return null;

  let verificationResult = null;
  if (ret.verificationResult) {
    verificationResult = {
      _id: ret._id,
      returnId: returnId,
      verdict: ret.verificationResult.verdict as "PASS" | "FAIL" | "SUSPICIOUS",
      similarityScore: ret.verificationResult.similarityScore,
      checks: {
        productIdentityMatch: ret.verificationResult.productIdentityMatch || false,
        packagingIntact: ret.verificationResult.packagingIntact || false,
        noVisibleDamage: ret.verificationResult.noVisibleDamage || false,
        correctProduct: ret.verificationResult.correctProduct || false,
        fraudRisk: ret.verificationResult.fraudRisk as "low" | "medium" | "high",
      },
    };
  }

  return {
    _id: ret._id,
    orderId: ret.orderId,
    orderItemId: ret.orderItemId,
    buyerId: ret.buyerId,
    reason: ret.reason,
    status: ret.status,
    aiVerdict: ret.aiVerdict,
    aiScore: ret.aiScore,
    adminNotes: ret.adminNotes,
    checkerId: ret.checkerId,
    checkerDecision: ret.checkerDecision,
    checkerNotes: ret.checkerNotes,
    checkerNotified: ret.checkerNotified || false,
    checkerNotifiedAt: ret.checkerNotifiedAt,
    checkerNotificationMessage: ret.checkerNotificationMessage,
    images: ret.images || [],
    verificationResult,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  };
}

router.get("/returns", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const returns = await Return.find({ buyerId: req.userId! });
  const detailed = await Promise.all(returns.map((r) => getReturnWithDetails(r._id.toString())));
  res.json(detailed.filter(Boolean));
});

router.get("/returns/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const ret = await getReturnWithDetails(id);
  if (!ret) {
    res.status(404).json({ error: "Return not found" });
    return;
  }
  res.json(ret);
});

router.post("/returns", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const orderId = typeof body?.["orderId"] === "string" ? body["orderId"] : String(body?.["orderId"] ?? "");
  const orderItemId = typeof body?.["orderItemId"] === "string" ? body["orderItemId"] : String(body?.["orderItemId"] ?? "");
  const reason = typeof body?.["reason"] === "string" ? body["reason"].trim() : "";

  if (!orderId || !orderItemId || !reason) {
    res.status(400).json({ error: "Invalid request body: orderId, orderItemId and reason are required" });
    return;
  }

  const ret = await Return.create({
    orderId,
    orderItemId,
    buyerId: req.userId!,
    reason,
    status: "pending",
  });

  const detailed = await getReturnWithDetails(ret._id.toString());
  res.status(201).json(detailed);
});

router.post("/returns/:id/images", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const parsed = AddReturnImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const ret = await Return.findById(id);
  if (!ret) {
    res.status(404).json({ error: "Return not found" });
    return;
  }

  const images = ret.images ?? [];
  images.push({ url: parsed.data.url });
  ret.images = images as any;
  await ret.save();

  res.status(201).json({ url: parsed.data.url });
});

router.post("/returns/:id/verify", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const ret = await Return.findById(id);
  if (!ret) {
    res.status(404).json({ error: "Return not found" });
    return;
  }

  // Update status to verifying
  ret.status = "verifying";
  await ret.save();

  // Get return images
  const returnImages = ret.images || [];

  // Get reference product images from order item (placeholder for now)
  let productImages: string[] = [];
  let productName = "";
  // In a real scenario, you'd fetch the product from the order item
  // For now, we'll use a placeholder

  // Run AI verification
  const result = await verifyReturnImages({
    productImages,
    returnImages: returnImages.map((i) => i.url).filter((url): url is string => Boolean(url)),
    productName,
  });

  // Update return with verification result
  ret.verificationResult = {
    verdict: result.verdict,
    similarityScore: result.similarityScore,
    productIdentityMatch: result.checks.productIdentityMatch,
    packagingIntact: result.checks.packagingIntact,
    noVisibleDamage: result.checks.noVisibleDamage,
    correctProduct: result.checks.correctProduct,
    fraudRisk: result.checks.fraudRisk,
  };

  // Update return status based on verdict
  // PASS → checker_review (checker must physically inspect sensitive items)
  // FAIL → rejected
  // SUSPICIOUS → manual_review
  let newStatus: "checker_review" | "rejected" | "manual_review" = "manual_review";
  if (result.verdict === "PASS") newStatus = "checker_review";
  else if (result.verdict === "FAIL") newStatus = "rejected";

  ret.status = newStatus;
  ret.aiVerdict = result.verdict;
  ret.aiScore = result.similarityScore;
  if (newStatus === "checker_review") {
    ret.checkerNotified = true;
    ret.checkerNotifiedAt = new Date();
    ret.checkerNotificationMessage =
      "AI accepted this return. Checker pickup and physical inspection are required.";
  } else {
    ret.checkerNotified = false;
    ret.checkerNotificationMessage = undefined;
  }
  await ret.save();

  res.json({
    _id: ret._id,
    returnId: ret._id,
    verdict: result.verdict,
    similarityScore: result.similarityScore,
    checks: result.checks,
    createdAt: ret.createdAt,
  });
});

router.patch("/returns/:id/decision", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const parsed = UpdateReturnDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const ret = await Return.findById(id);
  if (!ret) {
    res.status(404).json({ error: "Return not found" });
    return;
  }

  ret.status = parsed.data.status;
  ret.adminNotes = parsed.data.adminNotes;
  await ret.save();

  const detailed = await getReturnWithDetails(id);
  res.json(detailed);
});

export default router;

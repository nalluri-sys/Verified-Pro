import { Router, type IRouter } from "express";
import { Return, Category, Product } from "@workspace/db";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function validateInspectBody(body: any): { decision: "approved" | "rejected"; notes?: string; checklist: Record<string, boolean>; category: string } | null {
  if (!body || typeof body !== "object") return null;
  if (body.decision !== "approved" && body.decision !== "rejected") return null;
  if (typeof body.category !== "string" || !body.category) return null;
  if (typeof body.checklist !== "object" || body.checklist === null || Array.isArray(body.checklist)) return null;
  return {
    decision: body.decision,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    checklist: body.checklist,
    category: body.category,
  };
}

async function getReturnWithProductDetails(returnId: string) {
  const ret = await Return.findById(returnId);
  if (!ret) return null;

  let product = null;
  let productImages: any[] = [];
  let category = null;

  // Fetch product details (this would need to be linked via orderItemId -> productId)
  // For now, we'll leave this as a placeholder since MongoDB structure is different
  
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
    verificationResult: ret.verificationResult,
    product,
    productImages,
    category,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  };
}

// GET /checker/returns — list all returns awaiting physical inspection
router.get("/checker/returns", requireAuth, requireRole("checker", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const pendingReturns = await Return.find({
    status: { $in: ["checker_review", "approved", "rejected"] },
  });

  const detailed = await Promise.all(pendingReturns.map((r) => getReturnWithProductDetails(r._id.toString())));
  res.json(detailed.filter(Boolean));
});

// GET /checker/returns/:id — get a single return for inspection
router.get("/checker/returns/:id", requireAuth, requireRole("checker", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const ret = await getReturnWithProductDetails(id);
  if (!ret) {
    res.status(404).json({ error: "Return not found" });
    return;
  }
  res.json(ret);
});

// POST /checker/returns/:id/inspect — submit physical inspection result
router.post("/checker/returns/:id/inspect", requireAuth, requireRole("checker", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const id = firstParam(req.params.id);
  const parsed = validateInspectBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Invalid request body: decision (approved|rejected), category, and checklist are required" });
    return;
  }

  const { decision, notes, checklist, category } = parsed;

  const ret = await Return.findById(id);
  if (!ret) {
    res.status(404).json({ error: "Return not found" });
    return;
  }

  if (ret.status !== "checker_review") {
    res.status(400).json({ error: `Return is in '${ret.status}' status, not ready for inspection` });
    return;
  }

  // Update return status with inspection result
  ret.status = decision === "approved" ? "approved" : "rejected";
  ret.checkerId = req.userId! as any;
  ret.checkerDecision = decision;
  ret.checkerNotes = notes || undefined;
  ret.checkerNotified = false;
  ret.checkerNotificationMessage = undefined;
  
  await ret.save();

  res.json({
    _id: ret._id,
    decision,
    notes,
    checklist,
    category,
    message: `Return ${decision} by checker`,
  });
});

export default router;

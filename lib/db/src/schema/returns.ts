import mongoose from "mongoose";
import { z } from "zod/v4";

const aiVerificationSchema = new mongoose.Schema(
  {
    verdict: { type: String, enum: ["PASS", "FAIL", "SUSPICIOUS"], required: true },
    similarityScore: { type: Number, required: true },
    productIdentityMatch: { type: Boolean, default: false },
    packagingIntact: { type: Boolean, default: false },
    noVisibleDamage: { type: Boolean, default: false },
    correctProduct: { type: Boolean, default: false },
    fraudRisk: { type: String, enum: ["low", "medium", "high"], default: "low" },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verifying", "checker_review", "approved", "rejected", "manual_review"],
      default: "pending",
    },
    aiVerdict: { type: String, enum: ["PASS", "FAIL", "SUSPICIOUS"] },
    aiScore: Number,
    adminNotes: String,
    checkerId: mongoose.Schema.Types.ObjectId,
    checkerDecision: { type: String, enum: ["approved", "rejected"] },
    checkerNotes: String,
    checkerNotified: { type: Boolean, default: false },
    checkerNotifiedAt: Date,
    checkerNotificationMessage: String,
    images: [{ url: String }],
    verificationResult: aiVerificationSchema,
  },
  { timestamps: true }
);

export const Return = mongoose.model("Return", returnSchema);

export interface IAiVerification {
  verdict: "PASS" | "FAIL" | "SUSPICIOUS";
  similarityScore: number;
  productIdentityMatch?: boolean;
  packagingIntact?: boolean;
  noVisibleDamage?: boolean;
  correctProduct?: boolean;
  fraudRisk?: "low" | "medium" | "high";
}

export interface IReturn {
  _id?: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  orderItemId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  reason: string;
  status: "pending" | "verifying" | "checker_review" | "approved" | "rejected" | "manual_review";
  aiVerdict?: "PASS" | "FAIL" | "SUSPICIOUS";
  aiScore?: number;
  adminNotes?: string;
  checkerId?: mongoose.Types.ObjectId;
  checkerDecision?: "approved" | "rejected";
  checkerNotes?: string;
  checkerNotified?: boolean;
  checkerNotifiedAt?: Date;
  checkerNotificationMessage?: string;
  images?: Array<{ url: string }>;
  verificationResult?: IAiVerification;
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertReturnSchema = z.object({
  orderId: z.string(),
  orderItemId: z.string(),
  buyerId: z.string(),
  reason: z.string(),
  status: z.enum(["pending", "verifying", "checker_review", "approved", "rejected", "manual_review"]).optional(),
});

export const insertReturnImageSchema = z.object({
  url: z.string(),
});

export const insertAiVerificationSchema = z.object({
  verdict: z.enum(["PASS", "FAIL", "SUSPICIOUS"]),
  similarityScore: z.number(),
  productIdentityMatch: z.boolean().optional(),
  packagingIntact: z.boolean().optional(),
  noVisibleDamage: z.boolean().optional(),
  correctProduct: z.boolean().optional(),
  fraudRisk: z.enum(["low", "medium", "high"]).optional(),
});

export const insertCheckerInspectionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
  checklist: z.record(z.string(), z.boolean()),
  category: z.string(),
});

export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type ReturnImage = z.infer<typeof insertReturnImageSchema>;
export type AiVerificationResult = IAiVerification;
export type CheckerInspection = z.infer<typeof insertCheckerInspectionSchema>;

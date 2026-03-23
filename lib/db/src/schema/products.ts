import mongoose from "mongoose";
import { z } from "zod/v4";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    categoryId: mongoose.Schema.Types.ObjectId,
    sellerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    images: [{ url: String, isPrimary: { type: Boolean, default: false } }],
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);

export interface IProduct {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId?: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  images?: Array<{ url: string; isPrimary?: boolean }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  stock: z.number().optional(),
  categoryId: z.string().optional(),
  sellerId: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  images: z.array(z.object({ url: z.string(), isPrimary: z.boolean().optional() })).optional(),
});

export const insertProductImageSchema = z.object({
  url: z.string(),
  isPrimary: z.boolean().optional(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductImage = z.infer<typeof insertProductImageSchema>;

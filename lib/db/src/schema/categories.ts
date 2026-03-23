import mongoose from "mongoose";
import { z } from "zod/v4";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);

export interface ICategory {
  _id?: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;

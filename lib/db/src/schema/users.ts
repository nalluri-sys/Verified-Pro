import mongoose from "mongoose";
import { z } from "zod/v4";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin", "checker"],
      default: "buyer",
    },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "buyer" | "seller" | "admin" | "checker";
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(["buyer", "seller", "admin", "checker"]).optional(),
  isApproved: z.boolean().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

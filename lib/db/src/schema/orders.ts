import mongoose from "mongoose";
import { z } from "zod/v4";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
}, { _id: true });

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
}

export interface IOrder {
  _id?: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  shippingAddress: string;
  items: IOrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const insertOrderSchema = z.object({
  buyerId: z.string(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
  totalAmount: z.number(),
  shippingAddress: z.string(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number(), unitPrice: z.number() })).optional(),
});

export const insertOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = IOrderItem;

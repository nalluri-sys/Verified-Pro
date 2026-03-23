import mongoose from "mongoose";
import * as schema from "./schema";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provision a database?",
  );
}

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export { schema };
export * from "./schema";

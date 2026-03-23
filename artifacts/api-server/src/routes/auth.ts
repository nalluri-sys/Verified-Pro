import { Router, type IRouter } from "express";
import crypto from "crypto";
import { User } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { signToken } from "../lib/jwt.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw + "salt123").digest("hex");
}

const ALL_ROLES = ["buyer", "seller", "admin", "checker"] as const;
type AllRole = typeof ALL_ROLES[number];

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, role: rawRole } = req.body ?? {};
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const role: AllRole = (ALL_ROLES as readonly string[]).includes(rawRole)
    ? (rawRole as AllRole)
    : "buyer";
  
  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  
  const user = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role,
    isApproved: true,
  });
  
  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.status(201).json({ 
    token, 
    user: { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      isApproved: user.isApproved 
    } 
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password, role: selectedRole } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  
  const user = await User.findOne({ email });
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  
  // If a role was selected, verify it matches the account's actual role
  if (selectedRole && (ALL_ROLES as readonly string[]).includes(selectedRole) && user.role !== selectedRole) {
    res.status(401).json({ error: `This account is registered as a ${user.role}, not a ${selectedRole}` });
    return;
  }
  
  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.json({ 
    token, 
    user: { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      isApproved: user.isApproved 
    } 
  });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = await User.findById(req.userId!);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ 
    _id: user._id, 
    name: user.name, 
    email: user.email, 
    role: user.role, 
    isApproved: user.isApproved 
  });
});

export default router;

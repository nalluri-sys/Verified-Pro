import { Router, type IRouter } from "express";
import { Category } from "@workspace/db";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await Category.find({});
  res.json(categories);
});

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import productsRouter from "./products.js";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import returnsRouter from "./returns.js";
import sellerRouter from "./seller.js";
import adminRouter from "./admin.js";
import checkerRouter from "./checker.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(returnsRouter);
router.use(sellerRouter);
router.use(adminRouter);
router.use(checkerRouter);

export default router;

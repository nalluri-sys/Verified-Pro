import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import fsSync from "fs";
import fs from "fs/promises";
import path from "path";
import router from "./routes";

const frontendRoot = fsSync.existsSync(path.resolve(process.cwd(), "artifacts/ecommerce"))
	? path.resolve(process.cwd(), "artifacts/ecommerce")
	: path.resolve(process.cwd(), "../ecommerce");
const frontendDist = path.resolve(frontendRoot, "dist/public");

export async function createApp(): Promise<Express> {
	const app: Express = express();

	app.use(cors());
	app.use(express.json({ limit: "15mb" }));
	app.use(express.urlencoded({ extended: true, limit: "15mb" }));

	app.use("/api", router);

	if (process.env.NODE_ENV === "development") {
		if (!process.env.BASE_PATH) {
			process.env.BASE_PATH = "/";
		}

		const { createServer } = await import("vite");
		const vite = await createServer({
			root: frontendRoot,
			appType: "custom",
			server: {
				middlewareMode: true,
			},
		});

		app.use(vite.middlewares);
		app.use(/^\/(?!api\/).*/, async (req, res, next) => {
			try {
				const templatePath = path.resolve(frontendRoot, "index.html");
				const template = await fs.readFile(templatePath, "utf-8");
				const html = await vite.transformIndexHtml(req.originalUrl, template);
				res.status(200).set({ "Content-Type": "text/html" }).end(html);
			} catch (error) {
				if (error instanceof Error) {
					vite.ssrFixStacktrace(error);
				}
				next(error);
			}
		});
	} else {
		app.use(express.static(frontendDist));
		app.use(/^\/(?!api\/).*/, (_req, res) => {
			res.sendFile(path.resolve(frontendDist, "index.html"));
		});
	}

	app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
		const payloadErr = err as { type?: string; status?: number; message?: string };
		if (payloadErr?.type === "entity.too.large" || payloadErr?.status === 413) {
			res.status(413).json({ error: "Uploaded image is too large. Please use a smaller image." });
			return;
		}
		next(err);
	});

	return app;
}

export default createApp;

import express, {
  Request,
  Response,
  NextFunction,
} from "express";

import { createProxyMiddleware } from "http-proxy-middleware";

import { getContainerPort } from "./containers/handleContainerCreate";

const app = express();

app.use(
  "/project/:projectId",
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectId:any = req.params.projectId;

      if (!projectId) {
        return res.status(400).send("Project ID missing");
      }

      const port = await getContainerPort(projectId);

      if (!port) {
        return res.status(404).send("Project not found");
      }

      const proxy = createProxyMiddleware({
        target: `http://127.0.0.1:${port}`,
        changeOrigin: true,
        ws: true,
      });

      return proxy(req, res, next);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }
);

app.listen(5000, () => {
  console.log("Preview router running on port 5000");
});
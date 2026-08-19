import express, {
  Request,
  Response,
  NextFunction,
} from "express";

import http from "http";

import {
  createProxyMiddleware,
  RequestHandler,
} from "http-proxy-middleware";

import { getContainerPort } from "./containers/handleContainerCreate";

const app = express();

/**
 * Cache one proxy per container port.
 *
 * Example:
 * 32771 -> http://127.0.0.1:32771
 * 32772 -> http://127.0.0.1:32772
 */
const proxyCache = new Map<number, RequestHandler>();


/**
 * Create/get proxy for a Docker host port
 */
function getProxy(port: number): RequestHandler {
  if (!proxyCache.has(port)) {
    const proxy = createProxyMiddleware({
      target: `http://127.0.0.1:${port}`,

      changeOrigin: true,

      ws: true,

      xfwd: true,

      proxyTimeout: 30000,

      timeout: 30000,
    });

    proxyCache.set(port, proxy);
  }

  return proxyCache.get(port)!;
}


/**
 * Extract projectId from:
 *
 * fec84934.protodev.me
 *
 * or:
 *
 * fec84934-d995-4351-abe4-78e4163a2943.protodev.me
 */
function getProjectId(host: string | undefined): string | null {
  if (!host) {
    return null;
  }

  const hostname = host.split(":")[0];

  if (!hostname) {
    return null;
  }

  const suffix = ".protodev.me";

  if (!hostname.endsWith(suffix)) {
    return null;
  }

  const projectId = hostname.slice(
    0,
    hostname.length - suffix.length
  );

  if (!projectId) {
    return null;
  }

  return projectId;
}

/**
 * HTTP requests
 *
 * Browser:
 *
 * https://PROJECT_ID.protodev.me
 *
 *        ↓
 *
 * Nginx :80
 *
 *        ↓
 *
 * Preview Router :5001
 *
 *        ↓
 *
 * Docker :32771
 */
app.use(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectId = getProjectId(
        req.headers.host
      );

      if (!projectId) {
        return res
          .status(400)
          .send("Invalid preview domain");
      }

      /**
       * IMPORTANT:
       *
       * This function should ONLY return
       * the existing container's host port.
       *
       * It should NOT create a container.
       */
      const port = await getContainerPort(
        projectId
      );

      if (!port) {
        return res
          .status(404)
          .send("Project not found");
      }

      console.log(
        `[PREVIEW] ${projectId} -> ${port}`
      );

      const proxy = getProxy(
        Number(port)
      );

      return proxy(req, res, next);

    } catch (error) {
      console.error(
        "[PREVIEW ERROR]",
        error
      );

      return res
        .status(500)
        .send("Preview server error");
    }
  }
);


/**
 * HTTP server
 *
 * We use http.createServer instead of
 * app.listen() because we need to handle
 * WebSocket upgrade requests.
 */
const server = http.createServer(app);


/**
 * WebSocket / Vite HMR
 *
 * This is important for:
 *
 * ws://
 * wss://
 *
 * and Vite hot reload.
 */
server.on(
  "upgrade",
  async (
    req,
    socket,
    head
  ) => {
    try {
      const projectId = getProjectId(
        req.headers.host
      );

      if (!projectId) {
        socket.destroy();
        return;
      }

      /**
       * Get existing container port.
       */
      const port = await getContainerPort(
        projectId
      );

      if (!port) {
        socket.destroy();
        return;
      }

      console.log(
        `[PREVIEW WS] ${projectId} -> ${port}`
      );

      const proxy = getProxy(
        Number(port)
      );

      const upgrade =
        (proxy as any).upgrade;

      if (!upgrade) {
        socket.destroy();
        return;
      }

      upgrade(
        req,
        socket,
        head
      );

    } catch (error) {
      console.error(
        "[PREVIEW WS ERROR]",
        error
      );

      socket.destroy();
    }
  }
);



server.listen(
  5000,
  "0.0.0.0",
  () => {
    console.log(
      "Preview Router running on port 5001"
    );
  }
);
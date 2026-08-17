import express from "express";
import http from "http";
import {
    createProxyMiddleware,
    RequestHandler,
} from "http-proxy-middleware";
import { getContainerPort } from "./containers/handleContainerCreate";



const app = express();

const proxyCache = new Map<string, RequestHandler>();

function getProxy(port: string): RequestHandler {
    if (!proxyCache.has(port)) {
        const proxy = createProxyMiddleware({
            target: `http://127.0.0.1:${port}`,
            changeOrigin: true,
            ws: true,
            xfwd: true,
        });

        proxyCache.set(port, proxy);
    }

    return proxyCache.get(port)!;
}

app.use(async (req, res, next) => {
    try {
        const host = req.headers.host;

        if (!host) {
            return res.status(400).send("Host header missing");
        }

        const hostname:any = host.split(":")[0];

        const projectId = hostname.split(".")[0];

        if (!projectId) {
            return res.status(400).send("Invalid project id");
        }

        const port = await getContainerPort(projectId);

        if (!port) {
            return res.status(404).send("Project not found");
        }

        console.log(
            `[PREVIEW] ${projectId} -> localhost:${port}`
        );

        return getProxy(port)(req, res, next);
    } catch (error) {
        console.error("Preview Router Error:", error);

        return res.status(500).send("Internal Server Error");
    }
});

const server = http.createServer(app);

server.on("upgrade", async (req, socket, head) => {
    try {
        const host = req.headers.host;

        if (!host) {
            socket.destroy();
            return;
        }

        const hostname:any = host.split(":")[0];

        const projectId = hostname.split(".")[0];

        const port = await getContainerPort(projectId);

        if (!port) {
            socket.destroy();
            return;
        }

        const proxy = getProxy(port);

        const upgradeFn = (proxy as any).upgrade;

        if (!upgradeFn) {
            socket.destroy();
            return;
        }

        upgradeFn(req, socket, head);
    } catch (error) {
        console.error("WS Proxy Error:", error);
        socket.destroy();
    }
});

server.listen(5000, "0.0.0.0", () => {
    console.log(
        "Preview router running on http://0.0.0.0:5000"
    );
});
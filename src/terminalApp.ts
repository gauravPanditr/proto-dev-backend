import express from "express";
import cors from "cors";
import { createServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";

import { handleContainerCreate } from "./containers/handleContainerCreate.js";
import { handleTerminalCreation } from "./containers/handleTerminalCreation.js";

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

server.listen(4000, () => {
    console.log("Server is running on port 4000");
    console.log(process.cwd());
});

const webSocketForTerminal = new WebSocketServer({
    server,
});

webSocketForTerminal.on(
    "connection",
    async (ws: WebSocket, req: IncomingMessage) => {
        try {
            const url = req.url;

            if (!url) {
                ws.close();
                return;
            }

            const isTerminal = url.includes("/terminal");

            if (!isTerminal) {
                ws.close();
                return;
            }

            const projectId = url.split("=")[1];

            if (!projectId) {
                ws.close();
                return;
            }

            console.log(
                "Project id received after connection",
                projectId
            );

            const container = await handleContainerCreate(
                projectId
            );

            if (!container) {
                ws.close();
                return;
            }

            handleTerminalCreation(container, ws);
        } catch (error) {
            console.error("WebSocket error:", error);
            ws.close();
        }
    }
);
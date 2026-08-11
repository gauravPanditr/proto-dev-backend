import express from "express";
import cors from "cors";
import { createServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";

import { handleContainerCreate } from "./containers/handleContainerCreate";
import { handleTerminalCreation } from "./containers/handleTerminalCreation";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const server = createServer(app);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Working Directory:", process.cwd());
});

/**
 * Terminal WebSocket Server
 */
const webSocketForTerminal = new WebSocketServer({
  server,
  path: "/terminal",
});

webSocketForTerminal.on(
  "connection",
  async (ws: WebSocket, req: IncomingMessage) => {
    try {
      console.log("WebSocket Connected");
      console.log("REQ URL =", req.url);

      if (!req.url) {
        ws.close();
        return;
      }

      const projectId = new URL(
        `http://localhost${req.url}`
      ).searchParams.get("projectId");

      if (!projectId) {
        console.log("Project ID missing");
        ws.close();
        return;
      }

      console.log("Project ID:", projectId);

      const result = await handleContainerCreate(projectId);

      if (!result) {
        console.log("Container creation failed");
        ws.close();
        return;
      }

      const { container, port } = result;

      console.log("Container Created");
      console.log("Port:", port);

      ws.send(
        JSON.stringify({
          event: "getPortSuccess",
          port,
        })
      );

      await handleTerminalCreation(container, ws);
    } catch (error) {
      console.error("Terminal WebSocket Error:", error);
      ws.close();
    }
  }
);
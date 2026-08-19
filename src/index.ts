import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { Server } from "socket.io";
import { createServer } from "node:http";
import chokidar, { FSWatcher } from "chokidar";
import cors from "cors";
import path from "path";

import apiRouter from "./routes/index";
import { handleEditorSocketEvents } from "./scoketHandler/editorHandler";
import { PROJECTS_ROOT } from "./config/serverConfig";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", apiRouter);

io.on("connection", () => {
  console.log("a user connected");
});

const editorNameSpace = io.of("/editor");

editorNameSpace.on("connection", (socket) => {
  console.log("editor connected");

  const projectId = socket.handshake.query["projectId"];

  console.log("Project id received after connection:", projectId);

  let watcher: FSWatcher | undefined;

  if (projectId && typeof projectId === "string") {
    const projectPath = path.join(PROJECTS_ROOT, projectId);

    console.log("Watching project path:", projectPath);

    watcher = chokidar.watch(projectPath, {
      ignored: (filePath: string) =>
        filePath.includes("node_modules"),

      persistent: true,

      awaitWriteFinish: {
        stabilityThreshold: 2000,
      },

      ignoreInitial: true,
    });

    watcher.on(
      "all",
      (event: string, filePath: string) => {
        console.log(event, filePath);
      }
    );
  }

  handleEditorSocketEvents(
    socket,
    editorNameSpace
  );

  socket.on("message", async (data) => {
    if (watcher) {
      await watcher.close();
      console.log("Project watcher closed");
    }

    console.log("got a message", data);
  });

  socket.on("disconnect", async () => {
    if (watcher) {
      await watcher.close();
      console.log("Project watcher closed after disconnect");
    }

    console.log("editor disconnected");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
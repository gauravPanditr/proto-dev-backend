import express from "express";
import cors from "cors";
import { createServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";

import { handleContainerCreate } from "./containers/handleContainerCreate";
import { handleTerminalCreation } from "./containers/handleTerminalCreation";

const app = express();

const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// ============================================================
// TERMINAL SERVER
// ============================================================

const webSocketForTerminal =
    new WebSocketServer({
        server,
    });


// ============================================================
// WEBSOCKET CONNECTION
// ============================================================

webSocketForTerminal.on(
    "connection",
    async (
        ws: WebSocket,
        req: IncomingMessage
    ) => {

        try {

            if (!req.url) {

                ws.close();

                return;
            }


            // =================================================
            // Parse URL
            //
            // /terminal?projectId=123
            // =================================================

            const url = new URL(
                req.url,
                `http://${req.headers.host || "localhost"}`
            );


            // =================================================
            // Only allow /terminal
            // =================================================

            if (
                url.pathname !==
                "/terminal"
            ) {

                console.log(
                    "Invalid WebSocket path:",
                    url.pathname
                );

                ws.close();

                return;
            }


            // =================================================
            // Get project ID
            // =================================================

            const projectId =
                url.searchParams.get(
                    "projectId"
                );


            if (!projectId) {

                console.log(
                    "Project ID missing"
                );

                ws.close();

                return;
            }


            console.log(
                "Project ID received after WebSocket connection:",
                projectId
            );


            // =================================================
            // Create / find project container
            // =================================================

            const result =
                await handleContainerCreate(
                    projectId
                );


            if (!result) {

                console.log(
                    "Container creation failed"
                );

                ws.close();

                return;
            }


            // =================================================
            // Get container
            // =================================================

            const {
                container,
            } = result;


            console.log(
                "Sandbox container ready:",
                container.id
            );


            // =================================================
            // IMPORTANT
            //
            // We DO NOT send a random port anymore.
            //
            // Traefik handles project preview:
            //
            // projectId.protodev.me
            //
            // Terminal is handled separately through:
            //
            // terminal.protodev.me
            // =================================================


            ws.send(
                JSON.stringify({
                    event:
                        "containerReady",

                    projectId,
                })
            );


            // =================================================
            // Attach terminal
            // =================================================

            handleTerminalCreation(
                container,
                ws
            );


        } catch (error) {

            console.error(
                "WebSocket error:",
                error
            );


            if (
                ws.readyState ===
                WebSocket.OPEN
            ) {

                ws.close();
            }
        }
    }
);


// ============================================================
// HTTP SERVER
// ============================================================

server.listen(
    4000,
    "0.0.0.0",
    () => {

        console.log(
            "Terminal server running on port 4000"
        );

        console.log(
            "Terminal WebSocket:",
           
        );

        console.log(
            "Current working directory:",
            process.cwd()
        );
    }
);
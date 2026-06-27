import Docker from "dockerode";
import WebSocket from "ws";
import { Duplex } from "stream";

export const handleTerminalCreation = (
    container: Docker.Container,
    ws: WebSocket
): void => {
    container.exec(
        {
            Cmd: ["/bin/bash"],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            User: "sandbox",
        },
        (err, exec) => {
            if (err || !exec) {
                console.error("Error while creating exec", err);
                return;
            }

            exec.start(
                {
                    hijack: true,
                },
                (err, stream) => {
                    if (err || !stream) {
                        console.error("Error while starting exec", err);
                        return;
                    }

                    processStreamOutput(stream as Duplex, ws);

                    ws.on("message", (data: WebSocket.RawData) => {
                        const message = data.toString();

                      
                        try {
                            const parsed = JSON.parse(message);
                            if (parsed.event) return;
                        } catch {
                           
                        }

                        stream.write(data);
                    });
                }
            );
        }
    );
};

function processStreamOutput(
    stream: Duplex,
    ws: WebSocket
): void {
    let nextDataType: number | null = null;
    let nextDataLength: number | null = null;
    let buffer: Buffer = Buffer.alloc(0);

    function processStreamData(data?: Buffer): void {
        if (data) {
            buffer = Buffer.concat([buffer, data]);
        }

        if (nextDataType === null) {
            if (buffer.length >= 8) {
                const header = bufferSlicer(8);

                nextDataType = header.readUInt32BE(0);
                nextDataLength = header.readUInt32BE(4);

                processStreamData();
            }
        } else {
            if (
                nextDataLength !== null &&
                buffer.length >= nextDataLength
            ) {
                const content = bufferSlicer(nextDataLength);

                ws.send(content);

                nextDataType = null;
                nextDataLength = null;

                processStreamData();
            }
        }
    }

    function bufferSlicer(end: number): Buffer {
        const output = buffer.slice(0, end);
        buffer = buffer.slice(end);
        return output;
    }

    stream.on("data", (chunk: Buffer) => {
        processStreamData(chunk);
    });
}
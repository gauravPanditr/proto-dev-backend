import { tool } from "ai";
import { z } from "zod";
import * as fileTools from "./tools";

export function buildAiTools(projectId: string) {
    return {
        list_files: tool({
            description: "List files and folders at a given path inside the project.",
            inputSchema: z.object({
                path: z.string().describe("e.g. '.' or 'src/components'"),
            }),
            execute: async ({ path }) => {
                return await fileTools.listFiles(projectId, path);
            },
        }),

        read_file: tool({
            description: "Read the contents of a file inside the project.",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async ({ path }) => {
                return await fileTools.readFile(projectId, path);
            },
        }),

        write_file: tool({
            description: "Create or overwrite a file with given content. Creates parent folders if needed.",
            inputSchema: z.object({
                path: z.string(),
                content: z.string(),
            }),
            execute: async ({ path, content }) => {
                return await fileTools.writeFile(projectId, path, content);
            },
        }),

        delete_file: tool({
            description: "Delete a file or folder (recursively) inside the project.",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async ({ path }) => {
                return await fileTools.deleteFile(projectId, path);
            },
        }),
    };
}
import fs from "fs/promises";
import path from "path";
import { resolveProjectPath } from "./pathUtils";

export async function listFiles(projectId: string, relDir: string = ".") {
    const dir = resolveProjectPath(projectId, relDir);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.map(e => ({ name: e.name, type: e.isDirectory() ? "dir" : "file" }));
}

export async function readFile(projectId: string, relPath: string) {
    const filePath = resolveProjectPath(projectId, relPath);
    const data = await fs.readFile(filePath);
    return data.toString();
}

export async function writeFile(projectId: string, relPath: string, content: string) {
    const filePath = resolveProjectPath(projectId, relPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    return { success: true, path: relPath };
}

export async function deleteFile(projectId: string, relPath: string) {
    const filePath = resolveProjectPath(projectId, relPath);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
    } else {
        await fs.unlink(filePath);
    }
    return { success: true, path: relPath };
}
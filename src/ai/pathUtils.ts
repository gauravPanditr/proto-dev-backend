import path from "path";
import { PROJECTS_ROOT } from "../config/serverConfig";

export function resolveProjectPath(projectId: string, relativePath: string = "."): string {
    if (!/^[a-zA-Z0-9-]+$/.test(projectId)) {
        throw new Error("Invalid projectId");
    }

    // scope AI access to the sandbox subfolder, not the whole project folder
    const projectRoot = path.join(PROJECTS_ROOT, projectId, "sandbox");
    const target = path.resolve(projectRoot, relativePath);

    if (target !== projectRoot && !target.startsWith(projectRoot + path.sep)) {
        throw new Error("Path escapes project root");
    }

    return target;
}
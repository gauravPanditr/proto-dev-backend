import { randomUUID } from "crypto";
import fs from "fs/promises";
import {
    REACT_PROJECT_COMMAND,
    PROJECTS_ROOT,
} from "../config/serverConfig";
import { execPromisified } from "../utils/execUtility";
import path from "path";
import directoryTree from "directory-tree";

export const projectCreateService = async () => {
    const projectId = randomUUID();

    const projectPath = path.join(PROJECTS_ROOT, projectId);

    await fs.mkdir(projectPath, { recursive: true });

    await execPromisified(REACT_PROJECT_COMMAND, {
        cwd: projectPath,
    });

    return projectId;
};

export const getProjectTreeService = async (projectId: string) => {
    const projectPath = path.join(PROJECTS_ROOT, projectId);

    const tree = directoryTree(projectPath);

    return tree;
};
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

    const projectPath = path.join(
        PROJECTS_ROOT,
        projectId
    );

    console.log("Creating project:", projectId);
    console.log("Project path:", projectPath);

    try {
        // Create project directory
        await fs.mkdir(projectPath, {
            recursive: true,
        });

        console.log("Project directory created");

        // Create React/Vite project
        await execPromisified(
            REACT_PROJECT_COMMAND,
            {
                cwd: projectPath,
            }
        );

        console.log("Project files created");

       
        await execPromisified(
            `chown -R 1000:1000 "${projectPath}"`,
            {}
        );

        console.log(
            "Project ownership changed to 1000:1000"
        );

        return projectId;

    } catch (error) {
        console.error(
            "Error creating project:",
            error
        );

        
        try {
            await fs.rm(projectPath, {
                recursive: true,
                force: true,
            });
        } catch (cleanupError) {
            console.error(
                "Error cleaning project:",
                cleanupError
            );
        }

        throw error;
    }
};


export const getProjectTreeService = async (
    projectId: string
) => {
    const projectPath = path.join(
        PROJECTS_ROOT,
        projectId
    );

    console.log(
        "Getting project tree:",
        projectPath
    );

    const tree = directoryTree(
        projectPath
    );

    return tree;
};
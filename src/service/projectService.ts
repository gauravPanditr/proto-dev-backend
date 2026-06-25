import { randomUUID } from "crypto";
import fs from "fs/promises"
import { REACT_PROJECT_COMMAND } from "../config/serverConfig";
import { execPromisified } from "../utils/execUtility";
import path from "path";
import directoryTree from "directory-tree";

export  const projectCreateService=async ()=>{
     const projectId=randomUUID();
         
        console.log(projectId);

    await fs.mkdir(`./projects/${projectId}`);
    await execPromisified(REACT_PROJECT_COMMAND,{
        cwd:`./projects/${projectId}`
    });

    return projectId;
}

export const getProjectTreeService=async (projectId:string)=>{
    const projectPath=path.resolve(`./projects/${projectId}`);
    const tree=directoryTree(projectPath);
    return tree;

}
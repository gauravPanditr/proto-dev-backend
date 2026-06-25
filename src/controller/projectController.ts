import {  Response} from "express";
import util from "util";
import  child_Process  from "child_process";
import { randomUUID } from "crypto";
import fs from "fs/promises"

export const execPromisified=util.promisify(child_Process.exec)
export const projectController=async(res:Response)=>{
     const projectId=randomUUID();
         
        console.log(projectId);

    await fs.mkdir(`./projects/${projectId}`);
    await execPromisified('npm create vite@latest sandbox --template react',{
        cwd:`./projects/${projectId}`
    });
      return res.json({message:"Project created",data:projectId});

}
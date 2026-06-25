import {  Request, Response} from "express";

import {getProjectTreeService, projectCreateService} from "../service/projectService";
import { ProjectParams } from "../types/project";




export const createProject=async(res:Response)=>{
    const projectId=await projectCreateService();
      return res.json({message:"Project created",data:projectId});

}
export const getProjectTree=async(req:Request<ProjectParams>,res:Response)=>{
  const tree=await getProjectTreeService(req.params.projectId);
  return res.status(200).json({
    data:tree,
    success:true,
    message:"Successfully fetched the tree"
  })

}
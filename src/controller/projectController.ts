import type { Request, Response } from "express";
import {
  getProjectTreeService,
  projectCreateService,
} from "../service/projectService";
import { ProjectParams } from "../types/project";

export const createProject = async (
  _req: Request,
  res: Response
) => {
  try {
    const projectId =
      await projectCreateService();

    return res.status(201).json({
      message: "Project created",
      data: projectId,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

export const getProjectTree = async (
  req: Request<ProjectParams>,
  res: Response
) => {
  const tree =
    await getProjectTreeService(
      req.params.projectId
    );

  return res.status(200).json({
    data: tree,
    success: true,
    message:
      "Successfully fetched the tree",
  });
};
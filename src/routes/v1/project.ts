import express from "express";
import { createProject, getProjectTree } from "../../controller/projectController";
const router=express.Router();


router.post("/",createProject)
router.get("/:projectId/tree",getProjectTree)
export default router;
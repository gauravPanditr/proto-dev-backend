import express from "express";
import { handleAgentChat } from "../../controller/agent.controller";
const router=express.Router();


router.post("/",handleAgentChat)

export default router;
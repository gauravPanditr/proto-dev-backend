import express from 'express';
import  {pingCheck } from '../../controller/pingController';
import projectRouter from "./project"
import agentchat from "./agent.routes"

const router = express.Router();

router.use('/ping', pingCheck);
router.use('/projects',projectRouter)
router.use('/agent',agentchat)
export default router;
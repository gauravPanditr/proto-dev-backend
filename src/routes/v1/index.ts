import express from 'express';
import  {pingCheck } from '../../controller/pingController';
import projectRouter from "./project"
const router = express.Router();

router.use('/ping', pingCheck);
router.use('/projects',projectRouter)
export default router;
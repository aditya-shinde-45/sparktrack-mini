import express from 'express';
import { createAssignedExternal } from '../controller/assignexternalsContoller.js';

const router = express.Router();

router.post('/assign-external', createAssignedExternal);

export default router;

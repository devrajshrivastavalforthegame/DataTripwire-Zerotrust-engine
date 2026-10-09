import { Router } from "express";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import { behaviorController } from "../controllers/behavior.controller.js";
const router = Router();
router.post("/", authenticate, requireActiveSession, behaviorController);
export default router;

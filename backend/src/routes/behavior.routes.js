import { Router } from "express";
import { authenticate, requireActiveSession, requirePortal } from "../middleware/auth.middleware.js";
import { behaviorController } from "../controllers/behavior.controller.js";
const router = Router();
router.post("/", authenticate, requirePortal("employee"), requireActiveSession, behaviorController);
export default router;

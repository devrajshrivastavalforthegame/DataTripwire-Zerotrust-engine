import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { behaviorController } from "../controllers/behavior.controller.js";
const router = Router();
router.post("/", authenticate, behaviorController);
export default router;

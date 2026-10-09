import { Router } from "express";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import { behaviorController } from "../controllers/behavior.controller.js";

const router = Router();

// Only active sessions may submit telemetry. Once restricted or quarantined,
// a session must not keep using the behavior endpoint as an alternate API path.
router.post("/", authenticate, requireActiveSession, behaviorController);

export default router;

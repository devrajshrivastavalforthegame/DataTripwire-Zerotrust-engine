import { Router } from "express";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import { behaviorController } from "../controllers/behavior.controller.js";
import { rebuildBaseline, getBaseline } from "../controllers/baseline.controller.js";
import { decoyController } from "../controllers/deception.controller.js";
import { listSessions, sessionTimeline, listAudit } from "../controllers/security.controller.js";

const router = Router();
router.post("/events", authenticate, behaviorController);
router.post("/baseline/rebuild", authenticate, requireActiveSession, rebuildBaseline);
router.get("/baseline", authenticate, getBaseline);
router.get("/sessions", authenticate, listSessions);
router.get("/sessions/:sessionId/timeline", authenticate, sessionTimeline);
router.get("/audit", authenticate, listAudit);
router.get("/finance/archive/backup", authenticate, decoyController);
export default router;

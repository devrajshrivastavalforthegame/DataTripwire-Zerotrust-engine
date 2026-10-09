import { Router } from "express";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import { behaviorController } from "../controllers/behavior.controller.js";
import { rebuildBaseline, getBaseline } from "../controllers/baseline.controller.js";
import { decoyController } from "../controllers/deception.controller.js";
import { listSessions, sessionTimeline, listAudit } from "../controllers/security.controller.js";
import { getOverview } from "../controllers/overview.controller.js";
import { listActivity } from "../controllers/activity.controller.js";
import { listUsersRisk } from "../controllers/users-risk.controller.js";
import { listResources } from "../controllers/resources.controller.js";
import { listIncidents } from "../controllers/incidents.controller.js";
import {
    getPolicies,
    getAdaptiveResponses,
    restrictSession,
    quarantineSession,
    releaseSession
} from "../controllers/response.controller.js";
import { requirePermission } from "../middleware/authorization.middleware.js";
import { requireProtectedAction } from "../middleware/policy.middleware.js";

const router = Router();

router.post(
    "/events",
    authenticate,
    requireActiveSession,
    behaviorController
);

router.get(
    "/overview",
    authenticate,
    requirePermission("overview", "read"),
    getOverview
);

router.get(
    "/incidents",
    authenticate,
    requirePermission("incidents", "read"),
    listIncidents
);
router.get(
    "/resources",
    authenticate,
    requirePermission("resources", "read"),
    listResources
);
router.get(
    "/users-risk",
    authenticate,
    requirePermission("users", "read"),
    listUsersRisk
);
router.get(
    "/activity",
    authenticate,
    requirePermission("audit", "read"),
    listActivity
);

router.post(
    "/baseline/rebuild",
    authenticate,
    requirePermission("baseline", "manage"),
    requireProtectedAction,
    requireActiveSession,
    rebuildBaseline
);

router.get(
    "/baseline",
    authenticate,
    requirePermission("baseline", "read"),
    getBaseline
);

router.get(
    "/sessions",
    authenticate,
    requirePermission("sessions", "read"),
    listSessions
);

router.get(
    "/sessions/:sessionId/timeline",
    authenticate,
    requirePermission("sessions", "read"),
    sessionTimeline
);

router.get(
    "/audit",
    authenticate,
    requirePermission("audit", "read"),
    listAudit
);

router.get(
    "/finance/archive/backup",
    authenticate,
    requirePermission("deception", "trigger"),
    requireProtectedAction,
    requireActiveSession,
    decoyController
);

router.get(
    "/policies",
    authenticate,
    requirePermission("policies", "read"),
    getPolicies
);

router.get(
    "/responses",
    authenticate,
    requirePermission("response", "read"),
    getAdaptiveResponses
);

router.post(
    "/sessions/:sessionId/restrict",
    authenticate,
    requirePermission("sessions", "restrict"),
    restrictSession
);

router.post(
    "/sessions/:sessionId/quarantine",
    authenticate,
    requirePermission("sessions", "quarantine"),
    quarantineSession
);

router.post(
    "/sessions/:sessionId/release",
    authenticate,
    requirePermission("sessions", "release"),
    releaseSession
);

export default router;

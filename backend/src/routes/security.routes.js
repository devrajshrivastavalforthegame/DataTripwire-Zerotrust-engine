import { Router } from "express";
import { authenticate, requireActiveSession, requirePortal } from "../middleware/auth.middleware.js";
import { behaviorController } from "../controllers/behavior.controller.js";
import { rebuildBaseline, getBaseline } from "../controllers/baseline.controller.js";
import { decoyController } from "../controllers/deception.controller.js";
import { listSessions, sessionTimeline, listAudit } from "../controllers/security.controller.js";
import { getOverview } from "../controllers/overview.controller.js";
import { listActivity } from "../controllers/activity.controller.js";
import { listUsersRisk } from "../controllers/users-risk.controller.js";
import { listResources, updateSecurityResource } from "../controllers/resources.controller.js";
import { listIncidents, resolveIncident } from "../controllers/incidents.controller.js";
import {
    getPolicies,
    getAdaptiveResponses,
    restrictSession,
    quarantineSession,
    releaseSession
} from "../controllers/response.controller.js";
import { requirePermission } from "../middleware/authorization.middleware.js";
import { requireProtectedAction } from "../middleware/policy.middleware.js";
import { getExposure } from "../controllers/exposure.controller.js";

const router = Router();
router.use(authenticate, requirePortal("admin"));

// Data-exposure analytics are admin-only and require audit-read permission.
router.get("/data-exposure", requirePermission("audit", "read"), getExposure);

router.post(
    "/events",
    requireActiveSession,
    behaviorController
);

router.get(
    "/overview",
    requirePermission("overview", "read"),
    getOverview
);

router.get(
    "/incidents",
    requirePermission("incidents", "read"),
    listIncidents
);
router.post("/incidents/:id/resolve", requireActiveSession, requirePermission("incidents", "resolve"), requireProtectedAction, resolveIncident);

router.get(
    "/resources",
    requirePermission("resources", "read"),
    listResources
);

router.patch(
    "/resources/:id",
    requireActiveSession,
    requirePermission("resources", "manage"),
    requireProtectedAction,
    updateSecurityResource
);
router.get(
    "/users-risk",
    requirePermission("users", "read"),
    listUsersRisk
);
router.get(
    "/activity",
    requirePermission("audit", "read"),
    listActivity
);

router.post(
    "/baseline/rebuild",
    requirePermission("baseline", "manage"),
    requireProtectedAction,
    requireActiveSession,
    rebuildBaseline
);

router.get(
    "/baseline",
    requirePermission("baseline", "read"),
    getBaseline
);

router.get(
    "/sessions",
    requirePermission("sessions", "read"),
    listSessions
);

router.get(
    "/sessions/:sessionId/timeline",
    requirePermission("sessions", "read"),
    sessionTimeline
);

router.get(
    "/audit",
    requirePermission("audit", "read"),
    listAudit
);

router.get(
    "/finance/archive/backup",
    requirePermission("deception", "trigger"),
    requireProtectedAction,
    requireActiveSession,
    decoyController
);

router.get(
    "/policies",
    requirePermission("policies", "read"),
    getPolicies
);

router.get(
    "/responses",
    requirePermission("response", "read"),
    getAdaptiveResponses
);

router.post(
    "/sessions/:sessionId/restrict",
    requireActiveSession,
    requirePermission("sessions", "restrict"),
    requireProtectedAction,
    restrictSession
);

router.post(
    "/sessions/:sessionId/quarantine",
    requireActiveSession,
    requirePermission("sessions", "quarantine"),
    requireProtectedAction,
    quarantineSession
);

router.post(
    "/sessions/:sessionId/release",
    requireActiveSession,
    requirePermission("sessions", "release"),
    requireProtectedAction,
    releaseSession
);

export default router;

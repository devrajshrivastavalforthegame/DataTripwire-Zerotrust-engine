import { Router } from "express";
import { authenticate, requireActiveSession, requirePortal } from "../middleware/auth.middleware.js";
import { requireProtectedAction } from "../middleware/policy.middleware.js";
import {
    requirePermission,
    requireResourceAccessPermission
} from "../middleware/authorization.middleware.js";
import { listResources } from "../controllers/resources.controller.js";
import { accessProtectedResource } from "../controllers/resource-access.controller.js";

const router = Router();
router.use(authenticate, requirePortal("employee"));

router.get("/", requirePermission("documents", "read"), listResources);

// Enforce session state and the permission required by the requested access action.
router.post("/:id/access", requireActiveSession, requireResourceAccessPermission, requireProtectedAction, accessProtectedResource);

export default router;

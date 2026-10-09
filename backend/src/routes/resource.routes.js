import { Router } from "express";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import {
    requirePermission,
    requireResourceAccessPermission
} from "../middleware/authorization.middleware.js";
import { listResources, updateSecurityResource } from "../controllers/resources.controller.js";
import { accessProtectedResource } from "../controllers/resource-access.controller.js";

const router = Router();

router.get("/", authenticate, requirePermission("documents", "read"), listResources);

// Enforce session state and the permission required by the requested access action.
router.post("/:id/access", authenticate, requireActiveSession, requireResourceAccessPermission, accessProtectedResource);

export default router;

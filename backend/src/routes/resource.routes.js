import { Router } from "express";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import { requireProtectedAction } from "../middleware/policy.middleware.js";
import { requirePermission } from "../middleware/authorization.middleware.js";
import { listResources } from "../controllers/resources.controller.js";
import { accessProtectedResource } from "../controllers/resource-access.controller.js";

const router = Router();

router.get("/", authenticate, requirePermission("documents","read"), listResources);
router.post("/:id/access", authenticate, requirePermission("documents","download"), requireActiveSession, accessProtectedResource);

export default router;

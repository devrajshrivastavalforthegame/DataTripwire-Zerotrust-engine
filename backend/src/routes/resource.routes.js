import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/authorization.middleware.js";
import { listResources } from "../controllers/resources.controller.js";
import { accessProtectedResource } from "../controllers/resource-access.controller.js";

const router = Router();

router.get("/", authenticate, requirePermission("documents","read"), listResources);

// Every protected resource request reaches the continuous-trust pipeline first.
// The controller records behaviour, evaluates risk, applies policy, and enforces
// the resulting decision for this exact request.
router.post("/:id/access", authenticate, requirePermission("documents","download"), accessProtectedResource);

export default router;

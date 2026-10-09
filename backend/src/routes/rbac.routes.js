import { Router } from "express";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/authorization.middleware.js";
import { getRBAC, toggleRolePermission } from "../controllers/rbac.controller.js";

const router = Router();
router.get("/", authenticate, requirePermission("rbac", "read"), getRBAC);
router.post(
    "/roles/:roleId/permissions/:permissionId/toggle",
    authenticate,
    requireActiveSession,
    requirePermission("rbac", "manage"),
    toggleRolePermission
);

export default router;

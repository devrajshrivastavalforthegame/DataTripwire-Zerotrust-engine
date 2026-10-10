import { Router } from "express";
import { authenticate, requireActiveSession, requirePortal } from "../middleware/auth.middleware.js";
import {
    requirePermission,
    requireWorkspaceActionPermission,
    requireApprovalDecisionPermission
} from "../middleware/authorization.middleware.js";
import {
    getState, updateState, workspaceAction, createTask, updateTask,
    createProject, updateProject, decideApproval, sendMessage,
    updateProfile, updateSettings, createCalendarEvent, listTeam, listReports
} from "../controllers/workspace.controller.js";

const router = Router();
router.use(authenticate, requirePortal("employee"));

// State/profile/settings are scoped to the authenticated user's own workspace.
router.get("/state", getState);
router.put("/state", requireActiveSession, updateState);

router.post("/actions", requireActiveSession, requireWorkspaceActionPermission, workspaceAction);
router.post("/tasks", requireActiveSession, requirePermission("tasks", "create"), createTask);
router.patch("/tasks/:id", requireActiveSession, requirePermission("tasks", "update"), updateTask);
router.post("/projects", requireActiveSession, requirePermission("projects", "create"), createProject);
router.patch("/projects/:id", requireActiveSession, requirePermission("projects", "update"), updateProject);
router.post("/approvals/:id/:decision", requireActiveSession, requireApprovalDecisionPermission, decideApproval);
router.post("/messages", requireActiveSession, sendMessage);
router.put("/profile", requireActiveSession, updateProfile);
router.put("/settings", requireActiveSession, updateSettings);
router.post("/calendar/events", requireActiveSession, createCalendarEvent);
router.get("/team", requirePermission("team", "read"), listTeam);
router.get("/reports", requirePermission("reports", "read"), listReports);

export default router;

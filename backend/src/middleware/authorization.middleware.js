import { hasPermission } from "../services/authorization/authorization.service.js";

export function requirePermission(resource, action) {
    return async (req, res, next) => {
        try {
            const userId = req.auth?.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }

            const allowed = await hasPermission(userId, resource, action);
            if (!allowed) {
                return res.status(403).json({
                    error: "Forbidden",
                    reason: "MISSING_PERMISSION",
                    requiredPermission: `${resource}:${action}`
                });
            }

            req.authorization = { resource, action, allowed: true };
            return next();
        } catch (error) {
            console.error("Authorization middleware error:", error);
            return res.status(500).json({ error: "Authorization check failed" });
        }
    };
}

const WORKSPACE_ACTION_PERMISSIONS = {
    complete_task: ["tasks", "update"],
    advance_task: ["tasks", "update"],
    invite_member: ["team", "manage"],
    mark_notification_read: null,
    mark_all_notifications_read: null
};

export function requireWorkspaceActionPermission(req, res, next) {
    const action = String(req.body?.action ?? "").trim().toLowerCase();
    if (!Object.hasOwn(WORKSPACE_ACTION_PERMISSIONS, action)) {
        return res.status(400).json({ error: "Unsupported workspace action" });
    }

    const permission = WORKSPACE_ACTION_PERMISSIONS[action];
    if (!permission) return next();
    return requirePermission(permission[0], permission[1])(req, res, next);
}

export function requireApprovalDecisionPermission(req, res, next) {
    const decision = String(req.params?.decision ?? "").trim().toLowerCase();
    if (decision !== "approve" && decision !== "reject") {
        return res.status(400).json({ error: "Decision must be approve or reject" });
    }
    return requirePermission("approvals", decision)(req, res, next);
}

export function requireResourceAccessPermission(req, res, next) {
    const action = String(req.body?.action ?? "OPEN").trim().toUpperCase();
    const permissions = {
        OPEN: ["documents", "read"],
        DOWNLOAD: ["documents", "download"],
        // COPY is treated as an export until a distinct documents:copy permission exists.
        COPY: ["documents", "download"]
    };

    const permission = permissions[action];
    if (!permission) {
        return res.status(400).json({ error: "action must be OPEN, DOWNLOAD, or COPY" });
    }
    req.resourceAccessAction = action;
    return requirePermission(permission[0], permission[1])(req, res, next);
}

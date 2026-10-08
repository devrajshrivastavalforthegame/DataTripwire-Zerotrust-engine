import { hasPermission } from "../services/authorization/authorization.service.js";

export function requirePermission(resource, action) {
    return async (req, res, next) => {
        try {
            const userId = req.auth?.user?.id;

            if (!userId) {
                return res.status(401).json({
                    error: "Authentication required"
                });
            }

            const allowed = await hasPermission(userId, resource, action);

            if (!allowed) {
                return res.status(403).json({
                    error: "Forbidden",
                    reason: "MISSING_PERMISSION",
                    requiredPermission: `${resource}:${action}`
                });
            }

            req.authorization = {
                resource,
                action,
                allowed: true
            };

            next();
        } catch (error) {
            console.error("Authorization middleware error:", error);

            return res.status(500).json({
                error: "Authorization check failed"
            });
        }
    };
}

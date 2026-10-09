import { verifyAccessToken } from "../services/auth/token.service.js";
import { findUserById, getUserRoleSlugs } from "../services/auth/user.repository.js";
import { findSessionById, updateSessionActivity } from "../services/auth/session.repository.js";

export async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        if (!header.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });

        const token = header.slice(7);
        const payload = verifyAccessToken(token);
        const user = await findUserById(payload.sub);
        const session = await findSessionById(payload.sessionId);

        if (!user || user.status !== "active" || !session || session.user_id !== user.id || session.status === "ended") {
            return res.status(401).json({ error: "Invalid session" });
        }

        if ((payload.portal !== "employee" && payload.portal !== "admin")
            || payload.portal !== session.portal
            || payload.role !== user.role) {
            return res.status(401).json({ error: "Invalid session portal binding" });
        }

        const roleSlugs = await getUserRoleSlugs(user.id);
        const allowedRoles = payload.portal === "employee"
            ? new Set(["employee", "manager"])
            : new Set(["security_analyst", "security_manager", "system_admin"]);
        if (roleSlugs.length === 0
            || !roleSlugs.includes(user.role)
            || !roleSlugs.every((role) => allowedRoles.has(role))
            || !allowedRoles.has(user.role)) {
            return res.status(401).json({ error: "Portal access is no longer permitted" });
        }

        await updateSessionActivity(session.id);
        req.auth = { user, session, tokenPayload: payload };
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function requireActiveSession(req, res, next) {
    if (!req.auth?.session || req.auth.session.status !== "active") {
        return res.status(403).json({ error: "Active session required" });
    }
    next();
}

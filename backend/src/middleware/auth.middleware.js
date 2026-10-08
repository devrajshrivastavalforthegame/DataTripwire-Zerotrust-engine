import { verifyAccessToken } from "../services/auth/token.service.js";
import { findUserById } from "../services/auth/user.repository.js";
import { findSessionById, updateSessionActivity } from "../services/auth/session.repository.js";

export async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization || "";

        if (!header.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const token = header.slice(7);
        const payload = verifyAccessToken(token);
        const user = await findUserById(payload.sub);
        const session = await findSessionById(payload.sessionId);

        if (!user || user.status !== "active" || !session || session.user_id !== user.id || session.status === "ended") {
            return res.status(401).json({ error: "Invalid session" });
        }

        await updateSessionActivity(session.id);
        req.auth = { user, session, tokenPayload: payload };
        next();
    } catch (error) {
        console.error("AUTH ERROR:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function requireActiveSession(req, res, next) {
    if (!req.auth?.session || req.auth.session.status !== "active") {
        return res.status(403).json({ error: "Active session required" });
    }

    next();
}

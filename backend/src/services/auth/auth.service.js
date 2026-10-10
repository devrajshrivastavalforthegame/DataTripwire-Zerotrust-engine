import { findUserByEmail } from "./user.repository.js";
import { verifyPassword } from "./password.service.js";
import { createSession } from "./session.repository.js";
import { generateAccessToken } from "./token.service.js";

const ROLE_PORTAL = {
    employee: "employee",
    manager: "employee",
    security_analyst: "admin",
    security_manager: "admin",
    system_admin: "admin"
};

export async function login({
    email,
    password,
    portal,
    ipAddress = null,
    userAgent = null,
    deviceFingerprint = null,
    location = null
}) {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid credentials");
    }

    if (user.status !== "active") {
        throw new Error("User account is not active");
    }

    const passwordValid = await verifyPassword(
        password,
        user.password_hash
    );

    if (!passwordValid) {
        throw new Error("Invalid credentials");
    }

    const requiredPortal = ROLE_PORTAL[String(user.role || "").trim().toLowerCase()];
    if (!requiredPortal) {
        const error = new Error("This account does not have access to either application portal");
        error.code = "PORTAL_NOT_ALLOWED";
        throw error;
    }
    if (portal !== requiredPortal) {
        const error = new Error("This account is not authorized for the selected portal");
        error.code = "PORTAL_MISMATCH";
        throw error;
    }

    const session = await createSession({
        userId: user.id,
        portal,
        ipAddress,
        userAgent,
        deviceFingerprint,
        location
    });

    const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        sessionId: session.id,
        portal
    });

    return {
        accessToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status
        },
        session: {
            id: session.id,
            status: session.status,
            portal: session.portal,
            baselineEligible: session.baseline_eligible
        }
    };
}

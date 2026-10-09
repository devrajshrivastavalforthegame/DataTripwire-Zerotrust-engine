import { findUserByEmail, getUserRoleSlugs } from "./user.repository.js";
import { verifyPassword } from "./password.service.js";
import { createSession } from "./session.repository.js";
import { generateAccessToken } from "./token.service.js";

export async function login({
    email,
    password,
    ipAddress = null,
    userAgent = null,
    deviceFingerprint = null,
    location = null,
    portal
}) {
    if (portal !== "employee" && portal !== "admin") {
        const error = new Error("A valid portal is required");
        error.statusCode = 400;
        throw error;
    }

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

    const roleSlugs = await getUserRoleSlugs(user.id);
    const allowedRoles = portal === "employee"
        ? new Set(["employee", "manager"])
        : new Set(["security_analyst", "security_manager", "system_admin"]);

    // Fail closed if assignments are missing, conflicting, or not permitted for this portal.
    const primaryRole = user.role;
    const eligible = roleSlugs.length > 0
        && roleSlugs.includes(primaryRole)
        && roleSlugs.every((role) => allowedRoles.has(role))
        && allowedRoles.has(primaryRole);
    if (!eligible) {
        const error = new Error("Portal access denied");
        error.statusCode = 403;
        throw error;
    }

    const session = await createSession({
        userId: user.id,
        ipAddress,
        userAgent,
        deviceFingerprint,
        location,
        portal
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

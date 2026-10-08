import { findUserByEmail } from "./user.repository.js";
import { verifyPassword } from "./password.service.js";
import { createSession } from "./session.repository.js";
import { generateAccessToken } from "./token.service.js";

export async function login({
    email,
    password,
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

    const session = await createSession({
        userId: user.id,
        ipAddress,
        userAgent,
        deviceFingerprint,
        location
    });

    const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        sessionId: session.id
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
            baselineEligible: session.baseline_eligible
        }
    };
}

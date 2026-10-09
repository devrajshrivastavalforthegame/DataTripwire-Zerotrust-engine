import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "datatripwire";
const JWT_AUDIENCE = "datatripwire-api";

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret === "CHANGE_ME_TO_A_LONG_RANDOM_SECRET") {
        throw new Error("JWT_SECRET is not configured securely");
    }

    if (secret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    return secret;
}

export function generateAccessToken({
    userId,
    role,
    sessionId,
    portal
}) {
    return jwt.sign(
        {
            sub: userId,
            role,
            sessionId,
            portal
        },
        getJwtSecret(),
        {
            algorithm: JWT_ALGORITHM,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: process.env.JWT_EXPIRES_IN || "15m"
        }
    );
}

export function verifyAccessToken(token) {
    return jwt.verify(token, getJwtSecret(), {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
    });
}

import { query } from "../../config/database.js";

export async function findUserByEmail(email) {
    const result = await query(
        `SELECT
            id,
            username,
            email,
            password_hash,
            role,
            status,
            created_at,
            updated_at
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [email]
    );

    return result.rows[0] || null;
}

export async function findUserById(userId) {
    const result = await query(
        `SELECT
            id,
            username,
            email,
            role,
            status,
            created_at,
            updated_at
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [userId]
    );

    return result.rows[0] || null;
}

export async function createUser({
    username,
    email,
    passwordHash,
    role = "employee"
}) {
    const result = await query(
        `INSERT INTO users (
            username,
            email,
            password_hash,
            role
         )
         VALUES ($1, $2, $3, $4)
         RETURNING
            id,
            username,
            email,
            role,
            status,
            created_at,
            updated_at`,
        [username, email, passwordHash, role]
    );

    return result.rows[0];
}

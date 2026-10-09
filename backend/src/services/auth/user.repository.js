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


// Read current RBAC assignments from the database; never trust JWT role claims for portal eligibility.
export async function getUserRoleSlugs(userId) {
    const result = await query(
        `SELECT r.slug
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = $1`,
        [userId]
    );
    return result.rows.map((row) => row.slug);
}

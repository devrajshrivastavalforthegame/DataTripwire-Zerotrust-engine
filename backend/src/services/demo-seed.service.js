import { query } from "../config/database.js";
import { hashPassword } from "./auth/password.service.js";

// These credentials are for local prototype development only. This service is
// called only when NODE_ENV=development and ENABLE_DEMO_SEED=true.
const DEMO_USERS = [
    {
        username: "Demo Employee",
        email: "employee@workshepher.local",
        password: "Employee@123",
        role: "employee"
    },
    {
        username: "SOC Administrator",
        email: "admin@datatripwire.local",
        password: "Admin@123",
        role: "security_manager"
    }
];

export async function ensureDemoUsers() {
    const roleSlugs = [...new Set(DEMO_USERS.map((user) => user.role))];
    const rolesResult = await query(
        "SELECT id, slug FROM roles WHERE slug = ANY($1::text[])",
        [roleSlugs]
    );
    const roleIds = new Map(rolesResult.rows.map((row) => [row.slug, row.id]));
    const missingRoles = roleSlugs.filter((slug) => !roleIds.has(slug));

    if (missingRoles.length > 0) {
        throw new Error(
            `Cannot seed demo users because required RBAC roles are missing: ${missingRoles.join(", ")}. ` +
            "Apply the existing RBAC schema/seed setup before enabling demo login."
        );
    }

    const results = [];

    for (const demoUser of DEMO_USERS) {
        const existingResult = await query(
            `SELECT id, role, status
             FROM users
             WHERE lower(email) = lower($1)
             LIMIT 1`,
            [demoUser.email]
        );

        let user = existingResult.rows[0] || null;
        let created = false;

        if (!user) {
            const passwordHash = await hashPassword(demoUser.password);
            const inserted = await query(
                `INSERT INTO users (username, email, password_hash, role, status)
                 VALUES ($1, $2, $3, $4, 'active')
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id, role, status`,
                [demoUser.username, demoUser.email, passwordHash, demoUser.role]
            );

            user = inserted.rows[0] || null;
            created = Boolean(user);

            // Handle a concurrent development startup without overwriting the
            // other process's account or password.
            if (!user) {
                const concurrentResult = await query(
                    `SELECT id, role, status
                     FROM users
                     WHERE lower(email) = lower($1)
                     LIMIT 1`,
                    [demoUser.email]
                );
                user = concurrentResult.rows[0] || null;
            }
        }

        if (!user) {
            throw new Error(`Unable to create or find demo account ${demoUser.email}.`);
        }

        if (String(user.role || "").toLowerCase() !== demoUser.role) {
            throw new Error(
                `Demo account ${demoUser.email} already exists with role "${user.role}". ` +
                "No role or password was changed; review this account manually."
            );
        }
        if (String(user.status || "").toLowerCase() !== "active") {
            throw new Error(
                `Demo account ${demoUser.email} is not active. ` +
                "No account status was changed; review this account manually."
            );
        }

        const assignments = await query(
            `SELECT r.slug
             FROM user_roles ur
             JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = $1`,
            [user.id]
        );
        const assignedRoles = assignments.rows.map((row) => row.slug);

        if (assignedRoles.some((slug) => slug !== demoUser.role)) {
            throw new Error(
                `Demo account ${demoUser.email} has conflicting RBAC assignments. ` +
                "No assignments were changed."
            );
        }

        if (!assignedRoles.includes(demoUser.role)) {
            await query(
                `INSERT INTO user_roles (user_id, role_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [user.id, roleIds.get(demoUser.role)]
            );
        }

        results.push({
            email: demoUser.email,
            role: demoUser.role,
            created,
            roleAssigned: !assignedRoles.includes(demoUser.role)
        });
    }

    return results;
}

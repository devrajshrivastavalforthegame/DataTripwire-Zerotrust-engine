import { jest } from "@jest/globals";

const state = {
    roles: [
        { id: "role-employee", slug: "employee" },
        { id: "role-security-manager", slug: "security_manager" }
    ],
    users: new Map(),
    assignments: new Map(),
    nextUserId: 1
};

const query = jest.fn();
const hashPassword = jest.fn();

jest.unstable_mockModule("../src/config/database.js", () => ({ query }));
jest.unstable_mockModule("../src/services/auth/password.service.js", () => ({ hashPassword }));

const { ensureDemoUsers } = await import("../src/services/demo-seed.service.js");

function resetState() {
    state.roles = [
        { id: "role-employee", slug: "employee" },
        { id: "role-security-manager", slug: "security_manager" }
    ];
    state.users = new Map();
    state.assignments = new Map();
    state.nextUserId = 1;
    query.mockReset();
    hashPassword.mockReset();
    hashPassword.mockImplementation(async (password) => `bcrypt-hash-for-${password}`);

    query.mockImplementation(async (sql, params = []) => {
        const statement = sql.replace(/\s+/g, " ").trim();

        if (statement.startsWith("SELECT id, slug FROM roles")) {
            const slugs = params[0];
            return {
                rows: state.roles.filter((role) => slugs.includes(role.slug))
            };
        }

        if (statement.startsWith("SELECT id, role, status FROM users")) {
            const email = String(params[0]).toLowerCase();
            const user = state.users.get(email);
            return { rows: user ? [{ id: user.id, role: user.role, status: user.status }] : [] };
        }

        if (statement.startsWith("INSERT INTO users")) {
            const [username, email, passwordHashValue, role] = params;
            const normalizedEmail = String(email).toLowerCase();
            if (state.users.has(normalizedEmail)) return { rows: [] };

            const user = {
                id: `user-${state.nextUserId++}`,
                username,
                email,
                password_hash: passwordHashValue,
                role,
                status: "active"
            };
            state.users.set(normalizedEmail, user);
            return { rows: [{ id: user.id, role: user.role, status: user.status }] };
        }

        if (statement.startsWith("SELECT r.slug FROM user_roles")) {
            const userId = params[0];
            const slugs = state.assignments.get(userId) || [];
            return { rows: slugs.map((slug) => ({ slug })) };
        }

        if (statement.startsWith("INSERT INTO user_roles")) {
            const [userId, roleId] = params;
            const role = state.roles.find((item) => item.id === roleId);
            if (!role) throw new Error("role id missing in test fixture");
            const assignments = state.assignments.get(userId) || [];
            if (!assignments.includes(role.slug)) assignments.push(role.slug);
            state.assignments.set(userId, assignments);
            return { rows: [] };
        }

        throw new Error(`Unexpected SQL in test: ${statement}`);
    });
}

beforeEach(resetState);

describe("development demo-user seeding", () => {
    test("creates the admin and employee with hashed passwords and matching RBAC roles", async () => {
        const result = await ensureDemoUsers();

        expect(result).toEqual([
            { email: "employee@workshepher.local", role: "employee", created: true, roleAssigned: true },
            { email: "admin@datatripwire.local", role: "security_manager", created: true, roleAssigned: true }
        ]);
        expect(state.users.size).toBe(2);

        const employee = state.users.get("employee@workshepher.local");
        const admin = state.users.get("admin@datatripwire.local");
        expect(employee.password_hash).not.toBe("Employee@123");
        expect(employee.password_hash).toContain("bcrypt-hash-for-");
        expect(admin.password_hash).not.toBe("Admin@123");
        expect(state.assignments.get(employee.id)).toEqual(["employee"]);
        expect(state.assignments.get(admin.id)).toEqual(["security_manager"]);
        expect(hashPassword).toHaveBeenCalledTimes(2);
    });

    test("is idempotent and does not replace existing demo passwords", async () => {
        await ensureDemoUsers();
        const employeeBefore = { ...state.users.get("employee@workshepher.local") };
        const adminBefore = { ...state.users.get("admin@datatripwire.local") };

        const result = await ensureDemoUsers();

        expect(result.every((account) => account.created === false)).toBe(true);
        expect(state.users.get("employee@workshepher.local")).toEqual(employeeBefore);
        expect(state.users.get("admin@datatripwire.local")).toEqual(adminBefore);
        expect(hashPassword).toHaveBeenCalledTimes(2);
    });

    test("does not silently grant a portal role to an account whose primary role differs", async () => {
        state.users.set("employee@workshepher.local", {
            id: "existing-user",
            username: "Existing account",
            email: "employee@workshepher.local",
            password_hash: "unchanged-hash",
            role: "manager",
            status: "active"
        });

        await expect(ensureDemoUsers()).rejects.toThrow(/already exists with role/);
        expect(state.users.get("employee@workshepher.local").password_hash).toBe("unchanged-hash");
        expect(hashPassword).not.toHaveBeenCalled();
    });

    test("fails clearly if required RBAC roles are missing", async () => {
        state.roles = [{ id: "role-employee", slug: "employee" }];

        await expect(ensureDemoUsers()).rejects.toThrow(/required RBAC roles are missing: security_manager/);
        expect(state.users.size).toBe(0);
        expect(hashPassword).not.toHaveBeenCalled();
    });

    test("does not reactivate an inactive existing demo account", async () => {
        state.users.set("employee@workshepher.local", {
            id: "inactive-user",
            username: "Demo Employee",
            email: "employee@workshepher.local",
            password_hash: "unchanged-hash",
            role: "employee",
            status: "inactive"
        });

        await expect(ensureDemoUsers()).rejects.toThrow(/is not active/);
        expect(state.users.get("employee@workshepher.local").status).toBe("inactive");
        expect(state.users.get("employee@workshepher.local").password_hash).toBe("unchanged-hash");
    });
});

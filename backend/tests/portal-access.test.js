import { jest } from "@jest/globals";

const mocks = {
    findUserByEmail: jest.fn(),
    getUserRoleSlugs: jest.fn(),
    verifyPassword: jest.fn(),
    createSession: jest.fn(),
    generateAccessToken: jest.fn()
};

jest.unstable_mockModule("../src/services/auth/user.repository.js", () => ({
    findUserByEmail: mocks.findUserByEmail,
    getUserRoleSlugs: mocks.getUserRoleSlugs
}));

jest.unstable_mockModule("../src/services/auth/password.service.js", () => ({
    verifyPassword: mocks.verifyPassword
}));

jest.unstable_mockModule("../src/services/auth/session.repository.js", () => ({
    createSession: mocks.createSession
}));

jest.unstable_mockModule("../src/services/auth/token.service.js", () => ({
    generateAccessToken: mocks.generateAccessToken
}));

const { login } = await import("../src/services/auth/auth.service.js");

const roleUsers = {
    employee: {
        id: "user-employee",
        username: "Demo Employee",
        email: "employee@example.test",
        password_hash: "hashed-password",
        role: "employee",
        status: "active"
    },
    manager: {
        id: "user-manager",
        username: "Demo Manager",
        email: "manager@example.test",
        password_hash: "hashed-password",
        role: "manager",
        status: "active"
    },
    security_analyst: {
        id: "user-analyst",
        username: "analyst@example.test",
        password_hash: "hashed-password",
        role: "security_analyst",
        status: "active"
    },
    security_manager: {
        id: "user-security-manager",
        username: "Security Manager",
        email: "security-manager@example.test",
        password_hash: "hashed-password",
        role: "security_manager",
        status: "active"
    },
    system_admin: {
        id: "user-admin",
        username: "System Admin",
        email: "admin@example.test",
        password_hash: "hashed-password",
        role: "system_admin",
        status: "active"
    }
};

beforeEach(() => {
    jest.clearAllMocks();

    mocks.findUserByEmail.mockImplementation(async (email) => {
        return Object.values(roleUsers).find((user) => user.email === email) ?? null;
    });
    mocks.getUserRoleSlugs.mockImplementation(async (userId) => {
        const user = Object.values(roleUsers).find((entry) => entry.id === userId);
        return user ? [user.role] : [];
    });
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockImplementation(async ({ userId, portal }) => ({
        id: `session-${userId}`,
        status: "active",
        portal,
        baseline_eligible: false
    }));
    mocks.generateAccessToken.mockReturnValue("test-access-token");
});

describe("portal-specific login", () => {
    test.each([
        ["employee", "employee"],
        ["manager", "employee"],
        ["security_analyst", "admin"],
        ["security_manager", "admin"],
        ["system_admin", "admin"]
    ])("%s can log in to the %s portal", async (role, portal) => {
        const user = roleUsers[role];

        const result = await login({
            email: user.email,
            password: "test-password",
            portal
        });

        expect(result.user.role).toBe(role);
        expect(result.session.portal).toBe(portal);
        expect(mocks.createSession).toHaveBeenCalledTimes(1);
        expect(mocks.createSession).toHaveBeenCalledWith(
            expect.objectContaining({ userId: user.id, portal })
        );
        expect(mocks.generateAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({ userId: user.id, role, portal })
        );
    });

    test.each([
        ["employee", "admin"],
        ["manager", "admin"],
        ["security_analyst", "employee"],
        ["security_manager", "employee"],
        ["system_admin", "employee"]
    ])("%s is denied access to the %s portal", async (role, portal) => {
        const user = roleUsers[role];

        await expect(login({
            email: user.email,
            password: "test-password",
            portal
        })).rejects.toMatchObject({
            message: "Portal access denied",
            statusCode: 403
        });

        expect(mocks.createSession).not.toHaveBeenCalled();
        expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    });

    test.each([undefined, null, "", "work", "EMPLOYEE"])(
        "rejects invalid portal value: %s",
        async (portal) => {
            await expect(login({
                email: "employee@example.test",
                password: "test-password",
                portal
            })).rejects.toMatchObject({
                message: "A valid portal is required",
                statusCode: 400
            });

            expect(mocks.findUserByEmail).not.toHaveBeenCalled();
            expect(mocks.createSession).not.toHaveBeenCalled();
        }
    );

    test("rejects a user with no RBAC role assignments", async () => {
        mocks.getUserRoleSlugs.mockResolvedValue([]);

        await expect(login({
            email: "employee@example.test",
            password: "test-password",
            portal: "employee"
        })).rejects.toMatchObject({
            message: "Portal access denied",
            statusCode: 403
        });

        expect(mocks.createSession).not.toHaveBeenCalled();
    });

    test("rejects conflicting RBAC role assignments", async () => {
        mocks.getUserRoleSlugs.mockResolvedValue(["employee", "system_admin"]);

        await expect(login({
            email: "employee@example.test",
            password: "test-password",
            portal: "employee"
        })).rejects.toMatchObject({
            message: "Portal access denied",
            statusCode: 403
        });

        expect(mocks.createSession).not.toHaveBeenCalled();
    });

    test("rejects invalid credentials without creating a session", async () => {
        mocks.verifyPassword.mockResolvedValue(false);

        await expect(login({
            email: "employee@example.test",
            password: "wrong-password",
            portal: "employee"
        })).rejects.toThrow("Invalid credentials");

        expect(mocks.getUserRoleSlugs).not.toHaveBeenCalled();
        expect(mocks.createSession).not.toHaveBeenCalled();
    });
});

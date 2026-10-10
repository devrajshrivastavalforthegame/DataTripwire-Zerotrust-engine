import { jest } from "@jest/globals";

const findUserByEmail = jest.fn();
const verifyPassword = jest.fn();
const createSession = jest.fn();
const generateAccessToken = jest.fn();

jest.unstable_mockModule("../src/services/auth/user.repository.js", () => ({ findUserByEmail }));
jest.unstable_mockModule("../src/services/auth/password.service.js", () => ({ verifyPassword }));
jest.unstable_mockModule("../src/services/auth/session.repository.js", () => ({ createSession }));
jest.unstable_mockModule("../src/services/auth/token.service.js", () => ({ generateAccessToken }));

const { login } = await import("../src/services/auth/auth.service.js");

function configureLogin({ role = "employee", portal = "employee", validPassword = true } = {}) {
    findUserByEmail.mockResolvedValue({
        id: "user-1",
        username: "Test User",
        email: "test@example.test",
        password_hash: "hash",
        role,
        status: "active"
    });
    verifyPassword.mockResolvedValue(validPassword);
    createSession.mockResolvedValue({
        id: "session-1",
        status: "active",
        portal,
        baseline_eligible: true
    });
    generateAccessToken.mockReturnValue("test-access-token");
}

describe("portal-bound login", () => {
    beforeEach(() => {
        findUserByEmail.mockReset();
        verifyPassword.mockReset();
        createSession.mockReset();
        generateAccessToken.mockReset();
    });

    test.each([
        ["employee", "employee"],
        ["manager", "employee"],
        ["security_analyst", "admin"],
        ["security_manager", "admin"],
        ["system_admin", "admin"]
    ])("permits role %s only in the %s portal", async (role, portal) => {
        configureLogin({ role, portal });

        const result = await login({
            email: "test@example.test",
            password: "correct password",
            portal
        });

        expect(result.accessToken).toBe("test-access-token");
        expect(result.session.portal).toBe(portal);
        expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            portal
        }));
        expect(generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            sessionId: "session-1",
            portal
        }));
    });

    test.each([
        ["employee", "admin"],
        ["manager", "admin"],
        ["security_analyst", "employee"],
        ["security_manager", "employee"],
        ["system_admin", "employee"]
    ])("rejects role %s from the %s portal", async (role, wrongPortal) => {
        configureLogin({ role, portal: wrongPortal });

        await expect(login({
            email: "test@example.test",
            password: "correct password",
            portal: wrongPortal
        })).rejects.toMatchObject({ code: "PORTAL_MISMATCH" });

        expect(createSession).not.toHaveBeenCalled();
        expect(generateAccessToken).not.toHaveBeenCalled();
    });

    test("rejects unknown roles without creating a session", async () => {
        configureLogin({ role: "auditor", portal: "admin" });

        await expect(login({
            email: "test@example.test",
            password: "correct password",
            portal: "admin"
        })).rejects.toMatchObject({ code: "PORTAL_NOT_ALLOWED" });

        expect(createSession).not.toHaveBeenCalled();
    });

    test("does not issue a session when password verification fails", async () => {
        configureLogin({ role: "employee", portal: "employee", validPassword: false });

        await expect(login({
            email: "test@example.test",
            password: "wrong password",
            portal: "employee"
        })).rejects.toThrow("Invalid credentials");

        expect(createSession).not.toHaveBeenCalled();
        expect(generateAccessToken).not.toHaveBeenCalled();
    });
});

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

const demoUser = (role) => ({
    id: "user-1",
    username: "Demo User",
    email: "demo@example.test",
    password_hash: "hash",
    role,
    status: "active"
});

describe("portal-bound login", () => {
    beforeEach(() => {
        findUserByEmail.mockReset();
        verifyPassword.mockReset();
        createSession.mockReset();
        generateAccessToken.mockReset();

        findUserByEmail.mockResolvedValue(demoUser("employee"));
        verifyPassword.mockResolvedValue(true);
        createSession.mockResolvedValue({
            id: "session-1",
            user_id: "user-1",
            portal: "employee",
            status: "active",
            baseline_eligible: true
        });
        generateAccessToken.mockReturnValue("signed-token");
    });

    test("creates an employee-portal session for an employee account", async () => {
        const result = await login({
            email: "demo@example.test",
            password: "correct-password",
            portal: "employee"
        });

        expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            portal: "employee"
        }));
        expect(generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            sessionId: "session-1",
            portal: "employee"
        }));
        expect(result.accessToken).toBe("signed-token");
        expect(result.session.portal).toBe("employee");
    });

    test("rejects the admin portal for an employee without creating a session", async () => {
        await expect(login({
            email: "demo@example.test",
            password: "correct-password",
            portal: "admin"
        })).rejects.toMatchObject({ code: "PORTAL_MISMATCH" });

        expect(createSession).not.toHaveBeenCalled();
        expect(generateAccessToken).not.toHaveBeenCalled();
    });

    test.each([
        ["manager", "employee"],
        ["security_analyst", "admin"],
        ["security_manager", "admin"],
        ["system_admin", "admin"]
    ])("maps role %s to its allowed portal", async (role, portal) => {
        findUserByEmail.mockResolvedValue(demoUser(role));
        const session = {
            id: "session-2",
            user_id: "user-1",
            portal,
            status: "active",
            baseline_eligible: false
        };
        createSession.mockResolvedValue(session);

        const result = await login({
            email: "demo@example.test",
            password: "correct-password",
            portal
        });

        expect(result.session.portal).toBe(portal);
        expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ portal }));
    });

    test("rejects unknown roles fail-closed", async () => {
        findUserByEmail.mockResolvedValue(demoUser("superuser"));

        await expect(login({
            email: "demo@example.test",
            password: "correct-password",
            portal: "admin"
        })).rejects.toMatchObject({ code: "PORTAL_NOT_ALLOWED" });

        expect(createSession).not.toHaveBeenCalled();
    });

    test("rejects invalid password before applying portal selection", async () => {
        verifyPassword.mockResolvedValue(false);

        await expect(login({
            email: "demo@example.test",
            password: "wrong",
            portal: "admin"
        })).rejects.toThrow("Invalid credentials");

        expect(createSession).not.toHaveBeenCalled();
    });
});

import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/services/auth/token.service.js", () => ({
    verifyAccessToken: jest.fn()
}));
jest.unstable_mockModule("../src/services/auth/user.repository.js", () => ({
    findUserById: jest.fn()
}));
jest.unstable_mockModule("../src/services/auth/session.repository.js", () => ({
    findSessionById: jest.fn(),
    updateSessionActivity: jest.fn()
}));

const { requireActiveSession, requirePortal, authenticate } = await import("../src/middleware/auth.middleware.js");
const { verifyAccessToken } = await import("../src/services/auth/token.service.js");
const { findUserById } = await import("../src/services/auth/user.repository.js");
const { findSessionById, updateSessionActivity } = await import("../src/services/auth/session.repository.js");

function responseMock() {
    return {
        statusCode: 200,
        payload: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.payload = body; return this; }
    };
}

describe("requireActiveSession", () => {
    test("allows an active session", () => {
        const req = { auth: { session: { status: "active" } } };
        const res = responseMock();
        let nextCalled = false;

        requireActiveSession(req, res, () => { nextCalled = true; });

        expect(nextCalled).toBe(true);
        expect(res.statusCode).toBe(200);
    });

    test.each(["restricted", "quarantined", "ended", undefined])(
        "blocks a %s or missing session",
        (status) => {
            const req = { auth: status ? { session: { status } } : { session: null } };
            const res = responseMock();
            let nextCalled = false;

            requireActiveSession(req, res, () => { nextCalled = true; });

            expect(nextCalled).toBe(false);
            expect(res.statusCode).toBe(403);
            expect(res.payload.error).toBe("Active session required");
        }
    );
});


describe("requirePortal", () => {
    test.each([
        ["employee", "employee"],
        ["admin", "admin"]
    ])("allows a %s session in its matching portal", (portal, expectedPortal) => {
        const req = { auth: { session: { portal } } };
        const res = responseMock();
        let nextCalled = false;

        requirePortal(expectedPortal)(req, res, () => { nextCalled = true; });

        expect(nextCalled).toBe(true);
        expect(res.statusCode).toBe(200);
    });

    test.each([
        ["employee", "admin"],
        ["admin", "employee"],
        [undefined, "admin"]
    ])("rejects a %s session from the %s portal", (actualPortal, expectedPortal) => {
        const req = { auth: { session: actualPortal ? { portal: actualPortal } : {} } };
        const res = responseMock();
        let nextCalled = false;

        requirePortal(expectedPortal)(req, res, () => { nextCalled = true; });

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(403);
        expect(res.payload.code).toBe("PORTAL_MISMATCH");
        expect(res.payload.requiredPortal).toBe(expectedPortal);
    });
});


describe("authenticate portal binding", () => {
    beforeEach(() => {
        verifyAccessToken.mockReset();
        findUserById.mockReset();
        findSessionById.mockReset();
        updateSessionActivity.mockReset();
    });

    async function runAuthentication({ tokenPortal = "employee", userRole = "employee", sessionPortal = "employee" } = {}) {
        verifyAccessToken.mockReturnValue({ sub: "user-1", sessionId: "session-1", portal: tokenPortal });
        findUserById.mockResolvedValue({ id: "user-1", role: userRole, status: "active" });
        findSessionById.mockResolvedValue({ id: "session-1", user_id: "user-1", role: userRole, status: "active", portal: sessionPortal });
        updateSessionActivity.mockResolvedValue({});
        const req = { headers: { authorization: "Bearer test-token" } };
        const res = responseMock();
        let nextCalled = false;
        await authenticate(req, res, () => { nextCalled = true; });
        return { req, res, nextCalled };
    }

    test("accepts matching token, user role, and persisted session portal", async () => {
        const { req, res, nextCalled } = await runAuthentication({
            tokenPortal: "employee",
            userRole: "manager",
            sessionPortal: "employee"
        });

        expect(nextCalled).toBe(true);
        expect(res.statusCode).toBe(200);
        expect(req.auth.portal).toBe("employee");
        expect(updateSessionActivity).toHaveBeenCalledWith("session-1");
    });

    test.each([
        ["admin token", { tokenPortal: "admin", userRole: "employee", sessionPortal: "employee" }],
        ["admin session for employee role", { tokenPortal: "admin", userRole: "employee", sessionPortal: "admin" }],
        ["employee token for security manager", { tokenPortal: "employee", userRole: "security_manager", sessionPortal: "employee" }],
        ["unknown persisted portal", { tokenPortal: "employee", userRole: "employee", sessionPortal: "legacy" }]
    ])("rejects %s", async (_label, config) => {
        const { res, nextCalled } = await runAuthentication(config);

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(401);
        expect(res.payload.code).toBe("PORTAL_SESSION_INVALID");
        expect(updateSessionActivity).not.toHaveBeenCalled();
    });
});

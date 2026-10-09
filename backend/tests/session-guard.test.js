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

const { requireActiveSession, requirePortal } = await import("../src/middleware/auth.middleware.js");

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

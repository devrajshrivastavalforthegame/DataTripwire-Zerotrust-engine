import { requireActiveSession } from "../src/middleware/auth.middleware.js";

function makeResponse() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

describe("requireActiveSession", () => {
    test("allows an active session", () => {
        const req = { auth: { session: { status: "active" } } };
        const res = makeResponse();
        const next = jest.fn();

        requireActiveSession(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBeNull();
    });

    test.each(["restricted", "quarantined", "ended"])(
        "blocks a %s session",
        (status) => {
            const req = { auth: { session: { status } } };
            const res = makeResponse();
            const next = jest.fn();

            requireActiveSession(req, res, next);

            expect(res.statusCode).toBe(403);
            expect(res.body).toEqual({ error: "Active session required" });
            expect(next).not.toHaveBeenCalled();
        }
    );

    test("blocks requests without an authenticated session", () => {
        const req = { auth: null };
        const res = makeResponse();
        const next = jest.fn();

        requireActiveSession(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });
});

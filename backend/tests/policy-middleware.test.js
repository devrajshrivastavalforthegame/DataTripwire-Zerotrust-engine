import { requireProtectedAction } from "../src/middleware/policy.middleware.js";

function responseMock() {
    return {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        }
    };
}

function runMiddleware(req) {
    const res = responseMock();
    let nextCalled = false;

    requireProtectedAction(req, res, () => {
        nextCalled = true;
    });

    return { res, nextCalled };
}

describe("requireProtectedAction", () => {
    test("allows an active session without a pending step-up challenge", () => {
        const { res, nextCalled } = runMiddleware({
            auth: {
                session: {
                    status: "active",
                    step_up_required: false
                }
            }
        });

        expect(nextCalled).toBe(true);
        expect(res.statusCode).toBe(200);
    });

    test.each([
        ["restricted", "SESSION_RESTRICTED"],
        ["quarantined", "SESSION_QUARANTINED"]
    ])("blocks a %s session", (status, code) => {
        const { res, nextCalled } = runMiddleware({
            auth: {
                session: {
                    status,
                    step_up_required: false
                }
            }
        });

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(403);
        expect(res.payload.code).toBe(code);
    });

    test("blocks a pending step-up challenge", () => {
        const { res, nextCalled } = runMiddleware({
            auth: {
                session: {
                    status: "active",
                    step_up_required: true
                }
            }
        });

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(403);
        expect(res.payload.code).toBe("STEP_UP_REQUIRED");
    });

    test("rejects a missing session", () => {
        const { res, nextCalled } = runMiddleware({ auth: {} });

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(401);
    });
});

import { jest } from "@jest/globals";

const query = jest.fn();
jest.unstable_mockModule("../src/config/database.js", () => ({ query }));

const { updateState } = await import("../src/controllers/workspace.controller.js");

function responseMock() {
    return {
        statusCode: 200,
        payload: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.payload = body; return this; }
    };
}

describe("workspace state update guard", () => {
    beforeEach(() => query.mockReset());

    test.each(["tasks", "projects", "approvals", "messages", "invites", "calendar"])(
        "rejects direct replacement of %s through the generic state endpoint",
        async (field) => {
            const res = responseMock();
            await updateState(
                { auth: { user: { id: "user-1" } }, body: { data: { [field]: [] } } },
                res
            );

            expect(res.statusCode).toBe(400);
            expect(res.payload.blockedFields).toContain(field);
            expect(query).not.toHaveBeenCalled();
        }
    );

    test("accepts only profile/settings fields through the generic state endpoint", async () => {
        const res = responseMock();
        await updateState(
            { auth: { user: { id: "user-1" } }, body: { data: { isAdmin: true } } },
            res
        );

        expect(res.statusCode).toBe(400);
        expect(query).not.toHaveBeenCalled();
    });
});

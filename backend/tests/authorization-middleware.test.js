import { jest } from "@jest/globals";

const hasPermission = jest.fn();
jest.unstable_mockModule("../src/services/authorization/authorization.service.js", () => ({ hasPermission }));

const {
    requireResourceAccessPermission,
    requireWorkspaceActionPermission,
    requireApprovalDecisionPermission
} = await import("../src/middleware/authorization.middleware.js");

function responseMock() {
    return {
        statusCode: 200,
        payload: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.payload = body; return this; }
    };
}

async function run(middleware, req) {
    const res = responseMock();
    let nextCalled = false;
    await middleware(req, res, () => { nextCalled = true; });
    return { res, nextCalled };
}

describe("context-aware route authorization middleware", () => {
    beforeEach(() => hasPermission.mockReset());

    test.each([
        ["OPEN", "documents", "read"],
        ["DOWNLOAD", "documents", "download"],
        ["COPY", "documents", "download"]
    ])("maps resource action %s to %s:%s", async (action, resource, permission) => {
        hasPermission.mockResolvedValue(true);
        const req = { auth: { user: { id: "user-1" } }, body: { action } };

        const { res, nextCalled } = await run(requireResourceAccessPermission, req);

        expect(nextCalled).toBe(true);
        expect(res.statusCode).toBe(200);
        expect(req.resourceAccessAction).toBe(action);
        expect(hasPermission).toHaveBeenCalledWith("user-1", resource, permission);
    });

    test("rejects unknown resource actions before checking permission", async () => {
        const { res, nextCalled } = await run(requireResourceAccessPermission, {
            auth: { user: { id: "user-1" } }, body: { action: "ERASE" }
        });

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(400);
        expect(hasPermission).not.toHaveBeenCalled();
    });

    test("denies resource access when the mapped permission is missing", async () => {
        hasPermission.mockResolvedValue(false);
        const { res, nextCalled } = await run(requireResourceAccessPermission, {
            auth: { user: { id: "user-1" } }, body: { action: "DOWNLOAD" }
        });

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(403);
        expect(res.payload.requiredPermission).toBe("documents:download");
    });

    test("requires team management for workspace invitations", async () => {
        hasPermission.mockResolvedValue(true);
        const { nextCalled } = await run(requireWorkspaceActionPermission, {
            auth: { user: { id: "manager-1" } },
            body: { action: "invite_member", metadata: { email: "new@example.test" } }
        });

        expect(nextCalled).toBe(true);
        expect(hasPermission).toHaveBeenCalledWith("manager-1", "team", "manage");
    });

    test("lets users update their own notification state without team permissions", async () => {
        const { nextCalled, res } = await run(requireWorkspaceActionPermission, {
            auth: { user: { id: "employee-1" } }, body: { action: "mark_notification_read", target: "n1" }
        });

        expect(nextCalled).toBe(true);
        expect(res.statusCode).toBe(200);
        expect(hasPermission).not.toHaveBeenCalled();
    });

    test.each(["approve", "reject"])("requires approvals:%s to decide an approval", async (decision) => {
        hasPermission.mockResolvedValue(true);
        const { nextCalled } = await run(requireApprovalDecisionPermission, {
            auth: { user: { id: "manager-1" } }, params: { decision }
        });

        expect(nextCalled).toBe(true);
        expect(hasPermission).toHaveBeenCalledWith("manager-1", "approvals", decision);
    });

    test("rejects an unsupported approval decision", async () => {
        const { res, nextCalled } = await run(requireApprovalDecisionPermission, {
            auth: { user: { id: "manager-1" } }, params: { decision: "grant_admin" }
        });

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(400);
        expect(hasPermission).not.toHaveBeenCalled();
    });
});

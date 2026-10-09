import { jest } from "@jest/globals";

const query = jest.fn();

jest.unstable_mockModule("../src/config/database.js", () => ({
    default: { query }
}));

const { authorizeContext } = await import("../src/services/authorization/authorization.service.js");

function configureQuery({ permission = true, responsibility = true, resource = null } = {}) {
    query.mockImplementation(async (sql) => {
        if (sql.includes("FROM user_roles ur")) {
            return { rows: [{ allowed: permission }] };
        }
        if (sql.includes("FROM user_responsibilities ur")) {
            return { rows: [{ allowed: responsibility }] };
        }
        if (sql.includes("FROM resources")) {
            return { rows: resource ? [resource] : [] };
        }
        throw new Error("Unexpected SQL in authorization test");
    });
}

describe("authorizeContext", () => {
    beforeEach(() => query.mockReset());

    test("denies a user without the required role permission", async () => {
        configureQuery({ permission: false });

        const result = await authorizeContext({
            userId: "user-1",
            resource: "Documents",
            action: "Read"
        });

        expect(result).toMatchObject({
            allowed: false,
            reason: "MISSING_PERMISSION",
            requiredPermission: "documents:read",
            riskRelevant: true
        });
    });

    test("denies a responsibility mismatch", async () => {
        configureQuery({ responsibility: false });

        const result = await authorizeContext({
            userId: "user-1",
            resource: "documents",
            action: "read",
            responsibility: "Finance",
            scope: "DEPARTMENT"
        });

        expect(result).toMatchObject({
            allowed: false,
            reason: "RESPONSIBILITY_MISMATCH",
            riskRelevant: true
        });
    });

    test("denies a missing protected resource", async () => {
        configureQuery({ resource: null });

        const result = await authorizeContext({
            userId: "user-1",
            resource: "documents",
            action: "read",
            resourceId: "resource-1"
        });

        expect(result).toMatchObject({
            allowed: false,
            reason: "RESOURCE_NOT_FOUND",
            riskRelevant: false
        });
    });

    test.each([
        [{ id: "resource-1", active: false, resource_type: "documents" }, "RESOURCE_INACTIVE"],
        [{ id: "resource-1", active: true, resource_type: "payroll" }, "RESOURCE_TYPE_MISMATCH"]
    ])("denies an inactive or mismatched resource", async (resource, expectedReason) => {
        configureQuery({ resource });

        const result = await authorizeContext({
            userId: "user-1",
            resource: "documents",
            action: "read",
            resourceId: "resource-1"
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe(expectedReason);
    });

    test.each(["restricted", "quarantined"])(
        "denies a %s session",
        async (status) => {
            configureQuery();

            const result = await authorizeContext({
                userId: "user-1",
                resource: "documents",
                action: "read",
                session: { status }
            });

            expect(result).toMatchObject({
                allowed: false,
                reason: "SESSION_RESTRICTED",
                riskRelevant: true
            });
        }
    );

    test("denies protected actions when step-up verification is missing", async () => {
        configureQuery();

        const result = await authorizeContext({
            userId: "user-1",
            resource: "documents",
            action: "read",
            session: { status: "active", step_up_required: true, step_up_verified_at: null }
        });

        expect(result).toMatchObject({
            allowed: false,
            reason: "STEP_UP_REQUIRED",
            riskRelevant: true
        });
    });

    test("allows an authorized active session and returns its context", async () => {
        const resource = {
            id: "resource-1",
            name: "Finance document",
            resource_type: "documents",
            active: true
        };
        configureQuery({ resource });

        const result = await authorizeContext({
            userId: "user-1",
            resource: " Documents ",
            action: " READ ",
            responsibility: "Finance",
            scope: "DEPARTMENT",
            resourceId: "resource-1",
            task: "review",
            session: { status: "active", step_up_required: false }
        });

        expect(result).toMatchObject({
            allowed: true,
            reason: "AUTHORIZED",
            requiredPermission: "documents:read",
            context: {
                responsibility: "Finance",
                task: "review",
                scope: "DEPARTMENT",
                resourceId: "resource-1"
            },
            resource
        });
    });
});

import { jest } from "@jest/globals";

const query = jest.fn();
jest.unstable_mockModule("../src/config/database.js", () => ({ default: { query } }));

const { hasResponsibility } = await import("../src/services/authorization/authorization.service.js");

describe("hasResponsibility scope hierarchy", () => {
    beforeEach(() => query.mockReset());

    test.each([
        ["OWN", ["OWN"]],
        ["ASSIGNED", ["OWN", "ASSIGNED"]],
        ["TEAM", ["OWN", "ASSIGNED", "TEAM"]],
        ["ORGANIZATION", ["OWN", "ASSIGNED", "TEAM", "ORGANIZATION"]]
    ])("scope %s accepts only equal or broader grants", async (requiredScope, expectedGrantScopes) => {
        query.mockResolvedValue({ rows: [{ allowed: true }] });

        await expect(hasResponsibility("user-1", "Finance", requiredScope)).resolves.toBe(true);

        expect(query).toHaveBeenCalledWith(
            expect.stringContaining("ur.scope = ANY($3::text[])"),
            ["user-1", "Finance", expectedGrantScopes]
        );
    });

    test("fails closed for unsupported scopes without a database query", async () => {
        await expect(hasResponsibility("user-1", "Finance", "DEPARTMENT")).resolves.toBe(false);
        expect(query).not.toHaveBeenCalled();
    });

    test("does not filter by scope when no scope was requested", async () => {
        query.mockResolvedValue({ rows: [{ allowed: true }] });

        await expect(hasResponsibility("user-1", "Finance")).resolves.toBe(true);
        expect(query).toHaveBeenCalledWith(
            expect.not.stringContaining("ur.scope = ANY"),
            ["user-1", "Finance"]
        );
    });

    test("rejects a missing responsibility name", async () => {
        await expect(hasResponsibility("user-1", null, "OWN")).resolves.toBe(false);
        expect(query).not.toHaveBeenCalled();
    });
});

import { jest } from "@jest/globals";

const query = jest.fn();

jest.unstable_mockModule("../src/config/database.js", () => ({ query }));

const { getOverview } = await import("../src/controllers/overview.controller.js");

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

describe("getOverview", () => {
    beforeEach(() => query.mockReset());

    test("returns the database-derived open incident count", async () => {
        query
            .mockResolvedValueOnce({ rows: [{ count: 8 }] }) // active users
            .mockResolvedValueOnce({ rows: [{ count: 5 }] }) // active sessions
            .mockResolvedValueOnce({ rows: [{ count: 2 }] }) // high-risk users
            .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // restricted sessions
            .mockResolvedValueOnce({ rows: [{ count: 17 }] }) // policy decisions
            .mockResolvedValueOnce({ rows: [{ count: 4 }] }) // incidents
            .mockResolvedValueOnce({ rows: [{ decision: "MONITOR", risk_score: 35, sts_score: 80, ats_score: 20, created_at: "2026-10-09T10:00:00Z" }] });

        const res = responseMock();
        await getOverview({}, res);

        expect(res.statusCode).toBe(200);
        expect(res.payload.metrics).toMatchObject({
            activeUsers: 8,
            activeSessions: 5,
            highRiskUsers: 2,
            restrictedSessions: 1,
            policyDecisions: 17,
            openIncidents: 4
        });
        expect(query).toHaveBeenCalledTimes(7);
        expect(query.mock.calls[5][0]).toContain("FROM audit_logs");
    });

    test("returns zero open incidents when the audit-log query reports zero", async () => {
        query
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [] });

        const res = responseMock();
        await getOverview({}, res);

        expect(res.payload.metrics.openIncidents).toBe(0);
    });
});

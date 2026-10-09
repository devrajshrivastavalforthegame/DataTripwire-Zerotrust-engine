import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { checkDatabaseConnection } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import behaviorRoutes from "./routes/behavior.routes.js";
import securityRoutes from "./routes/security.routes.js";
import { setupSwagger } from "./docs/swagger.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS ??
        (process.env.NODE_ENV === "production"
            ? ""
            : "http://localhost:5173,http://127.0.0.1:5173"))
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

app.use(cors({
    origin(origin, callback) {
        // Non-browser clients and same-origin requests may omit Origin.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
}));

app.get("/health", (_, res) => res.json({ status: "ok", service: "datatripwire-backend" }));
app.get("/health/db", async (_, res) => {
    try {
        await checkDatabaseConnection();
        res.json({ status: "ok", database: true });
    } catch {
        res.status(503).json({ status: "error", database: false });
    }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/behavior", behaviorRoutes);
app.use("/api/v1/security", securityRoutes);
setupSwagger(app);

app.use((err, _req, res, _next) => {
    console.error("Unhandled backend error", err);
    res.status(500).json({ error: "Internal server error" });
});

const port = process.env.BACKEND_PORT || 3000;
app.listen(port, () => console.log(`DataTripwire backend running on port ${port}`));

import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { checkDatabaseConnection } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import behaviorRoutes from "./routes/behavior.routes.js";
import securityRoutes from "./routes/security.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import rbacRoutes from "./routes/rbac.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import { setupSwagger } from "./docs/swagger.js";
import { seedDemoResources } from "./services/seed.service.js";
import { ensureDemoUsers } from "./services/demo-seed.service.js";

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
    // Permit non-browser clients and same-origin requests without an Origin header.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({limit:"1mb"}));
app.use(rateLimit({windowMs:15*60*1000,max:600,standardHeaders:true,legacyHeaders:false}));
app.get("/health",(_,res)=>res.json({status:"ok",service:"datatripwire-backend"}));
app.get("/health/db",async(_,res)=>{try{await checkDatabaseConnection();res.json({status:"ok",database:true});}catch{res.status(503).json({status:"error",database:false});}});
app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/behavior",behaviorRoutes);
app.use("/api/v1/security",securityRoutes);
app.use("/api/v1/resources",resourceRoutes);
app.use("/api/v1/rbac",rbacRoutes);
app.use("/api/v1/workspace",workspaceRoutes);
setupSwagger(app);
app.use((err,_req,res,_next)=>{console.error("Unhandled backend error",err);res.status(500).json({error:"Internal server error"});});
const port=process.env.BACKEND_PORT||3000;
app.listen(port,async()=>{
  console.log(`DataTripwire backend running on port ${port}`);
  const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const demoSeedEnabled = process.env.ENABLE_DEMO_SEED === "true";

  if (isProduction || !demoSeedEnabled) {
    console.log("Demo bootstrap skipped (production or ENABLE_DEMO_SEED is not explicitly true).");
    return;
  }

  try {
    await seedDemoResources();
    await ensureDemoUsers();
    console.log("Demo security resources/users ready.");
  } catch (error) {
    console.error("Demo bootstrap failed:",error);
  }
});

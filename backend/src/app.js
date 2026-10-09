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
import { ensureDemoUsers } from "./services/demo-seed.service.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({origin:true,credentials:true}));
app.use(express.json({limit:"1mb"}));
app.use(rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));
app.get("/health",(_,res)=>res.json({status:"ok",service:"datatripwire-backend"}));
app.get("/health/db",async(_,res)=>{try{await checkDatabaseConnection();res.json({status:"ok",database:true});}catch{res.status(503).json({status:"error",database:false});}});
app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/behavior",behaviorRoutes);
app.use("/api/v1/security",securityRoutes);
setupSwagger(app);
app.use((err,_req,res,_next)=>{console.error("Unhandled backend error",err);res.status(500).json({error:"Internal server error"});});
const demoSeedingEnabled =
    String(process.env.NODE_ENV || "").toLowerCase() === "development"
    && process.env.ENABLE_DEMO_SEED === "true";

if (demoSeedingEnabled) {
    try {
        const seededAccounts = await ensureDemoUsers();
        const createdCount = seededAccounts.filter((account) => account.created).length;
        console.log(
            `Development demo users ready (${createdCount} account(s) created; ${seededAccounts.length} checked).`
        );
    } catch (error) {
        console.error("Development demo-user seeding failed:", error.message);
        // Fail startup rather than silently accepting logins that cannot work.
        process.exitCode = 1;
        throw error;
    }
} else {
    console.log("Development demo-user seeding skipped.");
}

const port = process.env.BACKEND_PORT || 3000;
app.listen(port,()=>console.log(`DataTripwire backend running on port ${port}`));

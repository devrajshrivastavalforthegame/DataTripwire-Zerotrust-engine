import { Router } from "express";
import { loginController, meController, logoutController, stepUpController } from "../controllers/auth.controller.js";
import { authenticate, requireActiveSession } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();
const stepUpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many step-up attempts. Please try again later.", code: "STEP_UP_RATE_LIMITED" }
});
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again later.", code: "LOGIN_RATE_LIMITED" }
});
router.post("/login", loginLimiter, loginController);
router.post("/step-up", stepUpLimiter, authenticate, requireActiveSession, stepUpController);
router.get("/me", authenticate, meController);
router.post("/logout", authenticate, logoutController);
export default router;

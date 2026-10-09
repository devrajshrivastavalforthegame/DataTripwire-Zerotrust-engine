import { Router } from "express";
import { loginController, meController, logoutController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again later.", code: "LOGIN_RATE_LIMITED" }
});
router.post("/login", loginLimiter, loginController);
router.get("/me", authenticate, meController);
router.post("/logout", authenticate, logoutController);
export default router;

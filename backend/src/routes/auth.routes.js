import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginController, meController, logoutController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Keep password guessing limits separate from the general API traffic budget.
const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many login attempts. Try again later.",
        code: "LOGIN_RATE_LIMITED"
    }
});

router.post("/login", loginRateLimit, loginController);
router.get("/me", authenticate, meController);
router.post("/logout", authenticate, logoutController);
export default router;

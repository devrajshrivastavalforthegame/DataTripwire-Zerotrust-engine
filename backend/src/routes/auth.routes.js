import { Router } from "express";
import { loginController, meController, logoutController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.post("/login", loginController);
router.get("/me", authenticate, meController);
router.post("/logout", authenticate, logoutController);
export default router;

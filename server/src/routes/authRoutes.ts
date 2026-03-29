import { Router } from "express";
import { joinFamily, login, me, register } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/family/join", requireAuth, joinFamily);

export default router;

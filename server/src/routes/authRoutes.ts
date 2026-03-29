import { Router } from "express";
import { changePassword, deleteAccount, joinFamily, login, me, register, updateMe } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);
router.patch("/me/password", requireAuth, changePassword);
router.delete("/me", requireAuth, deleteAccount);
router.post("/family/join", requireAuth, joinFamily);

export default router;

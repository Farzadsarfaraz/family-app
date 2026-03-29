import { Router } from "express";
import { getFamilyMembers, updateMyPreferences } from "../controllers/familyController";

const router = Router();

router.get("/", getFamilyMembers);
router.patch("/me/preferences", updateMyPreferences);

export default router;

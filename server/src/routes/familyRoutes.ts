import { Router } from "express";
import { deleteFamily, deleteFamilyMember, getFamilyMembers, promoteFamilyMember } from "../controllers/familyController";

const router = Router();

router.get("/", getFamilyMembers);
router.patch("/members/:memberId/promote", promoteFamilyMember);
router.delete("/members/:memberId", deleteFamilyMember);
router.delete("/", deleteFamily);

export default router;

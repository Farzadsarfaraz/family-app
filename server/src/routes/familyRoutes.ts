import { Router } from "express";
import { getFamilyMembers } from "../controllers/familyController";

const router = Router();

router.get("/", getFamilyMembers);

export default router;

import { Router } from "express";
import { createChore, deleteChore, listChores, resetWeeklyChores, updateChore } from "../controllers/choreController";

const router = Router();

router.get("/", listChores);
router.post("/", createChore);
router.patch("/:id", updateChore);
router.delete("/:id", deleteChore);
router.post("/reset-weekly", resetWeeklyChores);

export default router;

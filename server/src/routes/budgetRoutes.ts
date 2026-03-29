import { Router } from "express";
import { createExpense, createIncome, deleteExpense, deleteIncome, getBudget } from "../controllers/budgetController";

const router = Router();

router.get("/", getBudget);
router.post("/income", createIncome);
router.post("/expenses", createExpense);
router.delete("/income/:id", deleteIncome);
router.delete("/expenses/:id", deleteExpense);

export default router;

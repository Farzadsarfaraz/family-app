import { Router } from "express";
import { createExpense, createIncome, deleteExpense, deleteIncome, getBudget, resetBudgetMonth, updateIncome } from "../controllers/budgetController";

const router = Router();

router.get("/", getBudget);
router.delete("/reset-month", resetBudgetMonth);
router.post("/income", createIncome);
router.patch("/income/:id", updateIncome);
router.post("/expenses", createExpense);
router.delete("/income/:id", deleteIncome);
router.delete("/expenses/:id", deleteExpense);

export default router;

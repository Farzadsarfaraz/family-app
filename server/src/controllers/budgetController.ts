import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Income } from "../models/Income";
import { Expense } from "../models/Expense";
import { HttpError, ok } from "../utils/http";

const incomeSchema = z.object({
  memberId: z.string().min(1),
  amount: z.coerce.number().min(0),
  month: z.coerce.number().int().min(0).max(11),
  year: z.coerce.number().int().min(2024),
  note: z.string().optional(),
});

const expenseSchema = z.object({
  memberId: z.string().min(1),
  amount: z.coerce.number().min(0),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
});

const getMonthRange = (month: number, year: number) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

export const getBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!familyId || Number.isNaN(month) || Number.isNaN(year)) {
      throw new HttpError(400, "Month and year are required.");
    }

    const { start, end } = getMonthRange(month, year);

    const [incomes, expenses] = await Promise.all([
      Income.find({ familyId, month, year }).populate("memberId", "name avatarColor"),
      Expense.find({ familyId, date: { $gte: start, $lte: end } }).populate("memberId", "name avatarColor"),
    ]);

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return ok(res, {
      incomes: incomes.map((item) => ({
        id: item._id.toString(),
        amount: item.amount,
        month: item.month,
        year: item.year,
        note: item.note ?? "",
        member: item.memberId,
      })),
      expenses: expenses.map((item) => ({
        id: item._id.toString(),
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: item.date,
        member: item.memberId,
      })),
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        spendingPercentage: totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createIncome = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const input = incomeSchema.parse(req.body);

    if (!familyId) {
      throw new HttpError(401, "Unauthorized.");
    }

    const item = await Income.create({ ...input, familyId });
    return ok(res, item, 201);
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const input = expenseSchema.parse(req.body);

    if (!familyId) {
      throw new HttpError(401, "Unauthorized.");
    }

    const item = await Expense.create({
      ...input,
      familyId,
      date: new Date(input.date),
    });

    return ok(res, item, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteIncome = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const item = await Income.findOneAndDelete({ _id: req.params.id, familyId });

    if (!item) {
      throw new HttpError(404, "Income not found.");
    }

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const item = await Expense.findOneAndDelete({ _id: req.params.id, familyId });

    if (!item) {
      throw new HttpError(404, "Expense not found.");
    }

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

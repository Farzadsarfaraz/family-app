import { Request, Response, NextFunction } from "express";
import { GroceryItem } from "../models/GroceryItem";
import { Income } from "../models/Income";
import { Expense } from "../models/Expense";
import { Event } from "../models/Event";
import { Chore } from "../models/Chore";
import { HttpError, ok } from "../utils/http";

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;

    if (!familyId) {
      throw new HttpError(401, "Unauthorized.");
    }

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const today = now.toISOString().slice(0, 10);

    const [groceryLeft, incomes, expenses, nextEvent, choresToday] = await Promise.all([
      GroceryItem.countDocuments({ familyId, isChecked: false }),
      Income.find({ familyId, month, year }),
      Expense.find({ familyId, date: { $gte: start, $lte: end } }),
      Event.findOne({ familyId, date: { $gte: today } }).sort({ date: 1, time: 1 }).populate("assignedTo", "name avatarColor"),
      Chore.countDocuments({ familyId, dueDate: today, isCompleted: false }),
    ]);

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return ok(res, {
      groceryLeft,
      budget: {
        totalIncome,
        totalExpenses,
      },
      nextEvent: nextEvent
        ? {
            id: nextEvent._id.toString(),
            title: nextEvent.title,
            date: nextEvent.date,
            time: nextEvent.time,
            assignedTo: nextEvent.assignedTo,
            colorTag: nextEvent.colorTag,
          }
        : null,
      choresToday,
    });
  } catch (error) {
    next(error);
  }
};

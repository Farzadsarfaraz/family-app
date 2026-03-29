import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Chore } from "../models/Chore";
import { HttpError, ok } from "../utils/http";

const choreSchema = z.object({
  title: z.string().min(1),
  assignedTo: z.string().min(1),
  dueDate: z.string().min(1),
  recurring: z.enum(["none", "weekly"]).default("none"),
});

const choreUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  assignedTo: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  recurring: z.enum(["none", "weekly"]).optional(),
  isCompleted: z.boolean().optional(),
});

export const listChores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const chores = await Chore.find({ familyId }).populate("assignedTo", "name avatarColor").sort({ dueDate: 1, createdAt: -1 });
    return ok(res, chores.map((chore) => ({
      id: chore._id.toString(),
      title: chore.title,
      dueDate: chore.dueDate,
      recurring: chore.recurring,
      isCompleted: chore.isCompleted,
      completedAt: chore.completedAt,
      assignedTo: chore.assignedTo,
    })));
  } catch (error) {
    next(error);
  }
};

export const createChore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const input = choreSchema.parse(req.body);

    if (!familyId) {
      throw new HttpError(401, "Unauthorized.");
    }

    const chore = await Chore.create({ ...input, familyId });
    return ok(res, chore, 201);
  } catch (error) {
    next(error);
  }
};

export const updateChore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const input = choreUpdateSchema.parse(req.body);
    const patch = {
      ...input,
      completedAt: input.isCompleted ? new Date() : null,
    };

    const chore = await Chore.findOneAndUpdate({ _id: req.params.id, familyId }, patch, { new: true });

    if (!chore) {
      throw new HttpError(404, "Chore not found.");
    }

    return ok(res, chore);
  } catch (error) {
    next(error);
  }
};

export const deleteChore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const chore = await Chore.findOneAndDelete({ _id: req.params.id, familyId });

    if (!chore) {
      throw new HttpError(404, "Chore not found.");
    }

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

export const resetWeeklyChores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    await Chore.updateMany(
      { familyId, recurring: "weekly" },
      { isCompleted: false, completedAt: null }
    );
    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

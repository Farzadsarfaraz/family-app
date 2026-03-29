import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { GroceryItem } from "../models/GroceryItem";
import { HttpError, ok } from "../utils/http";

const createSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
  category: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  category: z.string().min(1).optional(),
  isChecked: z.boolean().optional(),
});

export const listGroceries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;

    if (!familyId) {
      throw new HttpError(401, "Unauthorized.");
    }

    const items = await GroceryItem.find({ familyId }).sort({ isChecked: 1, createdAt: -1 });
    return ok(res, items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      isChecked: item.isChecked,
      createdAt: item.createdAt,
    })));
  } catch (error) {
    next(error);
  }
};

export const createGrocery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const userId = req.user?.userId;
    const input = createSchema.parse(req.body);

    if (!familyId || !userId) {
      throw new HttpError(401, "Unauthorized.");
    }

    const item = await GroceryItem.create({
      ...input,
      familyId,
      addedBy: userId,
    });

    return ok(res, item, 201);
  } catch (error) {
    next(error);
  }
};

export const updateGrocery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const input = updateSchema.parse(req.body);

    const item = await GroceryItem.findOneAndUpdate(
      { _id: req.params.id, familyId },
      input,
      { new: true }
    );

    if (!item) {
      throw new HttpError(404, "Grocery item not found.");
    }

    return ok(res, item);
  } catch (error) {
    next(error);
  }
};

export const deleteGrocery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const item = await GroceryItem.findOneAndDelete({ _id: req.params.id, familyId });

    if (!item) {
      throw new HttpError(404, "Grocery item not found.");
    }

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

export const clearCompletedGroceries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    await GroceryItem.deleteMany({ familyId, isChecked: true });
    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

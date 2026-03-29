import { Request, Response, NextFunction } from "express";
import { Family } from "../models/Family";
import { User } from "../models/User";
import { GroceryItem } from "../models/GroceryItem";
import { Income } from "../models/Income";
import { Expense } from "../models/Expense";
import { Event } from "../models/Event";
import { Chore } from "../models/Chore";
import { comparePassword } from "../utils/auth";
import { HttpError, ok } from "../utils/http";

export const getFamilyMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    const family = await Family.findById(authUser.familyId);

    if (!family) {
      throw new HttpError(404, "Family not found.");
    }

    const members = await User.find({ familyId: authUser.familyId }).sort({ name: 1 });

    return ok(res, {
      family: {
        id: family._id.toString(),
        name: family.name,
        inviteCode: family.inviteCode,
      },
      members: members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        avatarColor: member.avatarColor,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFamilyMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;
    const memberId = req.params.memberId;

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    if (authUser.role !== "admin") {
      throw new HttpError(403, "Only admins can remove family members.");
    }

    if (authUser.userId === memberId) {
      throw new HttpError(400, "Use delete account if you want to remove yourself.");
    }

    const member = await User.findOne({ _id: memberId, familyId: authUser.familyId });

    if (!member) {
      throw new HttpError(404, "Family member not found.");
    }

    await Promise.all([
      Income.deleteMany({ familyId: authUser.familyId, memberId: member._id }),
      Expense.deleteMany({ familyId: authUser.familyId, memberId: member._id }),
      Event.deleteMany({ familyId: authUser.familyId, assignedTo: member._id }),
      Chore.deleteMany({ familyId: authUser.familyId, assignedTo: member._id }),
      GroceryItem.deleteMany({ familyId: authUser.familyId, addedBy: member._id }),
      User.deleteOne({ _id: member._id }),
    ]);

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

export const promoteFamilyMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;
    const memberId = req.params.memberId;

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    if (authUser.role !== "admin") {
      throw new HttpError(403, "Only admins can promote family members.");
    }

    const member = await User.findOne({ _id: memberId, familyId: authUser.familyId });

    if (!member) {
      throw new HttpError(404, "Family member not found.");
    }

    if (member.role === "admin") {
      return ok(res, { success: true });
    }

    member.role = "admin";
    await member.save();

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteFamily = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;
    const password = String(req.body?.password ?? "");

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    if (authUser.role !== "admin") {
      throw new HttpError(403, "Only admins can delete the whole family.");
    }

    if (password.length < 6) {
      throw new HttpError(400, "Password is required.");
    }

    const admin = await User.findById(authUser.userId);

    if (!admin || !admin.familyId) {
      throw new HttpError(404, "Admin account not found.");
    }

    const matches = await comparePassword(password, admin.passwordHash);

    if (!matches) {
      throw new HttpError(400, "Password is incorrect.");
    }

    const familyId = admin.familyId;
    const adminCount = await User.countDocuments({ familyId, role: "admin" });

    if (adminCount > 1) {
      throw new HttpError(400, "The whole family can only be deleted when exactly one admin remains.");
    }

    await Promise.all([
      GroceryItem.deleteMany({ familyId }),
      Income.deleteMany({ familyId }),
      Expense.deleteMany({ familyId }),
      Event.deleteMany({ familyId }),
      Chore.deleteMany({ familyId }),
      User.deleteMany({ familyId }),
      Family.deleteOne({ _id: familyId }),
    ]);

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

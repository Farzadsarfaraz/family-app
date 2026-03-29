import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Family } from "../models/Family";
import { GroceryItem } from "../models/GroceryItem";
import { Income } from "../models/Income";
import { Expense } from "../models/Expense";
import { Event } from "../models/Event";
import { Chore } from "../models/Chore";
import { comparePassword, hashPassword, signToken } from "../utils/auth";
import { createInviteCode } from "../utils/inviteCode";
import { HttpError, ok } from "../utils/http";
import { serializeUser } from "../utils/serializers";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  avatarColor: z.string().min(4),
  familyName: z.string().min(2).optional(),
  inviteCode: z.string().min(6).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const joinSchema = z.object({
  inviteCode: z.string().min(6),
});

const updateMeSchema = z.object({
  name: z.string().trim().min(2),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const deleteAccountSchema = z.object({
  password: z.string().min(6),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const normalizedEmail = input.email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      throw new HttpError(409, "An account with that email already exists.");
    }

    const user = await User.create({
      name: input.name,
      email: normalizedEmail,
      passwordHash: await hashPassword(input.password),
      avatarColor: input.avatarColor,
      role: input.inviteCode ? "member" : "admin",
    });

    const family = input.inviteCode
      ? await Family.findOne({ inviteCode: input.inviteCode.toUpperCase() })
      : await Family.create({
          name: input.familyName ?? `${input.name}'s Family`,
          inviteCode: createInviteCode(),
          createdBy: user._id,
        });

    if (!family) {
      throw new HttpError(404, "Invite code not found.");
    }

    user.familyId = family._id;
    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      familyId: family._id.toString(),
      role: user.role,
    });

    return ok(res, {
      token,
      user: serializeUser(user),
      family: {
        id: family._id.toString(),
        name: family.name,
        inviteCode: family.inviteCode,
      },
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });

    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new HttpError(401, "Incorrect email or password.");
    }

    if (!user.familyId) {
      throw new HttpError(400, "This account is not linked to a family yet.");
    }

    const family = await Family.findById(user.familyId);

    if (!family) {
      throw new HttpError(404, "Family not found.");
    }

    const token = signToken({
      userId: user._id.toString(),
      familyId: user.familyId.toString(),
      role: user.role,
    });

    return ok(res, {
      token,
      user: serializeUser(user),
      family: {
        id: family._id.toString(),
        name: family.name,
        inviteCode: family.inviteCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const joinFamily = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = joinSchema.parse(req.body);
    const authUser = req.user;

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    const user = await User.findById(authUser.userId);
    const family = await Family.findOne({ inviteCode: input.inviteCode.toUpperCase() });

    if (!user || !family) {
      throw new HttpError(404, "Invite code not found.");
    }

    if (user.familyId) {
      throw new HttpError(409, "This account already belongs to a family. Please log in instead. If you want to join another family, you have to delete your account first.");
    }

    user.familyId = family._id;
    user.role = "member";
    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      familyId: family._id.toString(),
      role: user.role,
    });

    return ok(res, {
      token,
      user: serializeUser(user),
      family: {
        id: family._id.toString(),
        name: family.name,
        inviteCode: family.inviteCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    const user = await User.findById(authUser.userId);
    const family = user?.familyId ? await Family.findById(user.familyId) : null;

    if (!user || !family) {
      throw new HttpError(404, "Account not found.");
    }

    return ok(res, {
      user: serializeUser(user),
      family: {
        id: family._id.toString(),
        name: family.name,
        inviteCode: family.inviteCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;
    const input = updateMeSchema.parse(req.body);

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    const user = await User.findByIdAndUpdate(authUser.userId, { name: input.name }, { new: true });

    if (!user) {
      throw new HttpError(404, "Account not found.");
    }

    return ok(res, { user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;
    const input = changePasswordSchema.parse(req.body);

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    const user = await User.findById(authUser.userId);

    if (!user) {
      throw new HttpError(404, "Account not found.");
    }

    const matches = await comparePassword(input.currentPassword, user.passwordHash);

    if (!matches) {
      throw new HttpError(400, "Current password is incorrect.");
    }

    user.passwordHash = await hashPassword(input.newPassword);
    await user.save();

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user;
    const input = deleteAccountSchema.parse(req.body);

    if (!authUser) {
      throw new HttpError(401, "Unauthorized.");
    }

    const user = await User.findById(authUser.userId);

    if (!user) {
      throw new HttpError(404, "Account not found.");
    }

    const matches = await comparePassword(input.password, user.passwordHash);

    if (!matches) {
      throw new HttpError(400, "Password is incorrect.");
    }

    const familyId = user.familyId;

    if (!familyId) {
      await user.deleteOne();
      return ok(res, { success: true });
    }

    const family = await Family.findById(familyId);
    const familyMembers = await User.find({ familyId }).sort({ createdAt: 1 });
    const remainingMembers = familyMembers.filter((member) => member._id.toString() !== user._id.toString());

    if (remainingMembers.length === 0) {
      await Promise.all([
        GroceryItem.deleteMany({ familyId }),
        Income.deleteMany({ familyId }),
        Expense.deleteMany({ familyId }),
        Event.deleteMany({ familyId }),
        Chore.deleteMany({ familyId }),
        Family.deleteOne({ _id: familyId }),
        User.deleteOne({ _id: user._id }),
      ]);

      return ok(res, { success: true });
    }

    if (user.role === "admin") {
      const promotedMember = remainingMembers[0];
      promotedMember.role = "admin";
      await promotedMember.save();

      if (family) {
        family.createdBy = promotedMember._id;
        await family.save();
      }
    }

    await Promise.all([
      Income.deleteMany({ familyId, memberId: user._id }),
      Expense.deleteMany({ familyId, memberId: user._id }),
      Event.deleteMany({ familyId, assignedTo: user._id }),
      Chore.deleteMany({ familyId, assignedTo: user._id }),
      GroceryItem.deleteMany({ familyId, addedBy: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

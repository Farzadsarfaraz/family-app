import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Family } from "../models/Family";
import { User } from "../models/User";
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

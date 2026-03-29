import { Types } from "mongoose";

export type AuthUser = {
  userId: string;
  familyId: string;
  role: "admin" | "member";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export type ObjectId = Types.ObjectId;

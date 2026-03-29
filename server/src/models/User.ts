import { Schema, Types, model } from "mongoose";

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "member";
  avatarColor: string;
  familyId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    avatarColor: { type: String, required: true },
    familyId: { type: Schema.Types.ObjectId, ref: "Family", default: null, index: true },
  },
  { timestamps: true }
);

export const User = model<UserDocument>("User", userSchema);

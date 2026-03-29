import { Schema, model } from "mongoose";

export interface FamilyDocument {
  name: string;
  inviteCode: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const familySchema = new Schema<FamilyDocument>(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Family = model<FamilyDocument>("Family", familySchema);

import { Schema, model } from "mongoose";

export interface ChoreDocument {
  familyId: Schema.Types.ObjectId;
  title: string;
  assignedTo: Schema.Types.ObjectId;
  dueDate: string;
  isCompleted: boolean;
  recurring: "none" | "weekly";
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const choreSchema = new Schema<ChoreDocument>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: "Family", required: true, index: true },
    title: { type: String, required: true, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    recurring: { type: String, enum: ["none", "weekly"], default: "none" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Chore = model<ChoreDocument>("Chore", choreSchema);

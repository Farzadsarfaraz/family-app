import { Schema, model } from "mongoose";

export interface IncomeDocument {
  familyId: Schema.Types.ObjectId;
  memberId: Schema.Types.ObjectId;
  amount: number;
  month: number;
  year: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const incomeSchema = new Schema<IncomeDocument>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: "Family", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 0, max: 11 },
    year: { type: Number, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Income = model<IncomeDocument>("Income", incomeSchema);

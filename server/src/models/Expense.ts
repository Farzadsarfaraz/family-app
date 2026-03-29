import { Schema, model } from "mongoose";

export interface ExpenseDocument {
  familyId: Schema.Types.ObjectId;
  memberId: Schema.Types.ObjectId;
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<ExpenseDocument>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: "Family", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Expense = model<ExpenseDocument>("Expense", expenseSchema);

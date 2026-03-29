import { Schema, model } from "mongoose";

export interface GroceryItemDocument {
  familyId: Schema.Types.ObjectId;
  name: string;
  quantity: number;
  category: string;
  isChecked: boolean;
  addedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const groceryItemSchema = new Schema<GroceryItemDocument>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: "Family", required: true, index: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    category: { type: String, required: true, trim: true },
    isChecked: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const GroceryItem = model<GroceryItemDocument>("GroceryItem", groceryItemSchema);

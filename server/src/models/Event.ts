import { Schema, model } from "mongoose";

export interface EventDocument {
  familyId: Schema.Types.ObjectId;
  title: string;
  date: string;
  time: string;
  assignedTo: Schema.Types.ObjectId;
  colorTag: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<EventDocument>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: "Family", required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    colorTag: { type: String, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Event = model<EventDocument>("Event", eventSchema);

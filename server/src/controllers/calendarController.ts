import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Event } from "../models/Event";
import { HttpError, ok } from "../utils/http";

const eventSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  assignedTo: z.string().min(1),
  colorTag: z.string().min(4),
  note: z.string().optional(),
});

export const listEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const events = await Event.find({ familyId }).populate("assignedTo", "name avatarColor").sort({ date: 1, time: 1 });
    return ok(res, events.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      date: event.date,
      time: event.time,
      colorTag: event.colorTag,
      note: event.note ?? "",
      assignedTo: event.assignedTo,
    })));
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const input = eventSchema.parse(req.body);

    if (!familyId) {
      throw new HttpError(401, "Unauthorized.");
    }

    const event = await Event.create({ ...input, familyId });
    return ok(res, event, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const familyId = req.user?.familyId;
    const event = await Event.findOneAndDelete({ _id: req.params.id, familyId });

    if (!event) {
      throw new HttpError(404, "Event not found.");
    }

    return ok(res, { success: true });
  } catch (error) {
    next(error);
  }
};

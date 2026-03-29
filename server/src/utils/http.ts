import { Response } from "express";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const ok = <T>(res: Response, data: T, statusCode = 200) =>
  res.status(statusCode).json({ data });

import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http";
import { verifyToken } from "../utils/auth";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing authentication token."));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired authentication token."));
  }
};

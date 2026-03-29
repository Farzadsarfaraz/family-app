import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

type TokenPayload = {
  userId: string;
  familyId: string;
  role: "admin" | "member";
};

export const hashPassword = (value: string) => bcrypt.hash(value, 10);

export const comparePassword = (value: string, hash: string) => bcrypt.compare(value, hash);

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as TokenPayload;

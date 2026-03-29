import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import familyRoutes from "./routes/familyRoutes";
import groceryRoutes from "./routes/groceryRoutes";
import budgetRoutes from "./routes/budgetRoutes";
import calendarRoutes from "./routes/calendarRoutes";
import choreRoutes from "./routes/choreRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFound } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/family", requireAuth, familyRoutes);
app.use("/api/grocery", requireAuth, groceryRoutes);
app.use("/api/budget", requireAuth, budgetRoutes);
app.use("/api/calendar", requireAuth, calendarRoutes);
app.use("/api/chores", requireAuth, choreRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

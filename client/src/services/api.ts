import axios from "axios";
import { Chore, DashboardData, Expense, Family, FamilyEvent, FamilyMember, GroceryItem, Income, User } from "../types";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api",
  timeout: 10000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const unwrap = async <T,>(promise: Promise<{ data: { data: T } }>) => (await promise).data.data;

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    avatarColor: string;
    familyName?: string;
    inviteCode?: string;
  }) => unwrap<{ token: string; user: User; family: Family }>(api.post("/auth/register", payload)),
  login: (payload: { email: string; password: string }) =>
    unwrap<{ token: string; user: User; family: Family }>(api.post("/auth/login", payload)),
  me: () => unwrap<{ user: User; family: Family }>(api.get("/auth/me")),
  updateMe: (payload: { name: string }) => unwrap<{ user: User }>(api.patch("/auth/me", payload)),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    unwrap<{ success: boolean }>(api.patch("/auth/me/password", payload)),
  deleteMe: (payload: { password: string }) => unwrap<{ success: boolean }>(api.delete("/auth/me", { data: payload })),
};

export const familyApi = {
  getFamily: () => unwrap<{ family: Family; members: FamilyMember[] }>(api.get("/family")),
};

export const dashboardApi = {
  get: () => unwrap<DashboardData>(api.get("/dashboard")),
};

export const groceryApi = {
  list: () => unwrap<GroceryItem[]>(api.get("/grocery")),
  create: (payload: { name: string; quantity: number; category: string }) => unwrap<GroceryItem>(api.post("/grocery", payload)),
  update: (id: string, payload: Partial<Pick<GroceryItem, "name" | "quantity" | "category" | "isChecked">>) =>
    unwrap<GroceryItem>(api.patch(`/grocery/${id}`, payload)),
  remove: (id: string) => unwrap<{ success: boolean }>(api.delete(`/grocery/${id}`)),
  clearCompleted: () => unwrap<{ success: boolean }>(api.delete("/grocery")),
};

export const budgetApi = {
  get: (month: number, year: number) =>
    unwrap<{ incomes: Income[]; expenses: Expense[]; summary: { totalIncome: number; totalExpenses: number; balance: number; spendingPercentage: number } }>(
      api.get(`/budget?month=${month}&year=${year}`)
    ),
  createIncome: (payload: { memberId: string; amount: number; month: number; year: number; note?: string }) =>
    unwrap<Income>(api.post("/budget/income", payload)),
  updateIncome: (id: string, payload: { memberId: string; amount: number; month: number; year: number; note?: string }) =>
    unwrap<Income>(api.patch(`/budget/income/${id}`, payload)),
  createExpense: (payload: { memberId: string; amount: number; category: string; description: string; date: string }) =>
    unwrap<Expense>(api.post("/budget/expenses", payload)),
  resetMonth: (month: number, year: number) =>
    unwrap<{ success: boolean }>(api.delete(`/budget/reset-month?month=${month}&year=${year}`)),
  deleteIncome: (id: string) => unwrap<{ success: boolean }>(api.delete(`/budget/income/${id}`)),
  deleteExpense: (id: string) => unwrap<{ success: boolean }>(api.delete(`/budget/expenses/${id}`)),
};

export const calendarApi = {
  list: () => unwrap<FamilyEvent[]>(api.get("/calendar")),
  create: (payload: { title: string; date: string; time: string; assignedTo: string; colorTag: string; note?: string }) =>
    unwrap<FamilyEvent>(api.post("/calendar", payload)),
  remove: (id: string) => unwrap<{ success: boolean }>(api.delete(`/calendar/${id}`)),
};

export const choresApi = {
  list: () => unwrap<Chore[]>(api.get("/chores")),
  create: (payload: { title: string; assignedTo: string; dueDate: string; recurring: "none" | "weekly" }) =>
    unwrap<Chore>(api.post("/chores", payload)),
  update: (id: string, payload: Partial<{ title: string; assignedTo: string; dueDate: string; recurring: "none" | "weekly"; isCompleted: boolean }>) =>
    unwrap<Chore>(api.patch(`/chores/${id}`, payload)),
  remove: (id: string) => unwrap<{ success: boolean }>(api.delete(`/chores/${id}`)),
  resetWeekly: () => unwrap<{ success: boolean }>(api.post("/chores/reset-weekly")),
};

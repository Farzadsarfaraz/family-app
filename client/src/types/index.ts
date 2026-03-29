export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatarColor: string;
  familyId: string | null;
};

export type Family = {
  id: string;
  name: string;
  inviteCode: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatarColor: string;
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  isChecked: boolean;
  createdAt: string;
};

export type BudgetSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spendingPercentage: number;
};

export type Income = {
  id: string;
  amount: number;
  month: number;
  year: number;
  note: string;
  member: FamilyMember;
};

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  member: FamilyMember;
};

export type FamilyEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  colorTag: string;
  note: string;
  assignedTo: FamilyMember;
};

export type Chore = {
  id: string;
  title: string;
  dueDate: string;
  recurring: "none" | "weekly";
  isCompleted: boolean;
  completedAt?: string | null;
  assignedTo: FamilyMember;
};

export type DashboardData = {
  groceryLeft: number;
  budget: { totalIncome: number; totalExpenses: number };
  nextEvent: FamilyEvent | null;
  choresToday: number;
};

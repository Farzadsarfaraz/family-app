export const serializeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: "admin" | "member";
  avatarColor: string;
  shareBudget: boolean;
  familyId: { toString(): string } | null;
}) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatarColor: user.avatarColor,
  shareBudget: user.shareBudget,
  familyId: user.familyId ? user.familyId.toString() : null,
});

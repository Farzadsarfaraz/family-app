import React, { useCallback, useMemo, useState } from "react";
import { Alert, Platform, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { useAuth } from "../context/AuthContext";
import { translateExpenseCategory, useLocale } from "../context/LocaleContext";
import { expenseCategories, sectionColors } from "../constants/theme";
import { budgetApi, familyApi } from "../services/api";
import { Expense, FamilyMember, Income } from "../types";
import { isoDate } from "../utils/format";

export const BudgetScreen = () => {
  const { user } = useAuth();
  const { t, formatCurrency, formatDate, formatMonthLabel } = useLocale();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year] = useState(now.getFullYear());
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, spendingPercentage: 0 });
  const [selectedMember, setSelectedMember] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeNote, setIncomeNote] = useState("");
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingIncomeMemberId, setEditingIncomeMemberId] = useState<string | null>(null);
  const [showIncomeForm, setShowIncomeForm] = useState(true);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState(expenseCategories[0]);
  const [customExpenseCategory, setCustomExpenseCategory] = useState("");
  const [showCustomExpenseCategoryInput, setShowCustomExpenseCategoryInput] = useState(false);
  const [expenseDate, setExpenseDate] = useState(isoDate());
  const [refreshing, setRefreshing] = useState(false);

  const availableExpenseCategories = useMemo(() => {
    const categories = new Set([
      ...expenseCategories,
      ...expenses.map((item) => item.category).filter(Boolean),
    ]);

    return Array.from(categories);
  }, [expenses]);

  const monthChoices = useMemo(
    () => Array.from({ length: 6 }, (_, index) => new Date(year, now.getMonth() - index, 1)).map((date) => ({ month: date.getMonth(), year: date.getFullYear() })),
    [now, year]
  );

  const currentUserMember = useMemo(
    () => members.find((member) => member.id === user?.id) ?? null,
    [members, user?.id]
  );

  const canManageIncome = useCallback(
    (income: Income) => income.member.id === user?.id,
    [user?.id]
  );

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const load = async () => {
    const [familyData, budgetData] = await Promise.all([familyApi.getFamily(), budgetApi.get(month, year)]);
    setMembers(familyData.members);
    setSelectedMember((current) => {
      if (user?.id && familyData.members.some((member) => member.id === user.id)) {
        return user.id;
      }

      if (current && familyData.members.some((member) => member.id === current)) {
        return current;
      }

      return familyData.members[0]?.id || "";
    });
    setIncomes(budgetData.incomes);
    setExpenses(budgetData.expenses);
    setSummary(budgetData.summary);
    setShowIncomeForm((current) => {
      if (editingIncomeId) {
        return current;
      }

      return budgetData.incomes.length === 0;
    });
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [month, year])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const addIncome = async () => {
    const parsedAmount = Number(incomeAmount);
    const targetMemberId = editingIncomeMemberId || user?.id || selectedMember;

    if (!targetMemberId) {
      showAlert(t("budget.alert.memberRequired"), t("budget.alert.memberRequiredBody"));
      return;
    }

    if (!incomeAmount.trim() || Number.isNaN(parsedAmount) || parsedAmount < 0) {
      showAlert(t("budget.alert.validIncome"), t("budget.alert.validIncomeBody"));
      return;
    }

    try {
      const payload = { memberId: targetMemberId, amount: parsedAmount, month, year, note: incomeNote };

      if (editingIncomeId) {
        await budgetApi.updateIncome(editingIncomeId, payload);
      } else {
        await budgetApi.createIncome(payload);
      }

      setIncomeAmount("");
      setIncomeNote("");
      setEditingIncomeId(null);
      setEditingIncomeMemberId(null);
      setShowIncomeForm(false);
      await load();
    } catch (error: any) {
      showAlert(
        editingIncomeId ? t("budget.alert.couldNotUpdateIncome") : t("budget.alert.couldNotAddIncome"),
        error?.response?.data?.error || "Try again."
      );
    }
  };

  const openIncomeEditor = (income?: Income) => {
    if (income) {
      setEditingIncomeId(income.id);
      setEditingIncomeMemberId(income.member.id);
      setIncomeAmount(String(income.amount));
      setIncomeNote(income.note || "");
    } else {
      setEditingIncomeId(null);
      setEditingIncomeMemberId(null);
      setIncomeAmount("");
      setIncomeNote("");
    }

    setShowIncomeForm(true);
  };

  const addExpense = async () => {
    const trimmedCustomCategory = customExpenseCategory.trim();

    if (showCustomExpenseCategoryInput && !trimmedCustomCategory) {
      showAlert(t("budget.alert.categoryRequired"), t("budget.alert.categoryRequiredBody"));
      return;
    }

    try {
      const nextCategory = trimmedCustomCategory || expenseCategory;

      await budgetApi.createExpense({
        memberId: selectedMember,
        amount: Number(expenseAmount),
        category: nextCategory,
        description: expenseDescription,
        date: expenseDate,
      });
      setExpenseAmount("");
      setExpenseDescription("");
      setCustomExpenseCategory("");
      setShowCustomExpenseCategoryInput(false);
      setExpenseDate(isoDate());
      await load();
    } catch (error: any) {
      showAlert(t("budget.alert.couldNotAddExpense"), error?.response?.data?.error || "Try again.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.budget} />}
    >
      <LinearGradient colors={["#7C2D12", "#9A3412", "#C2410C"]} className="mb-5 overflow-hidden rounded-[32px] px-6 py-5">
        <View className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 bottom-6 h-20 w-20 rounded-full bg-amber-200/10" />

        <Text className="text-xs font-bold uppercase tracking-[2px] text-orange-100">{t("budget.hero.badge")}</Text>
        <Text className="mt-2 text-[20px] font-black leading-7 text-white">{t("budget.hero.title")}</Text>
        <Text className="mt-2 max-w-[320px] text-sm leading-6 text-orange-50">{t("budget.hero.copy")}</Text>

        <View className="mt-5 flex-row">
          <View className="mr-3 flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-orange-100">{t("budget.hero.income")}</Text>
            <Text className="mt-2 text-xl font-black text-white">{formatCurrency(summary.totalIncome)}</Text>
          </View>
          <View className="flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-orange-100">{t("budget.hero.balance")}</Text>
            <Text className="mt-2 text-xl font-black text-white">{formatCurrency(summary.balance)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {monthChoices.map((choice) => (
          <FilterChip
            key={`${choice.month}-${choice.year}`}
            active={month === choice.month}
            label={formatMonthLabel(choice.month, choice.year)}
            onPress={() => setMonth(choice.month)}
            color={sectionColors.budget}
          />
        ))}
      </ScrollView>

      <SurfaceCard className="rounded-[28px] border border-white/70 bg-white/95 p-4">
        <View>
          <View>
            <Text className="text-sm font-bold uppercase tracking-[1.6px] text-slate-400">{t("budget.monthlySummary")}</Text>
            <Text className="mt-1.5 text-lg font-black tracking-[-0.3px] text-ink">{formatMonthLabel(month, year)}</Text>
          </View>
        </View>
        <View className="mt-4 flex-row">
          <View className="mr-2.5 flex-1 rounded-[20px] bg-emerald-50 px-3.5 py-3.5">
            <Text className="text-xs text-slate-500">{t("budget.hero.income")}</Text>
            <Text className="mt-1.5 text-lg font-black text-emerald-700">{formatCurrency(summary.totalIncome)}</Text>
          </View>
          <View className="mr-2.5 flex-1 rounded-[20px] bg-amber-50 px-3.5 py-3.5">
            <Text className="text-xs text-slate-500">{t("budget.expenses")}</Text>
            <Text className="mt-1.5 text-lg font-black text-amber-700">{formatCurrency(summary.totalExpenses)}</Text>
          </View>
          <View className="flex-1 rounded-[20px] bg-slate-100 px-3.5 py-3.5">
            <Text className="text-xs text-slate-500">{t("budget.hero.balance")}</Text>
            <Text className="mt-1.5 text-lg font-black" style={{ color: sectionColors.budget }}>
              {formatCurrency(summary.balance)}
            </Text>
          </View>
        </View>
        <View className="mt-4 h-2.5 rounded-full bg-slate-100">
          <View style={{ width: `${summary.spendingPercentage}%`, backgroundColor: sectionColors.budget }} className="h-2.5 rounded-full" />
        </View>
        <Text className="mt-1.5 text-xs text-slate-500">{t("budget.spendingPercent", { count: Math.round(summary.spendingPercentage) })}</Text>
      </SurfaceCard>

      <SurfaceCard className="rounded-[28px] border border-white/70 bg-white/95 p-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-[17px] font-black tracking-[-0.2px] text-ink">{editingIncomeId ? t("budget.editMonthlyIncome") : t("budget.monthlyIncome")}</Text>
        </View>
        <Text className="mb-3 text-sm text-slate-500">
          {incomes.length > 0
            ? t("budget.monthlyIncomeHint")
            : t("budget.monthlyIncomeHint")}
        </Text>

        {incomes.length > 0 ? (
          <View className="mb-3">
            {incomes.map((item) => (
              <View key={`income-card-${item.id}`} className="mb-2.5 rounded-[20px] bg-emerald-50 px-3.5 py-3.5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[17px] font-black text-emerald-900">{formatCurrency(item.amount)}</Text>
                    <Text className="mt-1 text-sm font-semibold text-emerald-800">{item.member.name}</Text>
                    <Text className="mt-0.5 text-sm text-emerald-700">{item.note || formatMonthLabel(item.month, item.year)}</Text>
                  </View>
                  {canManageIncome(item) ? (
                    <View className="items-end">
                      <Pressable onPress={() => openIncomeEditor(item)} className="mb-1.5 px-1 py-0.5">
                        <Text className="text-xs font-bold" style={{ color: sectionColors.budget }}>
                          {t("common.edit")}
                        </Text>
                      </Pressable>
                      <Text onPress={() => budgetApi.deleteIncome(item.id).then(load)} className="text-xs font-semibold text-rose-500">
                        {t("common.delete")}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
            <Pressable
              onPress={() => {
                if (showIncomeForm && !editingIncomeId) {
                  setShowIncomeForm(false);
                  setIncomeAmount("");
                  setIncomeNote("");
                  setEditingIncomeId(null);
                  setEditingIncomeMemberId(null);
                  return;
                }

                openIncomeEditor();
              }}
              className={`self-start rounded-full px-3.5 py-1.5 ${showIncomeForm && !editingIncomeId ? "bg-slate-100" : "bg-amber-50"}`}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: showIncomeForm && !editingIncomeId ? "#64748B" : sectionColors.budget }}
              >
                {showIncomeForm && !editingIncomeId ? t("common.cancel") : t("budget.addAnotherAmount")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {showIncomeForm ? (
          <>
            <View className="mb-3 rounded-[20px] bg-slate-50 px-3.5 py-3">
              <Text className="text-xs font-bold uppercase tracking-[1.5px] text-slate-400">{t("budget.member")}</Text>
              <Text className="mt-1 text-sm font-semibold text-ink">
                {editingIncomeId
                  ? incomes.find((item) => item.id === editingIncomeId)?.member.name || currentUserMember?.name || user?.name || "-"
                  : currentUserMember?.name || user?.name || "-"}
              </Text>
            </View>
            <FormInput label={t("budget.amount")} value={incomeAmount} onChangeText={setIncomeAmount} keyboardType="numeric" placeholder="3200" />
            <FormInput label={t("budget.note")} value={incomeNote} onChangeText={setIncomeNote} placeholder="Main salary" />
            <PrimaryButton label={editingIncomeId ? t("budget.saveIncomeChanges") : t("budget.addIncome")} onPress={addIncome} color={sectionColors.budget} />
          </>
        ) : (
          <View className="rounded-[20px] bg-slate-50 px-3.5 py-3.5">
            <Text className="text-sm text-slate-500">{t("budget.incomeInputsHidden")}</Text>
          </View>
        )}
      </SurfaceCard>

      <SurfaceCard className="rounded-[28px] border border-white/70 bg-white/95 p-4">
        <Text className="mb-2.5 text-[17px] font-black tracking-[-0.2px] text-ink">{t("budget.addExpense")}</Text>
        <FormInput label={t("budget.description")} value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Groceries at market" />
        <FormInput label={t("budget.amount")} value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" placeholder="78" />
        <FormInput label={t("budget.date")} value={expenseDate} onChangeText={setExpenseDate} placeholder="2026-03-29" />
        <View className="mb-1">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-600">{t("grocery.category")}</Text>
            <Text className="text-xs font-semibold text-slate-400">{t("common.swipeMore")}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableExpenseCategories.map((option) => (
              <View key={option} className="mr-2">
                <FilterChip active={expenseCategory === option} label={translateExpenseCategory(option, t)} onPress={() => setExpenseCategory(option)} color={sectionColors.budget} />
              </View>
            ))}
            <Pressable
              onPress={() => setShowCustomExpenseCategoryInput((value) => !value)}
              style={{ borderColor: sectionColors.budget }}
              className={`rounded-full border px-3.5 py-1.5 ${showCustomExpenseCategoryInput ? "bg-amber-50" : "bg-white"}`}
            >
              <Text className="text-xs font-semibold" style={{ color: sectionColors.budget }}>
                {showCustomExpenseCategoryInput ? t("grocery.customClose") : t("grocery.customAdd")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
        {showCustomExpenseCategoryInput ? (
          <View className="mb-3.5 rounded-[20px] border border-amber-100 bg-amber-50 px-3.5 py-3.5">
            <Text className="mb-1.5 text-xs font-bold uppercase tracking-[1.4px]" style={{ color: sectionColors.budget }}>
              {t("grocery.customTitle")}
            </Text>
            <FormInput label={t("grocery.customCategory")} value={customExpenseCategory} onChangeText={setCustomExpenseCategory} placeholder="Pets, Gifts, Travel..." />
            <Text className="text-sm text-slate-500">{t("budget.customHint")}</Text>
          </View>
        ) : (
          <Text className="mb-3.5 text-sm text-slate-500">{t("budget.customPrompt")}</Text>
        )}
        <PrimaryButton label={t("budget.addExpenseButton")} onPress={addExpense} color={sectionColors.budget} />
      </SurfaceCard>

      <SurfaceCard className="rounded-[28px] border border-white/70 bg-white/95 p-4">
        <Text className="mb-2.5 text-[17px] font-black tracking-[-0.2px] text-ink">{t("budget.transactions")}</Text>
        {expenses.length === 0 ? (
          <EmptyState title={t("budget.emptyTitle")} message={t("budget.emptyBody")} />
        ) : (
          <>
            {expenses.map((item) => (
              <View key={`expense-${item.id}`} className="mb-2.5 flex-row items-center justify-between rounded-[20px] bg-amber-50 px-3.5 py-3.5">
                <View className="flex-1">
                  <Text className="font-semibold text-ink">{item.description}</Text>
                  <Text className="text-sm text-slate-500">
                    {translateExpenseCategory(item.category, t)} · {formatDate(item.date)}
                  </Text>
                </View>
                <Text className="mr-3 text-sm font-bold text-amber-700">{formatCurrency(item.amount)}</Text>
                <Text onPress={() => budgetApi.deleteExpense(item.id).then(load)} className="text-xs font-semibold text-rose-500">
                  {t("common.delete")}
                </Text>
              </View>
            ))}
          </>
        )}
      </SurfaceCard>
    </ScrollView>
  );
};

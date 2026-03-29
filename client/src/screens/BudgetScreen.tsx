import React, { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionHeader } from "../components/SectionHeader";
import { SurfaceCard } from "../components/SurfaceCard";
import { expenseCategories, sectionColors } from "../constants/theme";
import { budgetApi, familyApi } from "../services/api";
import { Expense, FamilyMember, Income } from "../types";
import { currency, isoDate, monthLabel, readableDate } from "../utils/format";

export const BudgetScreen = () => {
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
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState(expenseCategories[0]);
  const [expenseDate, setExpenseDate] = useState(isoDate());
  const [refreshing, setRefreshing] = useState(false);

  const monthChoices = useMemo(
    () => Array.from({ length: 6 }, (_, index) => new Date(year, now.getMonth() - index, 1)).map((date) => ({ month: date.getMonth(), year: date.getFullYear() })),
    [now, year]
  );

  const load = async () => {
    const [familyData, budgetData] = await Promise.all([familyApi.getFamily(), budgetApi.get(month, year)]);
    setMembers(familyData.members);
    setSelectedMember((current) => current || familyData.members[0]?.id || "");
    setIncomes(budgetData.incomes);
    setExpenses(budgetData.expenses);
    setSummary(budgetData.summary);
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
    try {
      await budgetApi.createIncome({ memberId: selectedMember, amount: Number(incomeAmount), month, year, note: incomeNote });
      setIncomeAmount("");
      setIncomeNote("");
      await load();
    } catch (error: any) {
      Alert.alert("Could not add income", error?.response?.data?.error || "Try again.");
    }
  };

  const addExpense = async () => {
    try {
      await budgetApi.createExpense({
        memberId: selectedMember,
        amount: Number(expenseAmount),
        category: expenseCategory,
        description: expenseDescription,
        date: expenseDate,
      });
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseDate(isoDate());
      await load();
    } catch (error: any) {
      Alert.alert("Could not add expense", error?.response?.data?.error || "Try again.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.budget} />}
    >
      <SectionHeader title="Budget" subtitle="Track income, expenses, and what is left this month" accent={sectionColors.budget} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {monthChoices.map((choice) => (
          <FilterChip
            key={`${choice.month}-${choice.year}`}
            active={month === choice.month}
            label={monthLabel(choice.month, choice.year)}
            onPress={() => setMonth(choice.month)}
            color={sectionColors.budget}
          />
        ))}
      </ScrollView>

      <SurfaceCard>
        <Text className="text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly summary</Text>
        <View className="mt-4 flex-row justify-between">
          <View>
            <Text className="text-sm text-slate-500">Income</Text>
            <Text className="text-xl font-bold text-ink">{currency(summary.totalIncome)}</Text>
          </View>
          <View>
            <Text className="text-sm text-slate-500">Expenses</Text>
            <Text className="text-xl font-bold text-ink">{currency(summary.totalExpenses)}</Text>
          </View>
          <View>
            <Text className="text-sm text-slate-500">Balance</Text>
            <Text className="text-xl font-bold" style={{ color: sectionColors.budget }}>
              {currency(summary.balance)}
            </Text>
          </View>
        </View>
        <View className="mt-5 h-3 rounded-full bg-slate-100">
          <View style={{ width: `${summary.spendingPercentage}%`, backgroundColor: sectionColors.budget }} className="h-3 rounded-full" />
        </View>
        <Text className="mt-2 text-sm text-slate-500">{Math.round(summary.spendingPercentage)}% of income has been spent.</Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text className="mb-3 text-lg font-bold text-ink">Add monthly income</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {members.map((member) => (
            <FilterChip key={member.id} active={selectedMember === member.id} label={member.name.split(" ")[0]} onPress={() => setSelectedMember(member.id)} color={sectionColors.budget} />
          ))}
        </ScrollView>
        <FormInput label="Amount" value={incomeAmount} onChangeText={setIncomeAmount} keyboardType="numeric" placeholder="3200" />
        <FormInput label="Note" value={incomeNote} onChangeText={setIncomeNote} placeholder="Main salary" />
        <PrimaryButton label="Add income" onPress={addIncome} color={sectionColors.budget} />
      </SurfaceCard>

      <SurfaceCard>
        <Text className="mb-3 text-lg font-bold text-ink">Add expense</Text>
        <FormInput label="Description" value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Groceries at market" />
        <FormInput label="Amount" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" placeholder="78" />
        <FormInput label="Date" value={expenseDate} onChangeText={setExpenseDate} placeholder="2026-03-29" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {expenseCategories.map((option) => (
            <FilterChip key={option} active={expenseCategory === option} label={option} onPress={() => setExpenseCategory(option)} color={sectionColors.budget} />
          ))}
        </ScrollView>
        <PrimaryButton label="Add expense" onPress={addExpense} color={sectionColors.budget} />
      </SurfaceCard>

      <SurfaceCard>
        <Text className="mb-3 text-lg font-bold text-ink">Transactions</Text>
        {incomes.length === 0 && expenses.length === 0 ? (
          <EmptyState title="No transactions yet" message="Add salary or expenses to start tracking your family budget." />
        ) : (
          <>
            {incomes.map((item) => (
              <View key={`income-${item.id}`} className="mb-3 flex-row items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                <View className="flex-1">
                  <Text className="font-semibold text-ink">Income · {item.member.name}</Text>
                  <Text className="text-sm text-slate-500">{item.note || monthLabel(item.month, item.year)}</Text>
                </View>
                <Text className="mr-4 font-bold text-emerald-600">{currency(item.amount)}</Text>
                <Text onPress={() => budgetApi.deleteIncome(item.id).then(load)} className="text-sm font-semibold text-rose-500">
                  Delete
                </Text>
              </View>
            ))}
            {expenses.map((item) => (
              <View key={`expense-${item.id}`} className="mb-3 flex-row items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                <View className="flex-1">
                  <Text className="font-semibold text-ink">{item.description}</Text>
                  <Text className="text-sm text-slate-500">
                    {item.category} · {readableDate(item.date)}
                  </Text>
                </View>
                <Text className="mr-4 font-bold text-amber-700">{currency(item.amount)}</Text>
                <Text onPress={() => budgetApi.deleteExpense(item.id).then(load)} className="text-sm font-semibold text-rose-500">
                  Delete
                </Text>
              </View>
            ))}
          </>
        )}
      </SurfaceCard>
    </ScrollView>
  );
};

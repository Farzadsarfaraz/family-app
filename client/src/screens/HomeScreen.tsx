import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { dashboardApi, familyApi } from "../services/api";
import { DashboardData, FamilyMember } from "../types";
import { SurfaceCard } from "../components/SurfaceCard";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { sectionColors } from "../constants/theme";

const initialDashboard: DashboardData = {
  groceryLeft: 0,
  budget: { totalIncome: 0, totalExpenses: 0 },
  nextEvent: null,
  choresToday: 0,
};

export const HomeScreen = () => {
  const { user, family, signOut } = useAuth();
  const { t, formatDate, formatCurrency } = useLocale();
  const navigation = useNavigation<any>();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [dashboardData, familyData] = await Promise.all([dashboardApi.get(), familyApi.getFamily()]);
    setDashboard(dashboardData);
    setMembers(familyData.members);
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const cards = [
    {
      title: t("home.card.groceries.title"),
      value: t("home.card.groceries.value", { count: dashboard.groceryLeft }),
      helper: t("home.card.groceries.helper"),
      color: sectionColors.grocery,
      softColor: "#DCFCE7",
      route: "Grocery",
      emoji: "🛒",
    },
    {
      title: t("home.card.budget.title"),
      value: t("home.card.budget.value", { spent: formatCurrency(dashboard.budget.totalExpenses), total: formatCurrency(dashboard.budget.totalIncome) }),
      helper: t("home.card.budget.helper"),
      color: sectionColors.budget,
      softColor: "#FFEDD5",
      route: "Budget",
      emoji: "💰",
    },
    {
      title: t("home.card.calendar.title"),
      value: dashboard.nextEvent ? `${dashboard.nextEvent.title} · ${formatDate(dashboard.nextEvent.date)}` : t("home.card.calendar.empty"),
      helper: t("home.card.calendar.helper"),
      color: sectionColors.calendar,
      softColor: "#E0F2FE",
      route: "Calendar",
      emoji: "📅",
    },
    {
      title: t("home.card.chores.title"),
      value: t("home.card.chores.value", { count: dashboard.choresToday }),
      helper: t("home.card.chores.helper"),
      color: sectionColors.chores,
      softColor: "#F3E8FF",
      route: "Chores",
      emoji: "✅",
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
    >
      <View className="mb-3 self-start">
        <LanguageSwitcher compact />
      </View>

      <LinearGradient colors={["#0F172A", "#1E1B4B", "#312E81"]} className="mb-5 overflow-hidden rounded-[28px] px-4 py-3.5">
        <View className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <View className="absolute -left-8 bottom-6 h-24 w-24 rounded-full bg-cyan-400/10" />

        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[10px] font-bold uppercase tracking-[1.6px] text-indigo-200">{t("home.badge")}</Text>
            <Text className="mt-1.5 text-[16px] font-black leading-5 text-white">
              {t("home.hello", { name: user?.name?.split(" ")[0] ?? "family" })}
            </Text>
            <Text className="mt-1 text-xs leading-4 text-slate-300">
              {formatDate(new Date())} · {family?.name ?? "GoFamly"}
            </Text>
          </View>
          <Pressable onPress={signOut} className="rounded-full bg-white/10 px-3 py-1.5">
            <Text className="text-[11px] font-bold text-white">{t("home.signOut")}</Text>
          </Pressable>
        </View>

        <View className="mt-3 rounded-[20px] bg-white/10 px-3 py-3">
          <Text className="text-[11px] font-bold uppercase tracking-[1.8px] text-indigo-100">{t("home.familyCircle")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            {members.map((member) => (
              <View key={member.id} className="mr-3 items-center">
                <View style={{ backgroundColor: member.avatarColor }} className="h-10 w-10 items-center justify-center rounded-full border-2 border-white/20">
                  <Text className="text-sm font-black text-white">{member.name.slice(0, 1)}</Text>
                </View>
                <Text className="mt-1.5 text-[11px] font-bold text-white">{member.name.split(" ")[0]}</Text>
              </View>
            ))}
          </ScrollView>
          <View className="mt-3 flex-row items-center justify-between rounded-[16px] bg-black/10 px-3 py-2.5">
            <Text className="text-[11px] font-semibold text-slate-200">{t("home.inviteCode")}</Text>
            <Text className="text-[11px] font-black tracking-[1.8px] text-white">{family?.inviteCode ?? "..."}</Text>
          </View>
        </View>
      </LinearGradient>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-black tracking-[-0.6px] text-ink">{t("home.quickView")}</Text>
        <Text className="text-sm font-semibold text-slate-400">{t("home.tapCard")}</Text>
      </View>

      {cards.map((card) => (
        <Pressable key={card.title} onPress={() => navigation.navigate(card.route)}>
          <SurfaceCard className="overflow-hidden p-0">
            <View className="flex-row">
              <View style={{ backgroundColor: card.color }} className="w-3" />
              <View className="flex-1 px-5 py-5">
                <View className="flex-row items-start justify-between">
                  <View style={{ backgroundColor: card.softColor }} className="rounded-2xl px-3 py-2">
                    <Text className="text-2xl">{card.emoji}</Text>
                  </View>
                  <Text className="text-xs font-bold uppercase tracking-[1.6px] text-slate-400">{t("home.open")}</Text>
                </View>
                <Text className="mt-4 text-xl font-black tracking-[-0.4px] text-ink">{card.title}</Text>
                <Text className="mt-1 text-base font-semibold leading-6" style={{ color: card.color }}>
                  {card.value}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-500">{card.helper}</Text>
              </View>
            </View>
          </SurfaceCard>
        </Pressable>
      ))}
    </ScrollView>
  );
};

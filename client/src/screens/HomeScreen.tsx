import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, familyApi } from "../services/api";
import { DashboardData, FamilyMember } from "../types";
import { readableDate, currency } from "../utils/format";
import { SurfaceCard } from "../components/SurfaceCard";
import { sectionColors } from "../constants/theme";

const initialDashboard: DashboardData = {
  groceryLeft: 0,
  budget: { totalIncome: 0, totalExpenses: 0 },
  nextEvent: null,
  choresToday: 0,
};

export const HomeScreen = () => {
  const { user, family, signOut } = useAuth();
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
      title: "Groceries",
      value: `${dashboard.groceryLeft} items left`,
      helper: "Shared shopping list",
      color: sectionColors.grocery,
      softColor: "#DCFCE7",
      route: "Grocery",
      emoji: "🛒",
    },
    {
      title: "Budget",
      value: `${currency(dashboard.budget.totalExpenses)} of ${currency(dashboard.budget.totalIncome)}`,
      helper: "Spent this month",
      color: sectionColors.budget,
      softColor: "#FFEDD5",
      route: "Budget",
      emoji: "💰",
    },
    {
      title: "Calendar",
      value: dashboard.nextEvent ? `${dashboard.nextEvent.title} · ${readableDate(dashboard.nextEvent.date)}` : "Nothing scheduled yet",
      helper: "Next upcoming event",
      color: sectionColors.calendar,
      softColor: "#E0F2FE",
      route: "Calendar",
      emoji: "📅",
    },
    {
      title: "Chores",
      value: `${dashboard.choresToday} due today`,
      helper: "Pending tasks",
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
      <LinearGradient colors={["#0F172A", "#1E1B4B", "#312E81"]} className="mb-5 overflow-hidden rounded-[28px] px-4 py-3.5">
        <View className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <View className="absolute -left-8 bottom-6 h-24 w-24 rounded-full bg-cyan-400/10" />

        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[10px] font-bold uppercase tracking-[1.6px] text-indigo-200">Today at home</Text>
            <Text className="mt-1.5 text-[16px] font-black leading-5 text-white">
              Hello, {user?.name?.split(" ")[0] ?? "family"}
            </Text>
            <Text className="mt-1 text-xs leading-4 text-slate-300">
              {readableDate(new Date())} · {family?.name ?? "Your family space"}
            </Text>
          </View>
          <Pressable onPress={signOut} className="rounded-full bg-white/10 px-3 py-1.5">
            <Text className="text-[11px] font-bold text-white">Sign out</Text>
          </Pressable>
        </View>

        <View className="mt-3 rounded-[20px] bg-white/10 px-3 py-3">
          <Text className="text-[11px] font-bold uppercase tracking-[1.8px] text-indigo-100">Family circle</Text>
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
            <Text className="text-[11px] font-semibold text-slate-200">Invite code</Text>
            <Text className="text-[11px] font-black tracking-[1.8px] text-white">{family?.inviteCode ?? "..."}</Text>
          </View>
        </View>
      </LinearGradient>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-black tracking-[-0.6px] text-ink">Quick view</Text>
        <Text className="text-sm font-semibold text-slate-400">Tap any card</Text>
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
                  <Text className="text-xs font-bold uppercase tracking-[1.6px] text-slate-400">Open</Text>
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

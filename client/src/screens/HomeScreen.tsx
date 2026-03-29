import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, familyApi } from "../services/api";
import { DashboardData, FamilyMember } from "../types";
import { readableDate, currency } from "../utils/format";
import { SectionHeader } from "../components/SectionHeader";
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
      route: "Grocery",
      emoji: "🛒",
    },
    {
      title: "Budget",
      value: `${currency(dashboard.budget.totalExpenses)} of ${currency(dashboard.budget.totalIncome)}`,
      helper: "Spent this month",
      color: sectionColors.budget,
      route: "Budget",
      emoji: "💰",
    },
    {
      title: "Calendar",
      value: dashboard.nextEvent ? `${dashboard.nextEvent.title} · ${readableDate(dashboard.nextEvent.date)}` : "Nothing scheduled yet",
      helper: "Next upcoming event",
      color: sectionColors.calendar,
      route: "Calendar",
      emoji: "📅",
    },
    {
      title: "Chores",
      value: `${dashboard.choresToday} due today`,
      helper: "Pending tasks",
      color: sectionColors.chores,
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
      <SectionHeader
        title={`Hello, ${user?.name?.split(" ")[0] ?? "family"}`}
        subtitle={`${readableDate(new Date())} · ${family?.name ?? "Your family space"}`}
        accent={sectionColors.home}
      />

      <SurfaceCard>
        <Text className="text-sm font-semibold uppercase tracking-wide text-slate-500">Family members</Text>
        <View className="mt-4 flex-row flex-wrap">
          {members.map((member) => (
            <View key={member.id} className="mb-3 mr-3 items-center">
              <View style={{ backgroundColor: member.avatarColor }} className="h-12 w-12 items-center justify-center rounded-full">
                <Text className="text-lg font-bold text-white">{member.name.slice(0, 1)}</Text>
              </View>
              <Text className="mt-2 text-xs font-semibold text-slate-600">{member.name.split(" ")[0]}</Text>
            </View>
          ))}
        </View>
        <Text className="text-sm text-slate-500">Invite code: {family?.inviteCode ?? "..."}</Text>
      </SurfaceCard>

      {cards.map((card) => (
        <SurfaceCard key={card.title}>
          <Text className="text-2xl">{card.emoji}</Text>
          <Text className="mt-3 text-xl font-bold text-ink">{card.title}</Text>
          <Text className="mt-1 text-lg font-semibold" style={{ color: card.color }}>
            {card.value}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">{card.helper}</Text>
          <Text onPress={() => navigation.navigate(card.route)} className="mt-4 text-sm font-semibold" style={{ color: card.color }}>
            Open section
          </Text>
        </SurfaceCard>
      ))}

      <Text onPress={signOut} className="mt-2 text-center text-sm font-semibold text-slate-500">
        Sign out
      </Text>
    </ScrollView>
  );
};

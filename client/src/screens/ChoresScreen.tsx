import React, { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { choresApi, familyApi } from "../services/api";
import { sectionColors } from "../constants/theme";
import { Chore, FamilyMember } from "../types";
import { isoDate, readableDate } from "../utils/format";

export const ChoresScreen = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(isoDate());
  const [assignedTo, setAssignedTo] = useState("");
  const [recurring, setRecurring] = useState<"none" | "weekly">("weekly");
  const [memberFilter, setMemberFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [familyData, choresData] = await Promise.all([familyApi.getFamily(), choresApi.list()]);
    setMembers(familyData.members);
    setAssignedTo((current) => current || familyData.members[0]?.id || "");
    setChores(choresData);
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [])
  );

  const filtered = useMemo(
    () =>
      chores.filter((item) => {
        const matchesMember = memberFilter === "All" || item.assignedTo.id === memberFilter;
        const matchesStatus = statusFilter === "all" || (statusFilter === "done" ? item.isCompleted : !item.isCompleted);
        return matchesMember && matchesStatus;
      }),
    [chores, memberFilter, statusFilter]
  );
  const pendingCount = chores.filter((item) => !item.isCompleted).length;
  const doneCount = chores.filter((item) => item.isCompleted).length;

  const addChore = async () => {
    try {
      await choresApi.create({ title, assignedTo, dueDate, recurring });
      setTitle("");
      setDueDate(isoDate());
      await load();
    } catch (error: any) {
      Alert.alert("Could not add chore", error?.response?.data?.error || "Try again.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.chores} />}
    >
      <LinearGradient colors={["#4C1D95", "#6D28D9", "#7C3AED"]} className="mb-5 overflow-hidden rounded-[32px] px-6 py-5">
        <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 bottom-6 h-20 w-20 rounded-full bg-violet-200/10" />

        <Text className="text-xs font-bold uppercase tracking-[2px] text-violet-100">Shared rhythm</Text>
        <Text className="mt-2 text-[20px] font-black leading-7 text-white">Chores</Text>
        <Text className="mt-2 max-w-[320px] text-sm leading-6 text-violet-50">
          Keep responsibilities clear, fair, and easy to follow for every family member.
        </Text>

        <View className="mt-5 flex-row">
          <View className="mr-3 flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-violet-100">Pending</Text>
            <Text className="mt-2 text-xl font-black text-white">{pendingCount}</Text>
          </View>
          <View className="flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-violet-100">Done</Text>
            <Text className="mt-2 text-xl font-black text-white">{doneCount}</Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <Text className="mb-3 text-lg font-black tracking-[-0.3px] text-ink">Assign a chore</Text>
        <FormInput label="Chore" value={title} onChangeText={setTitle} placeholder="Take out trash" />
        <FormInput label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="2026-03-29" />
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-600">Assign to</Text>
          <Text className="text-xs font-semibold text-slate-400">Swipe to see more →</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {members.map((member) => (
            <FilterChip key={member.id} active={assignedTo === member.id} label={member.name.split(" ")[0]} onPress={() => setAssignedTo(member.id)} color={member.avatarColor} />
          ))}
        </ScrollView>
        <View className="mb-4 flex-row">
          <FilterChip active={recurring === "none"} label="One-time" onPress={() => setRecurring("none")} color={sectionColors.chores} />
          <FilterChip active={recurring === "weekly"} label="Weekly reset" onPress={() => setRecurring("weekly")} color={sectionColors.chores} />
        </View>
        <PrimaryButton label="Add chore" onPress={addChore} color={sectionColors.chores} />
      </SurfaceCard>

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-black tracking-[-0.3px] text-ink">Filters</Text>
          <Text onPress={() => choresApi.resetWeekly().then(load)} className="text-sm font-bold" style={{ color: sectionColors.chores }}>
            Reset weekly chores
          </Text>
        </View>
        <Text className="mb-2 text-sm font-semibold text-slate-600">By member</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <FilterChip active={memberFilter === "All"} label="All members" onPress={() => setMemberFilter("All")} color={sectionColors.chores} />
          {members.map((member) => (
            <FilterChip key={member.id} active={memberFilter === member.id} label={member.name.split(" ")[0]} onPress={() => setMemberFilter(member.id)} color={member.avatarColor} />
          ))}
        </ScrollView>

        <Text className="mb-2 text-sm font-semibold text-slate-600">By status</Text>
        <View className="flex-row">
          <FilterChip active={statusFilter === "all"} label="All" onPress={() => setStatusFilter("all")} color={sectionColors.chores} />
          <FilterChip active={statusFilter === "pending"} label="Pending" onPress={() => setStatusFilter("pending")} color={sectionColors.chores} />
          <FilterChip active={statusFilter === "done"} label="Done" onPress={() => setStatusFilter("done")} color={sectionColors.chores} />
        </View>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <EmptyState title="No chores to show" message="Add a chore or change the filters to see the family task list." />
      ) : (
        filtered.map((item) => (
          <SurfaceCard key={item.id} className="rounded-[28px] p-0 overflow-hidden">
            <View className="flex-row items-center">
              <View style={{ backgroundColor: item.isCompleted ? "#E9D5FF" : "#F3E8FF" }} className="h-full w-4" />
              <View className="flex-1 flex-row items-center px-4 py-4">
              <Text
                onPress={() => choresApi.update(item.id, { isCompleted: !item.isCompleted }).then(load)}
                className="mr-4 text-2xl"
              >
                {item.isCompleted ? "✅" : "⬜️"}
              </Text>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${item.isCompleted ? "text-slate-400 line-through" : "text-ink"}`}>{item.title}</Text>
                <View className="mt-2 flex-row flex-wrap items-center">
                  <View className="mr-2 mb-1 rounded-full bg-violet-50 px-3 py-1">
                    <Text className="text-xs font-bold" style={{ color: sectionColors.chores }}>
                      {item.assignedTo.name}
                    </Text>
                  </View>
                  <Text className="mr-2 mb-1 text-sm text-slate-500">Due {readableDate(item.dueDate)}</Text>
                  {item.recurring === "weekly" ? (
                    <View className="mb-1 rounded-full bg-slate-100 px-3 py-1">
                      <Text className="text-xs font-bold text-slate-500">Weekly</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Text onPress={() => choresApi.remove(item.id).then(load)} className="text-sm font-semibold text-rose-500">
                Delete
              </Text>
              </View>
            </View>
          </SurfaceCard>
        ))
      )}
    </ScrollView>
  );
};

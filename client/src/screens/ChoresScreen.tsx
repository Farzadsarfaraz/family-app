import React, { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionHeader } from "../components/SectionHeader";
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
      <SectionHeader title="Chores" subtitle="Keep responsibilities clear and shared" accent={sectionColors.chores} />

      <SurfaceCard>
        <Text className="mb-3 text-lg font-bold text-ink">Assign a chore</Text>
        <FormInput label="Chore" value={title} onChangeText={setTitle} placeholder="Take out trash" />
        <FormInput label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="2026-03-29" />
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <FilterChip active={memberFilter === "All"} label="All members" onPress={() => setMemberFilter("All")} color={sectionColors.chores} />
        {members.map((member) => (
          <FilterChip key={member.id} active={memberFilter === member.id} label={member.name.split(" ")[0]} onPress={() => setMemberFilter(member.id)} color={member.avatarColor} />
        ))}
      </ScrollView>

      <View className="mb-4 flex-row">
        <FilterChip active={statusFilter === "all"} label="All" onPress={() => setStatusFilter("all")} color={sectionColors.chores} />
        <FilterChip active={statusFilter === "pending"} label="Pending" onPress={() => setStatusFilter("pending")} color={sectionColors.chores} />
        <FilterChip active={statusFilter === "done"} label="Done" onPress={() => setStatusFilter("done")} color={sectionColors.chores} />
      </View>

      <Text onPress={() => choresApi.resetWeekly().then(load)} className="mb-4 text-right text-sm font-semibold" style={{ color: sectionColors.chores }}>
        Reset weekly chores
      </Text>

      {filtered.length === 0 ? (
        <EmptyState title="No chores to show" message="Add a chore or change the filters to see the family task list." />
      ) : (
        filtered.map((item) => (
          <SurfaceCard key={item.id}>
            <View className="flex-row items-center">
              <Text
                onPress={() => choresApi.update(item.id, { isCompleted: !item.isCompleted }).then(load)}
                className="mr-4 text-2xl"
              >
                {item.isCompleted ? "✅" : "⬜️"}
              </Text>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${item.isCompleted ? "text-slate-400 line-through" : "text-ink"}`}>{item.title}</Text>
                <Text className="text-sm text-slate-500">
                  {item.assignedTo.name} · Due {readableDate(item.dueDate)} {item.recurring === "weekly" ? "· Weekly" : ""}
                </Text>
              </View>
              <Text onPress={() => choresApi.remove(item.id).then(load)} className="text-sm font-semibold text-rose-500">
                Delete
              </Text>
            </View>
          </SurfaceCard>
        ))
      )}
    </ScrollView>
  );
};

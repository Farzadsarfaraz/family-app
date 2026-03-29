import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { useAppDialog } from "../context/AppDialogContext";
import { useLocale } from "../context/LocaleContext";
import { choresApi, familyApi } from "../services/api";
import { sectionColors } from "../constants/theme";
import { Chore, FamilyMember } from "../types";
import { isoDate } from "../utils/format";

export const ChoresScreen = () => {
  const { showAlert } = useAppDialog();
  const { t, formatDate } = useLocale();
  const scrollRef = useRef<ScrollView | null>(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
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
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
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
      showAlert({ title: t("chores.alert.couldNotAdd"), message: error?.response?.data?.error || "Try again.", tone: "danger" });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: isCompact ? 16 : 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.chores} />}
    >
      <LinearGradient colors={["#4C1D95", "#6D28D9", "#7C3AED"]} className={`mb-5 overflow-hidden ${isCompact ? "rounded-[26px] px-4 py-4" : "rounded-[32px] px-6 py-5"}`}>
        <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 bottom-6 h-20 w-20 rounded-full bg-violet-200/10" />
        <View className={`absolute rotate-[7deg] ${isCompact ? "right-4 top-4 px-2 py-2" : "right-5 top-5 px-3 py-3"}`}>
          <Text className={isCompact ? "text-[22px]" : "text-[26px]"}>🧹</Text>
          <Text className="mt-2 text-[10px] font-bold uppercase tracking-[1.4px] text-white/80">Clean</Text>
        </View>
        <View className={`absolute -rotate-[8deg] ${isCompact ? "right-16 top-12 px-2 py-2" : "right-20 top-14 px-3 py-3"}`}>
          <Text className={isCompact ? "text-[20px]" : "text-[24px]"}>🧺</Text>
          <Text className="mt-2 text-[10px] font-bold uppercase tracking-[1.4px] text-white/70">Home</Text>
        </View>

        <Text className="text-xs font-bold uppercase tracking-[2px] text-violet-100">{t("chores.hero.badge")}</Text>
        <Text className={`mt-2 font-black text-white ${isCompact ? "text-[18px] leading-6" : "text-[20px] leading-7"}`}>{t("chores.hero.title")}</Text>
        <Text className={`mt-2 max-w-[320px] text-violet-50 ${isCompact ? "text-[13px] leading-5" : "text-sm leading-6"}`}>{t("chores.hero.copy")}</Text>

        <View className={`mt-5 ${isCompact ? "" : "flex-row"}`}>
          <View className={`${isCompact ? "mb-2.5" : "mr-3 flex-1"} rounded-[22px] bg-white/10 px-4 py-4`}>
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-violet-100">{t("chores.hero.pending")}</Text>
            <Text className="mt-2 text-xl font-black text-white">{pendingCount}</Text>
          </View>
          <View className={`${isCompact ? "" : "flex-1"} rounded-[22px] bg-white/10 px-4 py-4`}>
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-violet-100">{t("chores.hero.done")}</Text>
            <Text className="mt-2 text-xl font-black text-white">{doneCount}</Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <View className={`mb-4 flex-row items-center ${isCompact ? "" : "justify-between"}`}>
          <View className="flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-[16px] bg-violet-100">
              <Text className="text-[18px]">✳️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black tracking-[-0.3px] text-ink">{t("chores.assignTitle")}</Text>
              <Text className="mt-0.5 text-[13px] text-slate-500">Quick add for today&apos;s household flow.</Text>
            </View>
          </View>
          {!isCompact ? (
            <View className="ml-3 rounded-full border border-violet-200 bg-white px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1.2px]" style={{ color: sectionColors.chores }}>
                Quick add
              </Text>
            </View>
          ) : null}
        </View>
        <FormInput label={t("chores.chore")} value={title} onChangeText={setTitle} placeholder="Take out trash" />
        <FormInput label={t("chores.dueDate")} value={dueDate} onChangeText={setDueDate} placeholder="2026-03-29" />
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-600">{t("chores.assignTo")}</Text>
          <Text className="text-xs font-semibold text-slate-400">{t("common.swipeMore")}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {members.map((member) => (
            <FilterChip key={member.id} active={assignedTo === member.id} label={member.name.split(" ")[0]} onPress={() => setAssignedTo(member.id)} color={member.avatarColor} />
          ))}
        </ScrollView>
        <View className="mb-4 flex-row">
          <FilterChip active={recurring === "none"} label={t("chores.oneTime")} onPress={() => setRecurring("none")} color={sectionColors.chores} />
          <FilterChip active={recurring === "weekly"} label={t("chores.weeklyReset")} onPress={() => setRecurring("weekly")} color={sectionColors.chores} />
        </View>
        <PrimaryButton label={t("chores.addChore")} onPress={addChore} color={sectionColors.chores} />
      </SurfaceCard>

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <View className={`mb-3 ${isCompact ? "" : "flex-row items-center justify-between"}`}>
          <View>
            <Text className="text-lg font-black tracking-[-0.3px] text-ink">{t("chores.filters")}</Text>
            <Text className="mt-1 text-[13px] leading-5 text-slate-500">Narrow the list by person or by progress.</Text>
          </View>
          <Text onPress={() => choresApi.resetWeekly().then(load)} className={`${isCompact ? "mt-2 self-start" : ""} text-sm font-bold`} style={{ color: sectionColors.chores }}>
            {t("chores.resetWeekly")}
          </Text>
        </View>
        <View className="rounded-[22px] bg-slate-50 px-3.5 py-3.5">
          <Text className="mb-2 text-sm font-semibold text-slate-600">{t("chores.byMember")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <FilterChip active={memberFilter === "All"} label={t("chores.allMembers")} onPress={() => setMemberFilter("All")} color={sectionColors.chores} />
            {members.map((member) => (
              <FilterChip key={member.id} active={memberFilter === member.id} label={member.name.split(" ")[0]} onPress={() => setMemberFilter(member.id)} color={member.avatarColor} />
            ))}
          </ScrollView>

          <Text className="mb-2 text-sm font-semibold text-slate-600">{t("chores.byStatus")}</Text>
          <View className="flex-row">
            <FilterChip active={statusFilter === "all"} label={t("common.all")} onPress={() => setStatusFilter("all")} color={sectionColors.chores} />
            <FilterChip active={statusFilter === "pending"} label={t("common.pending")} onPress={() => setStatusFilter("pending")} color={sectionColors.chores} />
            <FilterChip active={statusFilter === "done"} label={t("common.done")} onPress={() => setStatusFilter("done")} color={sectionColors.chores} />
          </View>
        </View>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <EmptyState title={t("chores.emptyTitle")} message={t("chores.emptyBody")} />
      ) : (
        filtered.map((item) => (
          <SurfaceCard key={item.id} className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 p-0">
            <View className="flex-row">
              <View style={{ backgroundColor: item.isCompleted ? "#C4B5FD" : "#8B5CF6" }} className="w-2" />
              <View className="flex-1 px-4 py-4">
                <View className={`${isCompact ? "" : "flex-row items-start justify-between"}`}>
                  <View className={`${isCompact ? "" : "mr-3"} flex-1`}>
                    <Text className={`text-[16px] font-black tracking-[-0.2px] ${item.isCompleted ? "text-slate-400 line-through" : "text-ink"}`}>
                      {item.title}
                    </Text>
                    <View className="mt-2 flex-row flex-wrap items-center">
                      <View className="mr-2 mb-1 rounded-full bg-violet-50 px-3 py-1">
                        <Text className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color: sectionColors.chores }}>
                          {item.assignedTo.name}
                        </Text>
                      </View>
                      <View className="mr-2 mb-1 rounded-full bg-slate-100 px-3 py-1">
                        <Text className="text-[11px] font-bold text-slate-500">{t("chores.due", { date: formatDate(item.dueDate) })}</Text>
                      </View>
                      {item.recurring === "weekly" ? (
                        <View className="mb-1 rounded-full bg-amber-50 px-3 py-1">
                          <Text className="text-[11px] font-bold text-amber-700">{t("chores.weekly")}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => choresApi.update(item.id, { isCompleted: !item.isCompleted }).then(load)}
                    className={`${isCompact ? "mt-3 self-end" : ""} h-9 w-9 items-center justify-center rounded-full ${item.isCompleted ? "bg-emerald-500" : "bg-slate-100"}`}
                  >
                    <Text className={`text-[16px] font-black ${item.isCompleted ? "text-white" : "text-slate-400"}`}>
                      {item.isCompleted ? "✓" : "○"}
                    </Text>
                  </Pressable>
                </View>

                <View className={`mt-3 border-t border-slate-100 pt-3 ${isCompact ? "" : "flex-row items-center justify-between"}`}>
                  <Text className="text-[12px] font-semibold text-slate-400">
                    {item.isCompleted ? t("common.done") : t("common.pending")}
                  </Text>
                  <Text onPress={() => choresApi.remove(item.id).then(load)} className={`${isCompact ? "mt-2 self-start" : ""} text-[12px] font-bold uppercase tracking-[1px] text-rose-500`}>
                    {t("common.delete")}
                  </Text>
                </View>
              </View>
            </View>
          </SurfaceCard>
        ))
      )}
    </ScrollView>
  );
};

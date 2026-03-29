import React, { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Calendar } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { sectionColors } from "../constants/theme";
import { calendarApi, familyApi } from "../services/api";
import { FamilyEvent, FamilyMember } from "../types";
import { isoDate } from "../utils/format";

export const CalendarScreen = () => {
  const { user } = useAuth();
  const { t, formatDate, language } = useLocale();
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const calendarWidth = Math.min(width - (isCompact ? 32 : 40), 420);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [date, setDate] = useState(isoDate());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("18:00");
  const [memberId, setMemberId] = useState("");
  const [note, setNote] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [eventsData, familyData] = await Promise.all([calendarApi.list(), familyApi.getFamily()]);
    setEvents(eventsData);
    setMembers(familyData.members);
    setMemberId((current) => {
      if (user?.id && familyData.members.some((member) => member.id === user.id)) {
        return user.id;
      }

      return current || familyData.members[0]?.id || "";
    });
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [])
  );

  const markedDates = useMemo(
    () =>
      events.reduce<Record<string, any>>((acc, event) => {
        acc[event.date] = {
          selected: event.date === date,
          selectedColor: event.colorTag,
          marked: true,
          dotColor: event.colorTag,
        };
        return acc;
      }, { [date]: { selected: true, selectedColor: "#0EA5E9" } }),
    [date, events]
  );

  const dayEvents = useMemo(() => events.filter((event) => event.date === date), [date, events]);
  const upcoming = useMemo(() => events.filter((event) => event.date >= isoDate()).slice(0, 4), [events]);
  const selectedMember = members.find((member) => member.id === memberId);
  const compactSelectedDate = useMemo(() => {
    const locales = {
      en: "en-US",
      de: "de-DE",
      fa: "fa-IR",
      ru: "ru-RU",
    } as const;

    return new Intl.DateTimeFormat(locales[language], {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  }, [date, language]);

  const addEvent = async () => {
    try {
      await calendarApi.create({
        title,
        date,
        time,
        assignedTo: memberId,
        colorTag: selectedMember?.avatarColor || sectionColors.calendar,
        note,
      });
      setTitle("");
      setNote("");
      await load();
    } catch (error: any) {
      Alert.alert(t("calendar.alert.couldNotAdd"), error?.response?.data?.error || "Try again.");
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
      contentContainerStyle={{ padding: isCompact ? 16 : 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.calendar} />}
    >
      <LinearGradient
        colors={["#0C4A6E", "#0369A1", "#0284C7"]}
        className={`mb-4 overflow-hidden ${isCompact ? "rounded-[26px] px-4 py-4" : "rounded-[32px] px-6 py-5"}`}
      >
        <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 bottom-6 h-20 w-20 rounded-full bg-sky-200/10" />

        <Text className="text-xs font-bold uppercase tracking-[2px] text-sky-100">{t("calendar.hero.badge")}</Text>
        <Text className={`mt-2 font-black text-white ${isCompact ? "text-[18px] leading-6" : "text-[20px] leading-7"}`}>{t("calendar.hero.title")}</Text>
        <Text className={`mt-2 max-w-[320px] text-sky-50 ${isCompact ? "text-[13px] leading-5" : "text-sm leading-6"}`}>{t("calendar.hero.copy")}</Text>

        <View className={`mt-4 flex-row ${isCompact ? "" : ""}`}>
          <View className={`flex-1 rounded-[20px] bg-white/10 ${isCompact ? "mr-2 px-3 py-3" : "mr-3 px-4 py-4"}`}>
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-sky-100">{t("calendar.hero.today")}</Text>
            <Text className={`font-black text-white ${isCompact ? "mt-1 text-lg" : "mt-2 text-xl"}`}>{dayEvents.length}</Text>
          </View>
          <View className={`flex-1 rounded-[20px] bg-white/10 ${isCompact ? "px-3 py-3" : "px-4 py-4"}`}>
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-sky-100">{t("calendar.hero.upcoming")}</Text>
            <Text className={`font-black text-white ${isCompact ? "mt-1 text-lg" : "mt-2 text-xl"}`}>{upcoming.length}</Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard className={`items-center overflow-hidden border border-white/70 bg-white/95 p-0 ${isCompact ? "rounded-[24px]" : "rounded-[30px]"}`}>
        <View style={{ width: calendarWidth }}>
          <Calendar
            style={{ width: calendarWidth, alignSelf: "center" }}
            markedDates={markedDates}
            onDayPress={(day) => setDate(day.dateString)}
            theme={{
              todayTextColor: sectionColors.calendar,
              arrowColor: sectionColors.calendar,
              textDayFontWeight: "600",
              textMonthFontWeight: "700",
              textDayHeaderFontWeight: "700",
              textDayFontSize: isCompact ? 13 : 16,
              textMonthFontSize: isCompact ? 18 : 20,
              textSectionTitleColor: "#64748B",
              textDisabledColor: "#CBD5E1",
              dayTextColor: "#0F172A",
              monthTextColor: "#0F172A",
              calendarBackground: "#FFFFFF",
            }}
          />
        </View>
      </SurfaceCard>

      <SurfaceCard className={`border border-white/70 bg-white/95 ${isCompact ? "rounded-[24px] p-4" : "rounded-[30px] p-5"}`}>
        <Text className={`font-black tracking-[-0.2px] text-ink ${isCompact ? "mb-2.5 text-[17px]" : "mb-3 text-lg"}`}>{t("calendar.addEvent")}</Text>
        <FormInput label={t("calendar.title")} value={title} onChangeText={setTitle} placeholder="School play" />
        <View className={isCompact ? "" : "flex-row items-start"}>
          <View className={isCompact ? "" : "mr-3 flex-1"}>
            <FormInput label={t("budget.date")} value={date} onChangeText={setDate} placeholder="2026-03-29" />
          </View>
          <View className={isCompact ? "" : "flex-1"}>
            <FormInput label={t("calendar.time")} value={time} onChangeText={setTime} placeholder="18:00" />
          </View>
        </View>
        <FormInput label={t("budget.note")} value={note} onChangeText={setNote} placeholder="Bring snacks" />
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-600">{t("calendar.assignTo")}</Text>
          <Text className="text-xs font-semibold text-slate-400">{t("common.swipeMore")}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {members.map((member) => (
            <FilterChip
              key={member.id}
              active={memberId === member.id}
              label={member.name.split(" ")[0]}
              onPress={() => setMemberId(member.id)}
              color={member.avatarColor}
            />
          ))}
        </ScrollView>
        <PrimaryButton label={t("calendar.addEventButton")} onPress={addEvent} color={sectionColors.calendar} />
      </SurfaceCard>

      <SurfaceCard className={`border border-white/70 bg-white/95 ${isCompact ? "rounded-[24px] p-4" : "rounded-[30px] p-5"}`}>
        <View className={`mb-3 ${isCompact ? "" : "flex-row items-center justify-between"}`}>
          <Text className={`${isCompact ? "text-[13px]" : "text-sm"} font-black tracking-[-0.1px] text-ink`}>{t("calendar.eventsFor", { date: compactSelectedDate })}</Text>
          <Text className={`${isCompact ? "mt-1 text-xs" : "text-sm"} font-semibold`} style={{ color: sectionColors.calendar }}>
            {t("calendar.planned", { count: dayEvents.length })}
          </Text>
        </View>
        {dayEvents.length === 0 ? (
          <EmptyState title={t("calendar.emptyDayTitle")} message={t("calendar.emptyDayBody")} />
        ) : (
          dayEvents.map((event) => (
            <View key={event.id} className={`bg-slate-50 ${isCompact ? "mb-2.5 rounded-[18px] px-3 py-3" : "mb-3 rounded-[22px] px-4 py-4"}`}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className={`${isCompact ? "text-[15px]" : "text-base"} font-bold text-ink`}>{event.title}</Text>
                  <Text className={`text-slate-500 ${isCompact ? "mt-0.5 text-[13px]" : "mt-1 text-sm"}`}>
                    {event.time} · {event.assignedTo.name}
                  </Text>
                </View>
                <View style={{ backgroundColor: event.colorTag }} className="mt-1 h-3 w-3 rounded-full" />
              </View>
              {event.note ? <Text className={`text-slate-500 ${isCompact ? "mt-0.5 text-[13px]" : "mt-1 text-sm"}`}>{event.note}</Text> : null}
              <Text onPress={() => calendarApi.remove(event.id).then(load)} className={`${isCompact ? "mt-1.5 text-xs" : "mt-2 text-sm"} font-semibold text-rose-500`}>
                {t("common.delete")}
              </Text>
            </View>
          ))
        )}
      </SurfaceCard>

      <SurfaceCard className={`border border-white/70 bg-white/95 ${isCompact ? "rounded-[24px] p-4" : "rounded-[30px] p-5"}`}>
        <Text className={`font-black tracking-[-0.2px] text-ink ${isCompact ? "mb-2.5 text-[15px]" : "mb-3 text-base"}`}>{t("calendar.upcomingTitle")}</Text>
        {upcoming.length === 0 ? (
          <EmptyState title={t("calendar.emptyUpcomingTitle")} message={t("calendar.emptyUpcomingBody")} />
        ) : (
          upcoming.map((event) => (
            <View key={event.id} className={`flex-row items-center bg-slate-50 ${isCompact ? "mb-2.5 rounded-[18px] px-3 py-3" : "mb-3 rounded-[22px] px-4 py-4"}`}>
              <View style={{ backgroundColor: event.colorTag }} className={`${isCompact ? "mr-2.5 h-9" : "mr-3 h-10"} w-2 rounded-full`} />
              <View className="flex-1">
                <Text className={`${isCompact ? "text-[15px]" : ""} font-semibold text-ink`}>{event.title}</Text>
                <Text className={`${isCompact ? "text-[13px]" : "text-sm"} text-slate-500`}>
                  {formatDate(event.date)} · {event.time}
                </Text>
                <Text className={`${isCompact ? "mt-0.5 text-[13px]" : "mt-1 text-sm"} text-slate-400`}>{event.assignedTo.name}</Text>
              </View>
            </View>
          ))
        )}
      </SurfaceCard>
    </ScrollView>
  );
};

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { CalendarList } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { useAuth } from "../context/AuthContext";
import { useAppDialog } from "../context/AppDialogContext";
import { useLocale } from "../context/LocaleContext";
import { sectionColors } from "../constants/theme";
import { calendarApi, familyApi } from "../services/api";
import { FamilyEvent, FamilyMember } from "../types";
import { isoDate } from "../utils/format";

export const CalendarScreen = () => {
  const { user } = useAuth();
  const { showAlert } = useAppDialog();
  const { t, formatDate, language } = useLocale();
  const scrollRef = useRef<ScrollView | null>(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const calendarWidth = Math.min(width - (isCompact ? 18 : 32), 392);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [date, setDate] = useState(isoDate());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("18:00");
  const [memberId, setMemberId] = useState("");
  const [note, setNote] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const normalizeDateInput = useCallback((value: string | Date) => {
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }

      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value : isoDate(parsed);
    }

    return isoDate(value);
  }, []);

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
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
      load().catch(console.error);
    }, [])
  );

  const markedDates = useMemo(
    () =>
      events.reduce<Record<string, any>>((acc, event) => {
        acc[event.date] = {
          selected: event.date === normalizeDateInput(date),
          selectedColor: event.colorTag,
          marked: true,
          dotColor: event.colorTag,
        };
        return acc;
      }, { [normalizeDateInput(date)]: { selected: true, selectedColor: "#0EA5E9" } }),
    [date, events, normalizeDateInput]
  );

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, FamilyEvent[]>>((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

  const dayEvents = useMemo(() => events.filter((event) => event.date === normalizeDateInput(date)), [date, events, normalizeDateInput]);
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
    }).format(new Date(normalizeDateInput(date)));
  }, [date, language, normalizeDateInput]);

  const addEvent = async () => {
    try {
      await calendarApi.create({
        title,
        date: normalizeDateInput(date),
        time,
        assignedTo: memberId,
        colorTag: selectedMember?.avatarColor || sectionColors.calendar,
        note,
      });
      setTitle("");
      setNote("");
      await load();
    } catch (error: any) {
      showAlert({ title: t("calendar.alert.couldNotAdd"), message: error?.response?.data?.error || "Try again.", tone: "danger" });
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.calendar} />}
    >
      <LinearGradient
        colors={["#0C4A6E", "#0369A1", "#0284C7"]}
        className={`mb-4 overflow-hidden ${isCompact ? "rounded-[26px] px-4 py-4" : "rounded-[32px] px-6 py-5"}`}
      >
        <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 bottom-6 h-20 w-20 rounded-full bg-sky-200/10" />
        <View className="absolute right-5 top-5 rotate-[7deg] px-3 py-3">
          <Text className="text-[26px]">📅</Text>
          <Text className="mt-2 text-[10px] font-bold uppercase tracking-[1.4px] text-white/80">Plans</Text>
        </View>
        <View className="absolute right-20 top-14 -rotate-[8deg] px-3 py-3">
          <Text className="text-[24px]">⏰</Text>
          <Text className="mt-2 text-[10px] font-bold uppercase tracking-[1.4px] text-white/70">Time</Text>
        </View>

        <Text className="text-xs font-bold uppercase tracking-[2px] text-sky-100">{t("calendar.hero.badge")}</Text>
        <Text className={`mt-2 font-black text-white ${isCompact ? "text-[18px] leading-6" : "text-[20px] leading-7"}`}>{t("calendar.hero.title")}</Text>
        <Text className={`mt-2 max-w-[320px] text-sky-50 ${isCompact ? "text-[13px] leading-5" : "text-sm leading-6"}`}>{t("calendar.hero.copy")}</Text>

        <View className="mt-4 flex-row">
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

      <SurfaceCard className={`overflow-hidden border border-slate-200/80 bg-white p-0 ${isCompact ? "rounded-[28px]" : "rounded-[34px]"}`}>
        <View className="border-b border-slate-200/80 bg-[#F7FBFF] px-0 py-1.5">
          <View className={`items-start ${isCompact ? "" : "flex-row justify-between"}`}>
            <View className={`rounded-[16px] bg-sky-100 ${isCompact ? "px-2.5 py-1.5" : "px-3 py-2"}`}>
              <Text className="text-[11px] font-black uppercase tracking-[1.5px] text-sky-700">
                {compactSelectedDate}
              </Text>
            </View>
            <Text className={`${isCompact ? "mt-1" : ""} text-[11px] font-semibold text-slate-400`}>
              Tap a day to see the plan
            </Text>
          </View>
        </View>
        <View style={{ width: calendarWidth }} className=" bg-white px-0 pb-0.5 pt-0">
          <CalendarList
            style={{ width: calendarWidth }}
            current={normalizeDateInput(date)}
            markedDates={markedDates}
            horizontal
            pagingEnabled
            pastScrollRange={12}
            futureScrollRange={12}
            showScrollIndicator={false}
            onDayPress={(day) => setDate(normalizeDateInput(day.dateString))}
            dayComponent={({ date: day, state }) => {
              if (!day) {
                return <View className={`${isCompact ? "h-8 w-7" : "h-9 w-8"}`} />;
              }

              const isSelected = day.dateString === normalizeDateInput(date);
              const isToday = day.dateString === isoDate();
              const dayEventsForDate = eventsByDate[day.dateString] ?? [];
              const visibleDots = dayEventsForDate.slice(0, 3);
              const isDisabled = state === "disabled";

              return (
                <Pressable
                  onPress={() => setDate(normalizeDateInput(day.dateString))}
                  className={`items-center justify-center ${isCompact ? "h-8 w-7" : "h-9 w-8"}`}
                >
                  <View
                    className={`items-center justify-center rounded-[12px] ${isCompact ? "h-6.5 w-6.5" : "h-7 w-7"}`}
                    style={{
                      backgroundColor: isSelected ? "#0284C7" : isToday ? "#E0F2FE" : "transparent",
                      borderWidth: isToday && !isSelected ? 1.5 : 0,
                      borderColor: isToday && !isSelected ? "#7DD3FC" : "transparent",
                    }}
                  >
                    <Text
                      className={`${isCompact ? "text-[11px]" : "text-[12px]"} font-bold`}
                      style={{
                        color: isSelected ? "#FFFFFF" : isDisabled ? "#CBD5E1" : "#0F172A",
                      }}
                    >
                      {day.day}
                    </Text>
                  </View>
                  <View className="mt-[2px] h-1 flex-row items-center justify-center">
                    {visibleDots.map((event) => (
                      <View
                        key={event.id}
                        style={{ backgroundColor: isSelected ? "#FFFFFF" : event.colorTag }}
                        className="mx-[1px] h-1 w-1 rounded-full"
                      />
                    ))}
                    {dayEventsForDate.length > 3 ? (
                      <View className={`ml-1 rounded-full ${isSelected ? "bg-white/70" : "bg-slate-300"} px-1 py-[1px]`}>
                        <Text className={`text-[8px] font-black ${isSelected ? "text-sky-700" : "text-slate-500"}`}>
                          +{dayEventsForDate.length - 3}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
            theme={{
              arrowColor: sectionColors.calendar,
              textDayFontWeight: "600",
              textMonthFontWeight: "700",
              textDayHeaderFontWeight: "700",
              textDayFontSize: isCompact ? 11 : 12,
              textMonthFontSize: isCompact ? 13 : 14,
              textDayHeaderFontSize: isCompact ? 10 : 11,
              textSectionTitleColor: "#64748B",
              textDisabledColor: "#CBD5E1",
              dayTextColor: "#0F172A",
              monthTextColor: "#0F172A",
              calendarBackground: "#FFFFFF",
            }}
          />
        </View>
      </SurfaceCard>

      <SurfaceCard className={`border border-slate-200/80 bg-[#0F172A] ${isCompact ? "rounded-[20px] p-3" : "rounded-[26px] p-4"}`}>
        <View className="mb-2 flex-row items-center justify-between">
          <View>
            <Text className={`font-black tracking-[-0.2px] text-white ${isCompact ? "text-[15px]" : "text-[16px]"}`}>{t("calendar.addEvent")}</Text>
            <Text className="mt-0.5 text-[11px] text-slate-300">Drop a plan into the family flow.</Text>
          </View>
          <View className="rounded-full bg-white/10 px-2.5 py-1">
            <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-sky-200">
              New plan
            </Text>
          </View>
        </View>
        <FormInput label={t("calendar.title")} value={title} onChangeText={setTitle} placeholder="School play" />
        <View className={isCompact ? "" : "flex-row items-start"}>
          <View className={isCompact ? "" : "mr-3 flex-1"}>
            <FormInput label={t("budget.date")} value={normalizeDateInput(date)} onChangeText={(value) => setDate(normalizeDateInput(value))} placeholder="2026-03-29" />
          </View>
          <View className={isCompact ? "" : "flex-1"}>
            <FormInput label={t("calendar.time")} value={time} onChangeText={setTime} placeholder="18:00" />
          </View>
        </View>
        <FormInput label={t("budget.note")} value={note} onChangeText={setNote} placeholder="Bring snacks" />
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-[12px] font-semibold text-slate-300">{t("calendar.assignTo")}</Text>
          <Text className="text-xs font-semibold text-slate-500">{t("common.swipeMore")}</Text>
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

      <SurfaceCard className={`border border-slate-200/80 bg-white ${isCompact ? "rounded-[20px] p-3" : "rounded-[26px] p-4"}`}>
        <View className={`mb-2 ${isCompact ? "" : "flex-row items-center justify-between"}`}>
          <Text className={`${isCompact ? "text-[13px]" : "text-[14px]"} font-black tracking-[-0.2px] text-ink`}>{t("calendar.eventsFor", { date: compactSelectedDate })}</Text>
          <Text className={`${isCompact ? "mt-1 text-[10px]" : "text-[12px]"} font-semibold text-slate-400`}>
            {t("calendar.planned", { count: dayEvents.length })}
          </Text>
        </View>
        {dayEvents.length === 0 ? (
          <EmptyState title={t("calendar.emptyDayTitle")} message={t("calendar.emptyDayBody")} />
        ) : (
          dayEvents.map((event) => (
            <View
              key={event.id}
              className={`border border-slate-200/70 bg-white ${isCompact ? "mb-2 rounded-[16px] pl-3 pr-3 py-2" : "mb-2 rounded-[20px] pl-3 pr-3 py-3"}`}
            >
              <View className="flex-row">
                <View style={{ backgroundColor: event.colorTag }} className="mr-3 mt-0.5 w-1 rounded-full" />
                <View className="flex-1">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className={`${isCompact ? "text-[13px]" : "text-[14px]"} font-bold text-ink`}>{event.title}</Text>
                      <Text className={`text-slate-500 ${isCompact ? "mt-0.5 text-[11px]" : "mt-1 text-[12px]"}`}>
                        {event.time} · {event.assignedTo.name}
                      </Text>
                    </View>
                    <View className="rounded-[12px] bg-slate-100 px-2 py-1">
                      <Text className="text-[9px] font-bold uppercase tracking-[0.9px] text-slate-500">
                        {formatDate(event.date)}
                      </Text>
                    </View>
                  </View>
                  {event.note ? <Text className={`text-slate-500 ${isCompact ? "mt-0.5 text-[11px]" : "mt-1 text-[12px]"}`}>{event.note}</Text> : null}
                  <Text onPress={() => calendarApi.remove(event.id).then(load)} className={`${isCompact ? "mt-1 text-[10px]" : "mt-1.5 text-[11px]"} font-semibold text-rose-500`}>
                    {t("common.delete")}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </SurfaceCard>

      <SurfaceCard className={`border border-slate-200/80 bg-[#F8FAFC] ${isCompact ? "rounded-[20px] p-3" : "rounded-[26px] p-4"}`}>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className={`font-black tracking-[-0.2px] text-ink ${isCompact ? "text-[13px]" : "text-[14px]"}`}>{t("calendar.upcomingTitle")}</Text>
          <Text className="text-[10px] font-bold uppercase tracking-[1.1px] text-slate-400">Agenda rail</Text>
        </View>
        {upcoming.length === 0 ? (
          <EmptyState title={t("calendar.emptyUpcomingTitle")} message={t("calendar.emptyUpcomingBody")} />
        ) : (
          upcoming.map((event) => (
            <View key={event.id} className={`flex-row items-center border border-white bg-white ${isCompact ? "mb-2 rounded-[14px] px-3 py-2" : "mb-2 rounded-[18px] px-3 py-3"}`}>
              <View className="mr-3 items-center">
                <View style={{ backgroundColor: event.colorTag }} className="h-2.5 w-2.5 rounded-full" />
                <View className="mt-1 h-7 w-[2px] rounded-full bg-slate-200" />
              </View>
              <View className="flex-1">
                <Text className={`${isCompact ? "text-[13px]" : "text-[14px]"} font-semibold text-ink`}>{event.title}</Text>
                <Text className={`${isCompact ? "text-[11px]" : "text-[12px]"} text-slate-500`}>
                  {formatDate(event.date)} · {event.time}
                </Text>
                <Text className={`${isCompact ? "mt-0.5 text-[11px]" : "mt-1 text-[12px]"} text-slate-400`}>{event.assignedTo.name}</Text>
              </View>
            </View>
          ))
        )}
      </SurfaceCard>
    </ScrollView>
  );
};

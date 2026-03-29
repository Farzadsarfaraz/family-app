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
import { sectionColors } from "../constants/theme";
import { calendarApi, familyApi } from "../services/api";
import { FamilyEvent, FamilyMember } from "../types";
import { isoDate, readableDate } from "../utils/format";

export const CalendarScreen = () => {
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
    setMemberId((current) => current || familyData.members[0]?.id || "");
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
      Alert.alert("Could not add event", error?.response?.data?.error || "Try again.");
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
      <LinearGradient colors={["#0C4A6E", "#0369A1", "#0284C7"]} className="mb-5 overflow-hidden rounded-[32px] px-6 py-5">
        <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 bottom-6 h-20 w-20 rounded-full bg-sky-200/10" />

        <Text className="text-xs font-bold uppercase tracking-[2px] text-sky-100">Family timeline</Text>
        <Text className="mt-2 text-[20px] font-black leading-7 text-white">Family Calendar</Text>
        <Text className="mt-2 max-w-[320px] text-sm leading-6 text-sky-50">
          See what is coming up, who it belongs to, and what the week ahead looks like at a glance.
        </Text>

        <View className="mt-5 flex-row">
          <View className="mr-3 flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-sky-100">Today</Text>
            <Text className="mt-2 text-xl font-black text-white">{dayEvents.length}</Text>
          </View>
          <View className="flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-sky-100">Upcoming</Text>
            <Text className="mt-2 text-xl font-black text-white">{upcoming.length}</Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard className="items-center overflow-hidden rounded-[30px] border border-white/70 bg-white/95 p-0">
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

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <Text className="mb-3 text-lg font-black tracking-[-0.3px] text-ink">Add event</Text>
        <FormInput label="Title" value={title} onChangeText={setTitle} placeholder="School play" />
        <View className={isCompact ? "" : "flex-row items-start"}>
          <View className={isCompact ? "" : "mr-3 flex-1"}>
            <FormInput label="Date" value={date} onChangeText={setDate} placeholder="2026-03-29" />
          </View>
          <View className={isCompact ? "" : "flex-1"}>
            <FormInput label="Time" value={time} onChangeText={setTime} placeholder="18:00" />
          </View>
        </View>
        <FormInput label="Note" value={note} onChangeText={setNote} placeholder="Bring snacks" />
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-600">Assign to</Text>
          <Text className="text-xs font-semibold text-slate-400">Swipe to see more →</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {members.map((member) => (
            <FilterChip key={member.id} active={memberId === member.id} label={member.name.split(" ")[0]} onPress={() => setMemberId(member.id)} color={member.avatarColor} />
          ))}
        </ScrollView>
        <PrimaryButton label="Add event" onPress={addEvent} color={sectionColors.calendar} />
      </SurfaceCard>

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <View className={`mb-3 ${isCompact ? "" : "flex-row items-center justify-between"}`}>
          <Text className="text-base font-black tracking-[-0.2px] text-ink">Events for {readableDate(date)}</Text>
          <Text className={`text-sm font-semibold ${isCompact ? "mt-1" : ""}`} style={{ color: sectionColors.calendar }}>
            {dayEvents.length} planned
          </Text>
        </View>
        {dayEvents.length === 0 ? (
          <EmptyState title="No events that day" message="Tap another day or add a new reminder for the family." />
        ) : (
          dayEvents.map((event) => (
            <View key={event.id} className="mb-3 rounded-[22px] bg-slate-50 px-4 py-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-ink">{event.title}</Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {event.time} · {event.assignedTo.name}
                  </Text>
                </View>
                <View style={{ backgroundColor: event.colorTag }} className="mt-1 h-3 w-3 rounded-full" />
              </View>
              {event.note ? <Text className="mt-1 text-sm text-slate-500">{event.note}</Text> : null}
              <Text onPress={() => calendarApi.remove(event.id).then(load)} className="mt-2 text-sm font-semibold text-rose-500">
                Delete
              </Text>
            </View>
          ))
        )}
      </SurfaceCard>

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <Text className="mb-3 text-base font-black tracking-[-0.2px] text-ink">Upcoming</Text>
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing upcoming" message="Your future plans will show up here as soon as you add them." />
        ) : (
          upcoming.map((event) => (
            <View key={event.id} className="mb-3 flex-row items-center rounded-[22px] bg-slate-50 px-4 py-4">
              <View style={{ backgroundColor: event.colorTag }} className="mr-3 h-10 w-2 rounded-full" />
              <View className="flex-1">
                <Text className="font-semibold text-ink">{event.title}</Text>
                <Text className="text-sm text-slate-500">
                  {readableDate(event.date)} · {event.time}
                </Text>
                <Text className="mt-1 text-sm text-slate-400">{event.assignedTo.name}</Text>
              </View>
            </View>
          ))
        )}
      </SurfaceCard>
    </ScrollView>
  );
};

import React, { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionHeader } from "../components/SectionHeader";
import { SurfaceCard } from "../components/SurfaceCard";
import { sectionColors } from "../constants/theme";
import { calendarApi, familyApi } from "../services/api";
import { FamilyEvent, FamilyMember } from "../types";
import { isoDate, readableDate } from "../utils/format";

export const CalendarScreen = () => {
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
      contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.calendar} />}
    >
      <SectionHeader title="Family Calendar" subtitle="See what is coming up and who is on it" accent={sectionColors.calendar} />

      <SurfaceCard className="overflow-hidden p-0">
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => setDate(day.dateString)}
          theme={{
            todayTextColor: sectionColors.calendar,
            arrowColor: sectionColors.calendar,
            textDayFontWeight: "600",
            textMonthFontWeight: "700",
          }}
        />
      </SurfaceCard>

      <SurfaceCard>
        <Text className="mb-3 text-lg font-bold text-ink">Add event</Text>
        <FormInput label="Title" value={title} onChangeText={setTitle} placeholder="School play" />
        <FormInput label="Date" value={date} onChangeText={setDate} placeholder="2026-03-29" />
        <FormInput label="Time" value={time} onChangeText={setTime} placeholder="18:00" />
        <FormInput label="Note" value={note} onChangeText={setNote} placeholder="Bring snacks" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {members.map((member) => (
            <FilterChip key={member.id} active={memberId === member.id} label={member.name.split(" ")[0]} onPress={() => setMemberId(member.id)} color={member.avatarColor} />
          ))}
        </ScrollView>
        <PrimaryButton label="Add event" onPress={addEvent} color={sectionColors.calendar} />
      </SurfaceCard>

      <SurfaceCard>
        <Text className="mb-3 text-lg font-bold text-ink">Events for {readableDate(date)}</Text>
        {dayEvents.length === 0 ? (
          <EmptyState title="No events that day" message="Tap another day or add a new reminder for the family." />
        ) : (
          dayEvents.map((event) => (
            <View key={event.id} className="mb-3 rounded-2xl bg-slate-50 px-4 py-3">
              <Text className="text-base font-bold text-ink">{event.title}</Text>
              <Text className="mt-1 text-sm text-slate-500">
                {event.time} · {event.assignedTo.name}
              </Text>
              {event.note ? <Text className="mt-1 text-sm text-slate-500">{event.note}</Text> : null}
              <Text onPress={() => calendarApi.remove(event.id).then(load)} className="mt-2 text-sm font-semibold text-rose-500">
                Delete
              </Text>
            </View>
          ))
        )}
      </SurfaceCard>

      <SurfaceCard>
        <Text className="mb-3 text-lg font-bold text-ink">Upcoming</Text>
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing upcoming" message="Your future plans will show up here as soon as you add them." />
        ) : (
          upcoming.map((event) => (
            <View key={event.id} className="mb-3 flex-row items-center rounded-2xl bg-slate-50 px-4 py-3">
              <View style={{ backgroundColor: event.colorTag }} className="mr-3 h-10 w-2 rounded-full" />
              <View className="flex-1">
                <Text className="font-semibold text-ink">{event.title}</Text>
                <Text className="text-sm text-slate-500">
                  {readableDate(event.date)} · {event.time}
                </Text>
              </View>
            </View>
          ))
        )}
      </SurfaceCard>
    </ScrollView>
  );
};

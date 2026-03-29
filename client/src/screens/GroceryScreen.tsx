import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionHeader } from "../components/SectionHeader";
import { SurfaceCard } from "../components/SurfaceCard";
import { groceryCategories, sectionColors } from "../constants/theme";
import { groceryApi } from "../services/api";
import { GroceryItem } from "../types";

export const GroceryScreen = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState(groceryCategories[0]);
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await groceryApi.list();
    setItems(data);
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [])
  );

  const filteredItems = useMemo(
    () => items.filter((item) => (filter === "All" ? true : item.category === filter)),
    [filter, items]
  );

  const addItem = async () => {
    if (!name.trim()) return;
    try {
      await groceryApi.create({ name: name.trim(), quantity: Number(quantity) || 1, category });
      setName("");
      setQuantity("1");
      await load();
    } catch (error: any) {
      Alert.alert("Could not add item", error?.response?.data?.error || "Try again.");
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.grocery} />}
    >
      <SectionHeader title="Grocery List" subtitle="Everything the family needs from the store" accent={sectionColors.grocery} />

      <SurfaceCard>
        <FormInput label="Item name" value={name} onChangeText={setName} placeholder="Milk" />
        <View className="flex-row">
          <View className="mr-3 flex-1">
            <FormInput label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View className="flex-[2]">
            <Text className="mb-2 text-sm font-semibold text-slate-600">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groceryCategories.map((option) => (
                <FilterChip key={option} active={category === option} label={option} onPress={() => setCategory(option)} color={sectionColors.grocery} />
              ))}
            </ScrollView>
          </View>
        </View>
        <View className="mt-4">
          <PrimaryButton label="Add grocery item" onPress={addItem} color={sectionColors.grocery} />
        </View>
      </SurfaceCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {["All", ...groceryCategories].map((option) => (
          <FilterChip key={option} active={filter === option} label={option} onPress={() => setFilter(option)} color={sectionColors.grocery} />
        ))}
      </ScrollView>

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-slate-500">{items.filter((item) => !item.isChecked).length} items left</Text>
        <Text onPress={() => groceryApi.clearCompleted().then(load)} className="text-sm font-semibold" style={{ color: sectionColors.grocery }}>
          Clear completed
        </Text>
      </View>

      {filteredItems.length === 0 ? (
        <EmptyState title="No groceries yet" message="Add your first grocery item and it will show up here for everyone." />
      ) : (
        filteredItems.map((item) => (
          <SurfaceCard key={item.id}>
            <View className="flex-row items-center">
              <Pressable
                onPress={() => groceryApi.update(item.id, { isChecked: !item.isChecked }).then(load)}
                style={{ borderColor: sectionColors.grocery, backgroundColor: item.isChecked ? sectionColors.grocery : "#FFFFFF" }}
                className="mr-4 h-7 w-7 rounded-full border-2"
              />
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${item.isChecked ? "text-slate-400 line-through" : "text-ink"}`}>{item.name}</Text>
                <Text className="text-sm text-slate-500">
                  {item.quantity} · {item.category}
                </Text>
              </View>
              <Text onPress={() => groceryApi.remove(item.id).then(load)} className="text-sm font-semibold text-rose-500">
                Delete
              </Text>
            </View>
          </SurfaceCard>
        ))
      )}
    </ScrollView>
  );
};

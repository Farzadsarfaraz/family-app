import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { groceryCategories, sectionColors } from "../constants/theme";
import { groceryApi } from "../services/api";
import { storage, storageKeys } from "../services/storage";
import { GroceryItem } from "../types";

export const GroceryScreen = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState(groceryCategories[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [savedCustomCategories, setSavedCustomCategories] = useState<string[]>([]);
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [data, storedCategories] = await Promise.all([
      groceryApi.list(),
      storage.get<string[]>(storageKeys.groceryCustomCategories),
    ]);
    setItems(data);
    setSavedCustomCategories(storedCategories ?? []);
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

  const availableCategories = useMemo(() => {
    const categories = new Set([
      ...groceryCategories,
      ...savedCustomCategories,
    ]);

    return Array.from(categories);
  }, [savedCustomCategories]);

  const customCategories = useMemo(
    () => availableCategories.filter((item) => !groceryCategories.includes(item)),
    [availableCategories]
  );

  const addItem = async () => {
    if (!name.trim()) {
      Alert.alert("Item name required", "Please enter a grocery item name.");
      return;
    }
    const trimmedCustomCategory = customCategory.trim();

    if (showCustomCategoryInput && !trimmedCustomCategory) {
      Alert.alert("Category required", "Enter a custom category or choose one of the preset ones.");
      return;
    }

    try {
      const nextCategory = trimmedCustomCategory || category;

      await groceryApi.create({
        name: name.trim(),
        quantity: Number(quantity) || 1,
        category: nextCategory,
      });

      if (trimmedCustomCategory && !savedCustomCategories.includes(trimmedCustomCategory)) {
        const nextCategories = [...savedCustomCategories, trimmedCustomCategory];
        setSavedCustomCategories(nextCategories);
        await storage.set(storageKeys.groceryCustomCategories, nextCategories);
        setCategory(trimmedCustomCategory);
      }

      setName("");
      setQuantity("1");
      setCustomCategory("");
      setShowCustomCategoryInput(false);
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

  const deleteCategory = async (categoryToDelete: string) => {
    const relatedItems = items.filter((item) => item.category === categoryToDelete);

    if (relatedItems.length > 0) {
      Alert.alert(
        "Category in use",
        "This category is still used by grocery items. Delete or change those items first."
      );
      return;
    }

    if (category === categoryToDelete) {
      setCategory(groceryCategories[0]);
    }

    if (filter === categoryToDelete) {
      setFilter("All");
    }

    const nextCategories = savedCustomCategories.filter((item) => item !== categoryToDelete);
    setSavedCustomCategories(nextCategories);
    await storage.set(storageKeys.groceryCustomCategories, nextCategories);

    Alert.alert("Category removed", `"${categoryToDelete}" has been removed from your custom grocery categories.`);
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.grocery} />}
    >
      <LinearGradient colors={["#14532D", "#166534", "#15803D"]} className="mb-5 overflow-hidden rounded-[32px] px-6 py-5">
        <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 top-12 h-16 w-16 rounded-full bg-lime-200/10" />

        <Text className="text-xs font-bold uppercase tracking-[2px] text-green-100">Shared grocery board</Text>
        <Text className="mt-2 text-[20px] font-black leading-7 text-white">Grocery List</Text>
        <Text className="mt-2 max-w-[320px] text-sm leading-6 text-green-50">
          Everything the family needs from the store, in one calm shared list.
        </Text>

        <View className="mt-5 flex-row">
          <View className="mr-3 flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-green-100">Items left</Text>
            <Text className="mt-2 text-xl font-black text-white">{items.filter((item) => !item.isChecked).length}</Text>
          </View>
          <View className="flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-green-100">Completed</Text>
            <Text className="mt-2 text-xl font-black text-white">{items.filter((item) => item.isChecked).length}</Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard className="rounded-[30px] border border-white/70 bg-white/95 p-5">
        <Text className="text-xl font-black tracking-[-0.4px] text-ink">Add item</Text>
        <Text className="mt-1 text-sm leading-6 text-slate-500">Build the next shopping trip with quick categories and easy check-offs.</Text>

        <View className="mt-4">
          <FormInput label="Item name" value={name} onChangeText={setName} placeholder="Milk" />
          <FormInput label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>

        <View className="mt-1">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-600">Category</Text>
            <Text className="text-xs font-semibold text-slate-400">Swipe to see more →</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableCategories.map((option) => (
              <View key={option} className="mr-2 flex-row items-center rounded-full bg-white">
                <FilterChip active={category === option} label={option} onPress={() => setCategory(option)} color={sectionColors.grocery} />
                {!groceryCategories.includes(option) ? (
                  <Pressable onPress={() => deleteCategory(option)} className="ml-[-4px] pr-3">
                    <Text className="text-xs font-bold text-rose-500">✕</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
              <Pressable
                onPress={() => setShowCustomCategoryInput((value) => !value)}
                style={{ borderColor: sectionColors.grocery }}
                className={`rounded-full border px-4 py-2 ${showCustomCategoryInput ? "bg-green-50" : "bg-white"}`}
              >
                <Text className="text-sm font-semibold" style={{ color: sectionColors.grocery }}>
                  {showCustomCategoryInput ? "Close custom" : "Custom +"}
                </Text>
              </Pressable>
          </ScrollView>
        </View>
        {showCustomCategoryInput ? (
          <View className="mt-4 rounded-[24px] border border-green-100 bg-green-50 px-4 py-4">
            <Text className="mb-2 text-sm font-bold uppercase tracking-[1.5px]" style={{ color: sectionColors.grocery }}>
              Add your own category
            </Text>
            <FormInput label="Custom category" value={customCategory} onChangeText={setCustomCategory} placeholder="Drinks, Cleaning, Baby..." />
            <Text className="text-sm text-slate-500">Your custom category will be saved with the item and appear in the category chips next time.</Text>
          </View>
        ) : (
          <Text className="mt-2 text-sm text-slate-500">Choose one of the common categories or tap Custom + to create your own.</Text>
        )}
        {customCategories.length > 0 ? (
          <View className="mt-4 rounded-[24px] bg-slate-50 px-4 py-4">
            <Text className="mb-2 text-sm font-bold uppercase tracking-[1.5px] text-slate-400">Your custom categories</Text>
            <Text className="text-sm leading-6 text-slate-500">
              Custom categories can be deleted with the small × icon as long as they are not being used by grocery items.
            </Text>
          </View>
        ) : null}
        <View className="mt-4">
          <PrimaryButton label="Add grocery item" onPress={addItem} color={sectionColors.grocery} />
        </View>
      </SurfaceCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {["All", ...availableCategories].map((option) => (
          <FilterChip key={option} active={filter === option} label={option} onPress={() => setFilter(option)} color={sectionColors.grocery} />
        ))}
      </ScrollView>

      <SurfaceCard className="flex-row items-center justify-between rounded-[24px] bg-white px-5 py-4">
        <View>
          <Text className="text-sm font-bold uppercase tracking-[1.5px] text-slate-400">Current view</Text>
          <Text className="mt-1 text-base font-semibold text-ink">{filter === "All" ? "All categories" : filter}</Text>
        </View>
        <Pressable onPress={() => groceryApi.clearCompleted().then(load)} className="rounded-full bg-green-50 px-4 py-2">
          <Text className="text-sm font-bold" style={{ color: sectionColors.grocery }}>
            Clear completed
          </Text>
        </Pressable>
      </SurfaceCard>

      {filteredItems.length === 0 ? (
        <EmptyState title="No groceries yet" message="Add your first grocery item and it will show up here for everyone." />
      ) : (
        filteredItems.map((item) => (
          <SurfaceCard key={item.id} className="rounded-[28px] p-0 overflow-hidden">
            <View className="flex-row items-center">
              <View style={{ backgroundColor: item.isChecked ? "#DCFCE7" : "#ECFDF5" }} className="h-full w-4" />
              <View className="flex-1 flex-row items-center px-4 py-4">
              <Pressable
                onPress={() => groceryApi.update(item.id, { isChecked: !item.isChecked }).then(load)}
                style={{ borderColor: sectionColors.grocery, backgroundColor: item.isChecked ? sectionColors.grocery : "#FFFFFF" }}
                className="mr-4 h-7 w-7 rounded-full border-2"
              />
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${item.isChecked ? "text-slate-400 line-through" : "text-ink"}`}>{item.name}</Text>
                <View className="mt-2 flex-row items-center">
                  <View className="mr-2 rounded-full bg-green-50 px-3 py-1">
                    <Text className="text-xs font-bold" style={{ color: sectionColors.grocery }}>
                      {item.category}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-slate-500">Qty {item.quantity}</Text>
                </View>
              </View>
              <Text onPress={() => groceryApi.remove(item.id).then(load)} className="text-sm font-semibold text-rose-500">
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

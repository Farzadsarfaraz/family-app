import React, { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { groceryCategories, sectionColors } from "../constants/theme";
import { useAppDialog } from "../context/AppDialogContext";
import { translateGroceryCategory, useLocale } from "../context/LocaleContext";
import { groceryApi } from "../services/api";
import { storage, storageKeys } from "../services/storage";
import { GroceryItem } from "../types";

export const GroceryScreen = () => {
  const { showAlert } = useAppDialog();
  const { t } = useLocale();
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
      showAlert({ title: t("grocery.alert.itemNameTitle"), message: t("grocery.alert.itemNameBody") });
      return;
    }
    const trimmedCustomCategory = customCategory.trim();

    if (showCustomCategoryInput && !trimmedCustomCategory) {
      showAlert({ title: t("grocery.alert.categoryTitle"), message: t("grocery.alert.categoryBody") });
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
      showAlert({ title: t("grocery.alert.couldNotAdd"), message: error?.response?.data?.error || "Try again.", tone: "danger" });
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
      showAlert({
        title: t("grocery.alert.categoryInUse"),
        message: t("grocery.alert.categoryInUseBody"),
      });
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

    showAlert({
      title: t("grocery.alert.categoryRemoved"),
      message: t("grocery.alert.categoryRemovedBody", { category: categoryToDelete }),
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={sectionColors.grocery} />}
    >
      <LinearGradient colors={["#14532D", "#166534", "#15803D"]} className="mb-5 overflow-hidden rounded-[32px] px-6 py-5">
        <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute left-6 top-12 h-16 w-16 rounded-full bg-lime-200/10" />
        <View className="absolute right-5 top-5 rotate-[7deg] px-3 py-3">
          <Text className="text-[26px]">🥦</Text>
          <Text className="mt-2 text-[10px] font-bold uppercase tracking-[1.4px] text-white/80">Fresh</Text>
        </View>
        <View className="absolute right-20 top-14 -rotate-[8deg] px-3 py-3">
          <Text className="text-[24px]">🥛</Text>
          <Text className="mt-2 text-[10px] font-bold uppercase tracking-[1.4px] text-white/70">Daily</Text>
        </View>

        <Text className="text-xs font-bold uppercase tracking-[2px] text-green-100">{t("grocery.hero.badge")}</Text>
        <Text className="mt-2 text-[20px] font-black leading-7 text-white">{t("grocery.hero.title")}</Text>
        <Text className="mt-2 max-w-[320px] text-sm leading-6 text-green-50">{t("grocery.hero.copy")}</Text>

        <View className="mt-5 flex-row">
          <View className="mr-3 flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-green-100">{t("grocery.hero.itemsLeft")}</Text>
            <Text className="mt-2 text-xl font-black text-white">{items.filter((item) => !item.isChecked).length}</Text>
          </View>
          <View className="flex-1 rounded-[22px] bg-white/10 px-4 py-4">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-green-100">{t("grocery.hero.completed")}</Text>
            <Text className="mt-2 text-xl font-black text-white">{items.filter((item) => item.isChecked).length}</Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard className="rounded-[26px] border border-white/70 bg-white/95 p-4">
        <Text className="text-lg font-black tracking-[-0.35px] text-ink">{t("grocery.addTitle")}</Text>
        <Text className="mt-1 text-[13px] leading-5 text-slate-500">{t("grocery.addCopy")}</Text>

        <View className="mt-3">
          <FormInput label={t("grocery.itemName")} value={name} onChangeText={setName} placeholder="Milk" />
          <FormInput label={t("grocery.quantity")} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>

        <View className="mt-1">
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-600">{t("grocery.category")}</Text>
            <Text className="text-xs font-semibold text-slate-400">{t("common.swipeMore")}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableCategories.map((option) => (
              <View key={option} className="mr-2 flex-row items-center rounded-full bg-white">
                <FilterChip active={category === option} label={translateGroceryCategory(option, t)} onPress={() => setCategory(option)} color={sectionColors.grocery} />
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
                className={`rounded-full border px-3.5 py-1.5 ${showCustomCategoryInput ? "bg-green-50" : "bg-white"}`}
              >
                <Text className="text-[13px] font-semibold" style={{ color: sectionColors.grocery }}>
                  {showCustomCategoryInput ? t("grocery.customClose") : t("grocery.customAdd")}
                </Text>
              </Pressable>
          </ScrollView>
        </View>
        {showCustomCategoryInput ? (
          <View className="mt-3 rounded-[20px] border border-green-100 bg-green-50 px-3.5 py-3.5">
            <Text className="mb-1.5 text-[13px] font-bold uppercase tracking-[1.4px]" style={{ color: sectionColors.grocery }}>
              {t("grocery.customTitle")}
            </Text>
            <FormInput label={t("grocery.customCategory")} value={customCategory} onChangeText={setCustomCategory} placeholder="Drinks, Cleaning, Baby..." />
            <Text className="text-[13px] text-slate-500">{t("grocery.customHint")}</Text>
          </View>
        ) : (
          <Text className="mt-2 text-[13px] text-slate-500">{t("grocery.customPrompt")}</Text>
        )}
        {customCategories.length > 0 ? (
          <View className="mt-3 rounded-[20px] bg-slate-50 px-3.5 py-3.5">
            <Text className="mb-1.5 text-[13px] font-bold uppercase tracking-[1.4px] text-slate-400">{t("grocery.customSaved")}</Text>
            <Text className="text-[13px] leading-5 text-slate-500">{t("grocery.customSavedHint")}</Text>
          </View>
        ) : null}
        <View className="mt-3.5">
          <PrimaryButton label={t("grocery.addButton")} onPress={addItem} color={sectionColors.grocery} />
        </View>
      </SurfaceCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {["All", ...availableCategories].map((option) => (
          <FilterChip key={option} active={filter === option} label={option === "All" ? t("common.all") : translateGroceryCategory(option, t)} onPress={() => setFilter(option)} color={sectionColors.grocery} />
        ))}
      </ScrollView>

      <SurfaceCard className="flex-row items-center justify-between rounded-[18px] bg-white px-3.5 py-2.5">
        <View>
          <Text className="text-xs font-bold uppercase tracking-[1.4px] text-slate-400">{t("grocery.currentView")}</Text>
          <Text className="mt-0.5 text-[13px] font-semibold text-ink">{filter === "All" ? t("grocery.allCategories") : translateGroceryCategory(filter, t)}</Text>
        </View>
        <Pressable onPress={() => groceryApi.clearCompleted().then(load)} className="rounded-full bg-green-50 px-2.5 py-1.5">
          <Text className="text-xs font-bold" style={{ color: sectionColors.grocery }}>
            {t("grocery.clearCompleted")}
          </Text>
        </Pressable>
      </SurfaceCard>

      {filteredItems.length === 0 ? (
        <EmptyState title={t("grocery.emptyTitle")} message={t("grocery.emptyBody")} />
      ) : (
        filteredItems.map((item) => (
          <SurfaceCard key={item.id} className="overflow-hidden rounded-[16px] border border-slate-200/80 bg-white/95 p-0">
            <View className="flex-row items-stretch">
              <View style={{ backgroundColor: item.isChecked ? "#22C55E" : "#BBF7D0" }} className="w-1" />
              <View className="flex-1 flex-row items-center px-2.5 py-1.5">
                <Pressable
                  onPress={() => groceryApi.update(item.id, { isChecked: !item.isChecked }).then(load)}
                  style={{ borderColor: item.isChecked ? "#16A34A" : "#86EFAC", backgroundColor: item.isChecked ? "#16A34A" : "#F8FAFC" }}
                  className="mr-2 h-4.5 w-4.5 items-center justify-center rounded-full border-2"
                >
                  {item.isChecked ? <Text className="text-[10px] font-black text-white">✓</Text> : null}
                </Pressable>
                <View className="flex-1 pr-2.5">
                  <View className="flex-row items-start justify-between">
                    <Text className={`flex-1 pr-2 text-[15px] font-bold tracking-[-0.12px] ${item.isChecked ? "text-slate-400 line-through" : "text-ink"}`}>
                      {item.name}
                    </Text>
                    <Text className="text-[9px] font-bold uppercase tracking-[1px] text-slate-400">
                      {t("grocery.qty", { count: item.quantity })}
                    </Text>
                  </View>
                  <View className="mt-0.5 self-start rounded-full border border-green-100 bg-green-50 px-2 py-0.5">
                    <Text className="text-[9px] font-black uppercase tracking-[0.8px]" style={{ color: sectionColors.grocery }}>
                      {translateGroceryCategory(item.category, t)}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => groceryApi.remove(item.id).then(load)} className="rounded-full bg-rose-50 px-2 py-1">
                  <Text className="text-[9px] font-black uppercase tracking-[0.8px] text-rose-500">
                    {t("common.delete")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </SurfaceCard>
        ))
      )}
    </ScrollView>
  );
};

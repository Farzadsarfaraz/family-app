import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { useAuth } from "../context/AuthContext";
import { sectionColors } from "../constants/theme";

type SectionKey = "profile" | "password" | "delete" | null;

export const AccountScreen = () => {
  const { user, updateMe, changePassword, deleteMe, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [profileSectionY, setProfileSectionY] = useState(0);
  const [passwordSectionY, setPasswordSectionY] = useState(0);
  const [deleteSectionY, setDeleteSectionY] = useState(0);

  useEffect(() => {
    setProfileName(user?.name ?? "");
  }, [user?.name]);

  const openSection = (section: Exclude<SectionKey, null>) => {
    setActiveSection(section);

    requestAnimationFrame(() => {
      const positions = {
        profile: profileSectionY,
        password: passwordSectionY,
        delete: deleteSectionY,
      };

      scrollRef.current?.scrollTo({
        y: Math.max(0, positions[section] - 16),
        animated: true,
      });
    });
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const saveName = async () => {
    const trimmedName = profileName.trim();

    if (trimmedName.length < 2) {
      showAlert("Name required", "Please enter a name with at least 2 characters.");
      return;
    }

    try {
      setSavingName(true);
      await updateMe({ name: trimmedName });
      showAlert("Name updated", "Your name has been updated.");
    } catch (error: any) {
      showAlert("Could not update name", error?.response?.data?.error || "Try again.");
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword) {
      showAlert("Current password required", "Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("New password too short", "Your new password should be at least 6 characters long.");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      showAlert("Password updated", "Your password has been changed.");
    } catch (error: any) {
      showAlert("Could not change password", error?.response?.data?.error || "Try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  const removeAccount = async () => {
    if (!deletePassword) {
      showAlert("Password required", "Enter your password to delete your account.");
      return;
    }

    const confirmMessage =
      "Deleting your account will remove your personal budget entries and tasks. If you are the last family member, the whole family space will be deleted too.";

    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      setDeletingAccount(true);
      await deleteMe({ password: deletePassword });
    } catch (error: any) {
      showAlert("Could not delete account", error?.response?.data?.error || "Try again.");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <ScrollView ref={scrollRef} className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <LinearGradient colors={["#111827", "#1F2937", "#334155"]} className="mb-3 overflow-hidden rounded-[20px] px-4 py-3">
        <View className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/10" />
        <Text className="text-[10px] font-bold uppercase tracking-[1.6px] text-slate-300">More</Text>
        <Text className="mt-1 text-[15px] font-black leading-5 text-white">Account & access</Text>
      </LinearGradient>

      <SurfaceCard className="rounded-[20px] border border-white/70 bg-white/95 p-3.5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-black tracking-[-0.4px] text-ink">Menu</Text>
            <Text className="mt-0.5 text-xs leading-5 text-slate-500">
              Choose what you want to manage.
            </Text>
          </View>
          <View className="rounded-full bg-slate-100 px-3 py-2">
            <Text className="text-xs font-bold uppercase tracking-[1.4px] text-slate-500">
              {activeSection ? "Open" : "Ready"}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <Pressable
            onPress={() => openSection("profile")}
            className={`mb-2 rounded-[18px] border px-3.5 py-2.5 ${activeSection === "profile" ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-slate-50"}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`mr-3 rounded-xl px-2.5 py-1.5 ${activeSection === "profile" ? "bg-indigo-100" : "bg-white"}`}>
                  <Text className="text-sm">👤</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-ink">Change user info</Text>
                  <Text className="mt-0.5 text-xs text-slate-500">Update your displayed name.</Text>
                </View>
              </View>
              <Text className="text-base text-slate-400">›</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => openSection("password")}
            className={`mb-2 rounded-[18px] border px-3.5 py-2.5 ${activeSection === "password" ? "border-sky-200 bg-sky-50" : "border-slate-100 bg-slate-50"}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`mr-3 rounded-xl px-2.5 py-1.5 ${activeSection === "password" ? "bg-sky-100" : "bg-white"}`}>
                  <Text className="text-sm">🔐</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-ink">Change password</Text>
                  <Text className="mt-0.5 text-xs text-slate-500">Set a new password for your account.</Text>
                </View>
              </View>
              <Text className="text-base text-slate-400">›</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => openSection("delete")}
            className={`mb-2 rounded-[18px] border px-3.5 py-2.5 ${activeSection === "delete" ? "border-rose-200 bg-rose-50" : "border-rose-100 bg-rose-50/70"}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`mr-3 rounded-xl px-2.5 py-1.5 ${activeSection === "delete" ? "bg-rose-100" : "bg-white/80"}`}>
                  <Text className="text-sm">🗑️</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-rose-700">Delete account</Text>
                  <Text className="mt-0.5 text-xs text-rose-600">Permanently remove this account.</Text>
                </View>
              </View>
              <Text className="text-base text-rose-300">›</Text>
            </View>
          </Pressable>

          <Pressable onPress={signOut} className="rounded-[18px] bg-slate-900 px-3.5 py-2.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 rounded-xl bg-white/10 px-2.5 py-1.5">
                  <Text className="text-sm">↩️</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-white">Logout</Text>
                  <Text className="mt-0.5 text-xs text-slate-300">Sign out of GoFamly.</Text>
                </View>
              </View>
              <Text className="text-base text-slate-400">›</Text>
            </View>
          </Pressable>
        </View>
      </SurfaceCard>

      {activeSection === "profile" ? (
        <View onLayout={(event: any) => setProfileSectionY(event.nativeEvent.layout.y)}>
          <SurfaceCard className="mt-3 rounded-[20px] border border-indigo-100 bg-white/95 p-3.5">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 rounded-xl bg-indigo-100 px-2.5 py-1.5">
                <Text className="text-sm">👤</Text>
              </View>
              <Text className="text-sm font-black tracking-[-0.3px] text-ink">Change user info</Text>
            </View>
            <View className="mt-3">
              <FormInput label="Your name" value={profileName} onChangeText={setProfileName} placeholder="Your name" />
              <PrimaryButton label={savingName ? "Saving..." : "Save name"} onPress={saveName} color={sectionColors.home} disabled={savingName} />
            </View>
          </SurfaceCard>
        </View>
      ) : null}

      {activeSection === "password" ? (
        <View onLayout={(event: any) => setPasswordSectionY(event.nativeEvent.layout.y)}>
          <SurfaceCard className="mt-3 rounded-[20px] border border-sky-100 bg-white/95 p-3.5">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 rounded-xl bg-sky-100 px-2.5 py-1.5">
                <Text className="text-sm">🔐</Text>
              </View>
              <Text className="text-sm font-black tracking-[-0.3px] text-ink">Change password</Text>
            </View>
            <View className="mt-3">
              <FormInput label="Current password" value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" secureTextEntry />
              <FormInput label="New password" value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry />
              <PrimaryButton
                label={savingPassword ? "Updating..." : "Update password"}
                onPress={savePassword}
                color={sectionColors.home}
                disabled={savingPassword}
              />
            </View>
          </SurfaceCard>
        </View>
      ) : null}

      {activeSection === "delete" ? (
        <View onLayout={(event: any) => setDeleteSectionY(event.nativeEvent.layout.y)}>
          <SurfaceCard className="mt-3 rounded-[20px] border border-rose-100 bg-rose-50 p-3.5">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 rounded-xl bg-rose-100 px-2.5 py-1.5">
                <Text className="text-sm">🗑️</Text>
              </View>
              <Text className="text-sm font-black tracking-[-0.3px] text-rose-700">Delete account</Text>
            </View>
            <Text className="mt-1 text-sm leading-6 text-rose-600">
              This removes your account. If you are the last family member, the whole family space will be deleted too.
            </Text>
            <View className="mt-3">
              <FormInput label="Password confirmation" value={deletePassword} onChangeText={setDeletePassword} placeholder="••••••••" secureTextEntry />
              <PrimaryButton
                label={deletingAccount ? "Deleting..." : "Delete my account"}
                onPress={removeAccount}
                color="#DC2626"
                disabled={deletingAccount}
              />
            </View>
          </SurfaceCard>
        </View>
      ) : null}
    </ScrollView>
  );
};

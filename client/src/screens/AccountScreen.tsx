import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";
import { useAuth } from "../context/AuthContext";
import { useAppDialog } from "../context/AppDialogContext";
import { familyApi } from "../services/api";
import { sectionColors } from "../constants/theme";
import { FamilyMember } from "../types";

type SectionKey = "profile" | "password" | "admin" | "delete" | null;

export const AccountScreen = () => {
  const { user, family, updateMe, changePassword, deleteMe, signOut } = useAuth();
  const { showAlert, showConfirm } = useAppDialog();
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [familyDeletePassword, setFamilyDeletePassword] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [promotingMemberId, setPromotingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [deletingFamily, setDeletingFamily] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [profileSectionY, setProfileSectionY] = useState(0);
  const [passwordSectionY, setPasswordSectionY] = useState(0);
  const [adminSectionY, setAdminSectionY] = useState(0);
  const [deleteSectionY, setDeleteSectionY] = useState(0);

  useEffect(() => {
    setProfileName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    if (user?.role !== "admin") {
      setMembers([]);
      return;
    }

    familyApi
      .getFamily()
      .then((response) => setMembers(response.members))
      .catch(console.error);
  }, [user?.role]);

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, [])
  );

  const openSection = (section: Exclude<SectionKey, null>) => {
    setActiveSection(section);

    requestAnimationFrame(() => {
      const positions = {
        profile: profileSectionY,
        password: passwordSectionY,
        admin: adminSectionY,
        delete: deleteSectionY,
      };

      scrollRef.current?.scrollTo({
        y: Math.max(0, positions[section] - 16),
        animated: true,
      });
    });
  };

  const saveName = async () => {
    const trimmedName = profileName.trim();

    if (trimmedName.length < 2) {
      showAlert({ title: "Name required", message: "Please enter a name with at least 2 characters." });
      return;
    }

    try {
      setSavingName(true);
      await updateMe({ name: trimmedName });
      showAlert({ title: "Name updated", message: "Your name has been updated." });
    } catch (error: any) {
      showAlert({ title: "Could not update name", message: error?.response?.data?.error || "Try again.", tone: "danger" });
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword) {
      showAlert({ title: "Current password required", message: "Please enter your current password." });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({ title: "New password too short", message: "Your new password should be at least 6 characters long." });
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      showAlert({ title: "Password updated", message: "Your password has been changed." });
    } catch (error: any) {
      showAlert({ title: "Could not change password", message: error?.response?.data?.error || "Try again.", tone: "danger" });
    } finally {
      setSavingPassword(false);
    }
  };

  const removeAccount = async () => {
    if (!deletePassword) {
      showAlert({ title: "Password required", message: "Enter your password to delete your account." });
      return;
    }

    const confirmMessage =
      user?.role === "admin" && adminCount <= 1
        ? "Deleting your account will remove your personal budget entries and tasks. Since you are the last admin, the whole family space will be deleted too."
        : "Deleting your account will remove your personal budget entries and tasks.";

    const confirmed = await showConfirm({
      title: "Delete account?",
      message: confirmMessage,
      confirmLabel: "Delete account",
      cancelLabel: "Keep account",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAccount(true);
      await deleteMe({ password: deletePassword });
    } catch (error: any) {
      showAlert({ title: "Could not delete account", message: error?.response?.data?.error || "Try again.", tone: "danger" });
    } finally {
      setDeletingAccount(false);
    }
  };

  const refreshMembers = async () => {
    const response = await familyApi.getFamily();
    setMembers(response.members);
  };

  const removeFamilyMember = async (member: FamilyMember) => {
    const confirmMessage = `Remove ${member.name} from the family? Their shared family data will be removed too.`;

    const confirmed = await showConfirm({
      title: "Remove member?",
      message: confirmMessage,
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(member.id);
      await familyApi.removeMember(member.id);
      await refreshMembers();
      showAlert({ title: "Member removed", message: `${member.name} has been removed from the family.` });
    } catch (error: any) {
      showAlert({ title: "Could not remove member", message: error?.response?.data?.error || "Try again.", tone: "danger" });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const promoteMember = async (member: FamilyMember) => {
    const confirmMessage = `Make ${member.name} an admin? They will be able to manage members and delete the whole family.`;

    const confirmed = await showConfirm({
      title: "Make admin?",
      message: confirmMessage,
      confirmLabel: "Make admin",
      cancelLabel: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    try {
      setPromotingMemberId(member.id);
      await familyApi.promoteMember(member.id);
      await refreshMembers();
      showAlert({ title: "Admin updated", message: `${member.name} is now an admin.` });
    } catch (error: any) {
      showAlert({ title: "Could not make admin", message: error?.response?.data?.error || "Try again.", tone: "danger" });
    } finally {
      setPromotingMemberId(null);
    }
  };

  const removeWholeFamily = async () => {
    if (!familyDeletePassword) {
      showAlert({ title: "Password required", message: "Enter your password to delete the whole family." });
      return;
    }

    const confirmMessage =
      "Deleting the whole family will remove every family member account and all shared data permanently.";

    const confirmed = await showConfirm({
      title: "Delete whole family?",
      message: confirmMessage,
      confirmLabel: "Delete family",
      cancelLabel: "Cancel",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingFamily(true);
      await familyApi.deleteFamily({ password: familyDeletePassword });
      await signOut();
    } catch (error: any) {
      showAlert({ title: "Could not delete family", message: error?.response?.data?.error || "Try again.", tone: "danger" });
    } finally {
      setDeletingFamily(false);
    }
  };

  const adminCount = members.filter((member) => member.role === "admin").length;
  const canDeleteWholeFamily = adminCount <= 1;

  return (
    <ScrollView ref={scrollRef} className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <LinearGradient colors={["#0F172A", "#1E293B", "#334155"]} className="mb-5 overflow-hidden rounded-[32px] px-5 py-8">
        <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <View className="absolute right-12 top-5 h-11 w-11 rounded-full bg-white/10" />
        <Text className="text-[11px] font-bold uppercase tracking-[1.8px] text-slate-300">Account</Text>
        <View className="mt-3.5 flex-row items-center">
          <View
            className="mr-3.5 h-13 w-13 items-center justify-center rounded-[20px] border border-white/15 shadow-sm"
            style={{ backgroundColor: user?.avatarColor ?? sectionColors.home }}
          />
          <View className="flex-1">
            <Text className="text-[20px] font-black tracking-[-0.3px] text-white">{user?.name ?? "GoFamly user"}</Text>
            <Text className="mt-1 text-[14px] text-slate-300">{family?.name ?? "Family space"}</Text>
          </View>
        </View>
        <View className="mt-4 self-start rounded-full bg-white/10 px-3 py-1.5">
          <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-slate-200">Personal settings</Text>
        </View>
        <Text className="mt-3 max-w-[320px] text-[14px] leading-6 text-slate-300">
          Change your profile, password, and family settings from one place.
        </Text>
      </LinearGradient>

      <SurfaceCard className="rounded-[24px] border border-white/70 bg-white/95 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-slate-400">Quick actions</Text>
            <Text className="mt-1 text-[18px] font-black tracking-[-0.4px] text-ink">Manage your space</Text>
            <Text className="mt-1 text-[13px] leading-5 text-slate-500">
              Open exactly what you need.
            </Text>
          </View>
          <Pressable onPress={signOut} className="rounded-[16px] bg-slate-900 px-3.5 py-2.5">
            <Text className="text-[12px] font-bold uppercase tracking-[1px] text-white">Logout</Text>
          </Pressable>
        </View>

        <View className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-3">
          <Text className="text-[11px] font-bold uppercase tracking-[1.3px] text-slate-400">Current section</Text>
          <Text className="mt-1 text-[15px] font-black text-ink">
            {activeSection === "profile"
              ? "User info"
              : activeSection === "password"
                ? "Password"
                : activeSection === "admin"
                  ? "Admin tools"
            : activeSection === "delete"
                    ? "Delete account"
                    : "Ready"}
          </Text>
        </View>

        <View className="mt-4">
          <Pressable
            onPress={() => openSection("profile")}
            className={`mb-2.5 flex-row items-center justify-between rounded-[20px] border px-3.5 py-3.5 ${activeSection === "profile" ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}
          >
            <View className="flex-row items-center">
              <View className={`mr-3 h-11 w-11 items-center justify-center rounded-[16px] ${activeSection === "profile" ? "bg-indigo-100" : "bg-slate-50"}`}>
                <Text className="text-[18px]">👤</Text>
              </View>
              <View>
                <Text className="text-[14px] font-semibold text-ink">User info</Text>
                <Text className="mt-0.5 text-[12px] text-slate-500">Name and profile</Text>
              </View>
            </View>
            <Text className="text-base text-slate-300">›</Text>
          </Pressable>
          <Pressable
            onPress={() => openSection("password")}
            className={`mb-2.5 flex-row items-center justify-between rounded-[20px] border px-3.5 py-3.5 ${activeSection === "password" ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white"}`}
          >
            <View className="flex-row items-center">
              <View className={`mr-3 h-11 w-11 items-center justify-center rounded-[16px] ${activeSection === "password" ? "bg-sky-100" : "bg-slate-50"}`}>
                <Text className="text-[18px]">🔐</Text>
              </View>
              <View>
                <Text className="text-[14px] font-semibold text-ink">Password</Text>
                <Text className="mt-0.5 text-[12px] text-slate-500">Keep it secure</Text>
              </View>
            </View>
            <Text className="text-base text-slate-300">›</Text>
          </Pressable>
          {user?.role === "admin" ? (
            <Pressable
              onPress={() => openSection("admin")}
              className={`mb-2.5 flex-row items-center justify-between rounded-[20px] border px-3.5 py-3.5 ${activeSection === "admin" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
            >
              <View className="flex-row items-center">
                <View className={`mr-3 h-11 w-11 items-center justify-center rounded-[16px] ${activeSection === "admin" ? "bg-amber-100" : "bg-slate-50"}`}>
                  <Text className="text-[18px]">🛠️</Text>
                </View>
                <View>
                  <Text className="text-[14px] font-semibold text-ink">Admin tools</Text>
                  <Text className="mt-0.5 text-[12px] text-slate-500">Family controls</Text>
                </View>
              </View>
              <Text className="text-base text-slate-300">›</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => openSection("delete")}
            className={`flex-row items-center justify-between rounded-[20px] border px-3.5 py-3.5 ${activeSection === "delete" ? "border-rose-200 bg-rose-50" : "border-rose-100 bg-rose-50/70"}`}
          >
            <View className="flex-row items-center">
              <View className={`mr-3 h-11 w-11 items-center justify-center rounded-[16px] ${activeSection === "delete" ? "bg-rose-100" : "bg-white/80"}`}>
                <Text className="text-[18px]">🗑️</Text>
              </View>
              <View>
                <Text className="text-[14px] font-semibold text-rose-700">Delete account</Text>
                <Text className="mt-0.5 text-[12px] text-rose-500">Danger zone</Text>
              </View>
            </View>
            <Text className="text-base text-rose-300">›</Text>
          </Pressable>
        </View>
      </SurfaceCard>

      {activeSection === "profile" ? (
        <View onLayout={(event: any) => setProfileSectionY(event.nativeEvent.layout.y)}>
          <SurfaceCard className="mt-4 rounded-[24px] border border-indigo-100 bg-white/95 p-4">
            <View className="mb-3.5 flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-[16px] bg-indigo-100">
                <Text className="text-[17px]">👤</Text>
              </View>
              <View>
                <Text className="text-[17px] font-black tracking-[-0.3px] text-ink">Change user info</Text>
                <Text className="mt-0.5 text-[13px] text-slate-500">Edit the name your family sees.</Text>
              </View>
            </View>
            <View className="mt-1">
              <FormInput label="Your name" value={profileName} onChangeText={setProfileName} placeholder="Your name" />
              <PrimaryButton label={savingName ? "Saving..." : "Save name"} onPress={saveName} color={sectionColors.home} disabled={savingName} />
            </View>
          </SurfaceCard>
        </View>
      ) : null}

      {activeSection === "password" ? (
        <View onLayout={(event: any) => setPasswordSectionY(event.nativeEvent.layout.y)}>
          <SurfaceCard className="mt-4 rounded-[24px] border border-sky-100 bg-white/95 p-4">
            <View className="mb-3.5 flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-[16px] bg-sky-100">
                <Text className="text-[17px]">🔐</Text>
              </View>
              <View>
                <Text className="text-[17px] font-black tracking-[-0.3px] text-ink">Change password</Text>
                <Text className="mt-0.5 text-[13px] text-slate-500">Keep your account secure with a fresh password.</Text>
              </View>
            </View>
            <View className="mt-1">
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

      {activeSection === "admin" && user?.role === "admin" ? (
        <View onLayout={(event: any) => setAdminSectionY(event.nativeEvent.layout.y)}>
          <SurfaceCard className="mt-4 rounded-[24px] border border-amber-100 bg-white/95 p-4">
            <View className="mb-3.5 flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-[16px] bg-amber-100">
                <Text className="text-[17px]">🛠️</Text>
              </View>
              <View>
                <Text className="text-[17px] font-black tracking-[-0.3px] text-ink">Admin tools</Text>
                <Text className="mt-0.5 text-[13px] text-slate-500">Manage invites, roles, and family-wide actions.</Text>
              </View>
            </View>

            <View className="rounded-[20px] border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4">
              <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-amber-700">Invite code</Text>
              <View className="mt-2 flex-row items-center justify-between rounded-[16px] bg-white/80 px-3.5 py-3">
                <Text className="text-[16px] font-black tracking-[2px] text-ink">{family?.inviteCode ?? "..."}</Text>
                <View className="rounded-full bg-amber-100 px-2.5 py-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.1px] text-amber-700">Share</Text>
                </View>
              </View>
            </View>

            <View className="mt-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-slate-400">Family members</Text>
                <Text className="text-[12px] font-semibold text-slate-400">{members.length} total</Text>
              </View>
              {members.map((member) => (
                <View key={member.id} className="mt-2 flex-row items-center justify-between rounded-[18px] border border-slate-100 bg-slate-50/80 px-3.5 py-3.5">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center">
                      <Text className="text-[15px] font-bold text-ink">{member.name}</Text>
                      <View className={`ml-2 rounded-full px-2 py-0.5 ${member.role === "admin" ? "bg-amber-100" : "bg-slate-200"}`}>
                        <Text className={`text-[10px] font-bold uppercase tracking-[1px] ${member.role === "admin" ? "text-amber-700" : "text-slate-500"}`}>
                          {member.role === "admin" ? "Admin" : "Member"}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-[12px] text-slate-500">{member.id === user.id ? "This is your account." : "Family access is active."}</Text>
                  </View>
                  {member.id !== user.id ? (
                    <View className="items-end">
                      {member.role !== "admin" ? (
                        <Pressable
                          onPress={() => promoteMember(member)}
                          disabled={promotingMemberId === member.id}
                          className="mb-1.5 rounded-full bg-amber-50 px-3 py-1.5"
                        >
                          <Text className="text-xs font-bold text-amber-700">
                            {promotingMemberId === member.id ? "Saving..." : "Make admin"}
                          </Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        onPress={() => removeFamilyMember(member)}
                        disabled={removingMemberId === member.id}
                        className="rounded-full bg-rose-50 px-3 py-1.5"
                      >
                        <Text className="text-xs font-bold text-rose-500">
                          {removingMemberId === member.id ? "Removing..." : "Remove"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="rounded-full bg-indigo-100 px-3 py-1.5">
                      <Text className="text-xs font-bold text-indigo-600">You</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View className="mt-4 rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-4">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-[14px] bg-rose-100">
                  <Text className="text-[16px]">⚠️</Text>
                </View>
                <View>
                  <Text className="text-[16px] font-black text-rose-700">Delete whole family</Text>
                  <Text className="mt-0.5 text-[13px] text-rose-600">This is the strongest admin action.</Text>
                </View>
              </View>
              {canDeleteWholeFamily ? (
                <>
                  <Text className="mt-3 text-sm leading-6 text-rose-600">
                    This removes all family member accounts and all shared data permanently.
                  </Text>
                  <View className="mt-3">
                    <FormInput
                      label="Password confirmation"
                      value={familyDeletePassword}
                      onChangeText={setFamilyDeletePassword}
                      placeholder="••••••••"
                      secureTextEntry
                    />
                    <PrimaryButton
                      label={deletingFamily ? "Deleting family..." : "Delete whole family"}
                      onPress={removeWholeFamily}
                      color="#DC2626"
                      disabled={deletingFamily}
                    />
                  </View>
                </>
              ) : (
                <Text className="mt-3 text-xs font-semibold leading-5 text-rose-500">
                  Delete whole family is locked because there is more than one admin. Only the last remaining admin can do this.
                </Text>
              )}
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
              {user?.role === "admin" && adminCount <= 1
                ? "This removes your account. Since you are the last admin, the whole family space will be deleted too."
                : "This removes only your account and your personal data."}
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

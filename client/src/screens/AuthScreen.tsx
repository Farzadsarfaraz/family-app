import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { avatarPalette } from "../constants/theme";
import { EasyFamilyLogo } from "../components/branding/EasyFamilyLogo";
import { FormInput } from "../components/FormInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";

export const AuthScreen = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [joinExisting, setJoinExisting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [avatarColor, setAvatarColor] = useState(avatarPalette[0]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    try {
      setSaving(true);
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp({
          name: name.trim(),
          email: email.trim(),
          password,
          avatarColor,
          familyName: joinExisting ? undefined : familyName.trim(),
          inviteCode: joinExisting ? inviteCode.trim().toUpperCase() : undefined,
        });
      }
    } catch (error: any) {
      Alert.alert("Could not continue", error?.response?.data?.error || "Please check your details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={["#EEF2FF", "#F8FAFC", "#F0FDF4"]} className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 80 }}>
        <EasyFamilyLogo />
        <Text className="mt-3 text-base leading-6 text-slate-600">
          Keep groceries, money, events, and chores in one calm shared space the whole family can actually use.
        </Text>

        <SurfaceCard className="mt-8">
          <View className="mb-4 flex-row rounded-2xl bg-slate-100 p-1">
            {(["register", "login"] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                className={`flex-1 rounded-2xl py-3 ${mode === value ? "bg-white" : ""}`}
              >
                <Text className="text-center text-base font-semibold text-ink">{value === "register" ? "Create account" : "Log in"}</Text>
              </Pressable>
            ))}
          </View>

          {mode === "register" && (
            <>
              <FormInput label="Name" value={name} onChangeText={setName} placeholder="Maya" />
              <View className="mb-3">
                <Text className="mb-2 text-sm font-semibold text-slate-600">Avatar color</Text>
                <View className="flex-row flex-wrap">
                  {avatarPalette.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setAvatarColor(color)}
                      style={{ backgroundColor: color, opacity: avatarColor === color ? 1 : 0.45 }}
                      className="mb-2 mr-3 h-10 w-10 rounded-full border-2 border-white"
                    />
                  ))}
                </View>
              </View>
              <View className="mb-4 flex-row rounded-2xl bg-slate-100 p-1">
                <Pressable onPress={() => setJoinExisting(false)} className={`flex-1 rounded-2xl py-3 ${!joinExisting ? "bg-white" : ""}`}>
                  <Text className="text-center font-semibold text-ink">Create family</Text>
                </Pressable>
                <Pressable onPress={() => setJoinExisting(true)} className={`flex-1 rounded-2xl py-3 ${joinExisting ? "bg-white" : ""}`}>
                  <Text className="text-center font-semibold text-ink">Join family</Text>
                </Pressable>
              </View>
            </>
          )}

          <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="family@example.com" keyboardType="email-address" />
          <FormInput label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          {mode === "register" &&
            (joinExisting ? (
              <FormInput label="Invite code" value={inviteCode} onChangeText={setInviteCode} placeholder="AB12CD" />
            ) : (
              <FormInput label="Family name" value={familyName} onChangeText={setFamilyName} placeholder="The Lopez Family" />
            ))}

          <PrimaryButton label={saving ? "Please wait..." : mode === "login" ? "Log in" : "Get started"} onPress={submit} color="#4F46E5" disabled={saving} />
        </SurfaceCard>
      </ScrollView>
    </LinearGradient>
  );
};

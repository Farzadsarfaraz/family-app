import React, { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
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

  const isEmailValid = (value: string) => /\S+@\S+\.\S+/.test(value.trim());
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const submit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedFamilyName = familyName.trim();
    const trimmedInviteCode = inviteCode.trim().toUpperCase();

    if (!trimmedEmail) {
      showAlert("Email required", "Please enter your email address.");
      return;
    }

    if (!password) {
      showAlert("Password required", "Please enter your password.");
      return;
    }

    if (!isEmailValid(trimmedEmail)) {
      showAlert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showAlert("Password too short", "Your password should be at least 6 characters long.");
      return;
    }

    if (mode === "register") {
      if (!trimmedName) {
        showAlert("Missing name", "Please enter your name before continuing.");
        return;
      }

      if (joinExisting && trimmedInviteCode.length < 6) {
        showAlert("Invite code needed", "Enter a valid family invite code to join an existing family.");
        return;
      }

      if (!joinExisting && trimmedFamilyName.length < 2) {
        showAlert("Family name needed", "Choose a family name with at least 2 characters.");
        return;
      }
    }

    try {
      setSaving(true);
      if (mode === "login") {
        await signIn(trimmedEmail, password);
      } else {
        await signUp({
          name: trimmedName,
          email: trimmedEmail,
          password,
          avatarColor,
          familyName: joinExisting ? undefined : trimmedFamilyName,
          inviteCode: joinExisting ? trimmedInviteCode : undefined,
        });
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || "Please check your details and try again.";

      if (message === "Incorrect email or password.") {
        showAlert("Login failed", "The email or password is not correct.");
      } else if (message === "An account with that email already exists.") {
        showAlert("Account exists", "An account with this email already exists. Try logging in instead.");
      } else if (message === "Invite code not found.") {
        showAlert("Invite code not found", "That invite code doesn't match any family. Please check it and try again.");
      } else {
        showAlert("Could not continue", message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={["#E9EEFF", "#F8FAFC", "#F5FBF6"]} className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 56 }}>
        <View className="relative overflow-hidden rounded-[32px] bg-[#0F172A] px-6 py-7">
          <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#1E293B]" />
          <View className="absolute right-6 top-14 h-16 w-16 rounded-full bg-[#F97316]/20" />
          <View className="absolute -left-4 bottom-8 h-24 w-24 rounded-full bg-[#60A5FA]/15" />

          <View className="rounded-full self-start border border-white/10 bg-white/10 px-3 py-2">
            <Text className="text-xs font-bold uppercase tracking-[2px] text-[#BFDBFE]">Family command center</Text>
          </View>

          <View className="mt-5">
            <EasyFamilyLogo />
          </View>

          <Text className="mt-4 text-[30px] font-black leading-9 text-white">
            Home life,{"\n"}but finally organized.
          </Text>
          <Text className="mt-3 max-w-[320px] text-base leading-6 text-slate-300">
            Groceries, budgets, events, and chores all tucked into one calm, family-friendly space.
          </Text>

          <View className="mt-6 flex-row flex-wrap">
            {[
              { label: "Shared lists", tint: "#22C55E" },
              { label: "Family calendar", tint: "#60A5FA" },
              { label: "Chore rhythm", tint: "#F97316" },
            ].map((item) => (
              <View key={item.label} className="mb-2 mr-2 flex-row items-center rounded-full bg-white/10 px-3 py-2">
                <View style={{ backgroundColor: item.tint }} className="mr-2 h-2.5 w-2.5 rounded-full" />
                <Text className="text-sm font-semibold text-white">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <SurfaceCard className="mt-6 rounded-[30px] border border-white/70 bg-white/95 p-5">
          <View className="mb-5">
            <Text className="text-2xl font-black tracking-[-0.6px] text-[#0F172A]">
              {mode === "login" ? "Welcome back" : "Create your Nestiq space"}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "Jump back into your family's routines, reminders, and daily flow."
                : "Set up a calm home dashboard everyone can use without friction."}
            </Text>
          </View>

          <View className="mb-5 flex-row rounded-[20px] bg-slate-100 p-1.5">
            {(["register", "login"] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                className={`flex-1 rounded-2xl py-3.5 ${mode === value ? "bg-white" : ""}`}
              >
                <Text className="text-center text-base font-bold text-ink">{value === "register" ? "Create account" : "Log in"}</Text>
              </Pressable>
            ))}
          </View>

          {mode === "register" && (
            <>
              <FormInput label="Name" value={name} onChangeText={setName} placeholder="Maya" />
              <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-slate-600">Pick your avatar color</Text>
                <View className="flex-row flex-wrap rounded-[24px] bg-slate-50 p-3">
                  {avatarPalette.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setAvatarColor(color)}
                      style={{
                        backgroundColor: color,
                        opacity: avatarColor === color ? 1 : 0.45,
                        transform: [{ scale: avatarColor === color ? 1.08 : 1 }],
                      }}
                      className="mb-2 mr-3 h-11 w-11 rounded-full border-4 border-white"
                    />
                  ))}
                </View>
              </View>
              <View className="mb-5 flex-row rounded-[20px] bg-slate-100 p-1.5">
                <Pressable onPress={() => setJoinExisting(false)} className={`flex-1 rounded-2xl py-3.5 ${!joinExisting ? "bg-white" : ""}`}>
                  <Text className="text-center font-bold text-ink">Create family</Text>
                </Pressable>
                <Pressable onPress={() => setJoinExisting(true)} className={`flex-1 rounded-2xl py-3.5 ${joinExisting ? "bg-white" : ""}`}>
                  <Text className="text-center font-bold text-ink">Join family</Text>
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

          <View className="mt-2">
            <PrimaryButton label={saving ? "Please wait..." : mode === "login" ? "Log in to Nestiq" : "Start with Nestiq"} onPress={submit} color="#4F46E5" disabled={saving} />
          </View>

          <View className="mt-5 rounded-[22px] bg-slate-50 px-4 py-4">
            <Text className="text-sm font-bold uppercase tracking-[1.5px] text-slate-400">Why families like it</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">
              Big tap targets, simple flows, and one shared home for routines that both adults and kids can understand.
            </Text>
          </View>
        </SurfaceCard>
      </ScrollView>
    </LinearGradient>
  );
};

import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useAppDialog } from "../context/AppDialogContext";
import { useLocale } from "../context/LocaleContext";
import { avatarPalette } from "../constants/theme";
import { EasyFamilyLogo } from "../components/branding/EasyFamilyLogo";
import { FormInput } from "../components/FormInput";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PrimaryButton } from "../components/PrimaryButton";
import { SurfaceCard } from "../components/SurfaceCard";

export const AuthScreen = () => {
  const { signIn, signUp } = useAuth();
  const { showAlert } = useAppDialog();
  const { t } = useLocale();
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

  const submit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedFamilyName = familyName.trim();
    const trimmedInviteCode = inviteCode.trim().toUpperCase();

    if (!trimmedEmail) {
      showAlert({ title: t("auth.emailRequired"), message: t("auth.emailRequiredBody") });
      return;
    }

    if (!password) {
      showAlert({ title: t("auth.passwordRequired"), message: t("auth.passwordRequiredBody") });
      return;
    }

    if (!isEmailValid(trimmedEmail)) {
      showAlert({ title: t("auth.invalidEmail"), message: t("auth.invalidEmailBody") });
      return;
    }

    if (password.length < 6) {
      showAlert({ title: t("auth.passwordShort"), message: t("auth.passwordShortBody") });
      return;
    }

    if (mode === "register") {
      if (!trimmedName) {
        showAlert({ title: t("auth.missingName"), message: t("auth.missingNameBody") });
        return;
      }

      if (joinExisting && trimmedInviteCode.length < 6) {
        showAlert({ title: t("auth.inviteNeeded"), message: t("auth.inviteNeededBody") });
        return;
      }

      if (!joinExisting && trimmedFamilyName.length < 2) {
        showAlert({ title: t("auth.familyNameNeeded"), message: t("auth.familyNameNeededBody") });
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
        showAlert({ title: t("auth.loginFailed"), message: t("auth.loginFailedBody") });
      } else if (message === "An account with that email already exists.") {
        showAlert({ title: t("auth.accountExists"), message: t("auth.accountExistsBody") });
      } else if (message === "This account already belongs to a family. Please log in instead. If you want to join another family, you have to delete your account first.") {
        showAlert({
          title: t("auth.accountExists"),
          message: "This account already belongs to a family. Please log in instead. If you want to join another family, you have to delete your account first.",
        });
      } else if (message === "Invite code not found.") {
        showAlert({ title: t("auth.inviteNotFound"), message: t("auth.inviteNotFoundBody") });
      } else {
        showAlert({ title: t("auth.couldNotContinue"), message });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={["#E9EEFF", "#F8FAFC", "#F5FBF6"]} className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 36, paddingBottom: 56 }}>
        <View className="relative overflow-hidden rounded-[24px] bg-[#0F172A] px-4 py-3">
          <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#1E293B]" />
          <View className="absolute right-6 top-14 h-16 w-16 rounded-full bg-[#F97316]/20" />
          <View className="absolute -left-4 bottom-8 h-24 w-24 rounded-full bg-[#60A5FA]/15" />

        <View className="mb-2 self-start">
          <LanguageSwitcher compact inverted />
        </View>

          <View className="rounded-full self-start border border-white/10 bg-white/10 px-2.5 py-1.5">
            <Text className="text-[10px] font-bold uppercase tracking-[1.6px] text-[#BFDBFE]">{t("auth.badge")}</Text>
          </View>

          <View className="mt-2">
            <EasyFamilyLogo compact />
          </View>

          <Text className="mt-2 text-[16px] font-black leading-5 text-white">{t("auth.headline")}</Text>
          <Text className="mt-1.5 max-w-[320px] text-xs leading-4.5 text-slate-300">{t("auth.subheadline")}</Text>

          <View className="mt-3 flex-row flex-wrap">
            {[
              { label: t("auth.pill.sharedLists"), tint: "#22C55E" },
              { label: t("auth.pill.familyCalendar"), tint: "#60A5FA" },
              { label: t("auth.pill.choreRhythm"), tint: "#F97316" },
            ].map((item) => (
              <View key={item.label} className="mb-1.5 mr-1.5 flex-row items-center rounded-full bg-white/10 px-2 py-1">
                <View style={{ backgroundColor: item.tint }} className="mr-1.5 h-2 w-2 rounded-full" />
                <Text className="text-[10px] font-semibold text-white">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <SurfaceCard className="mt-6 rounded-[30px] border border-white/70 bg-white/95 p-5">
          <View className="mb-5">
            <Text className="text-2xl font-black tracking-[-0.6px] text-[#0F172A]">
              {mode === "login" ? t("auth.welcomeBack") : t("auth.createSpace")}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? t("auth.loginHelper")
                : t("auth.registerHelper")}
            </Text>
          </View>

          <View className="mb-5 flex-row rounded-[20px] bg-slate-100 p-1.5">
            {(["register", "login"] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                className={`flex-1 rounded-2xl py-3.5 ${mode === value ? "bg-white" : ""}`}
              >
                <Text className="text-center text-base font-bold text-ink">{value === "register" ? t("auth.createAccount") : t("auth.logIn")}</Text>
              </Pressable>
            ))}
          </View>

          {mode === "register" ? <FormInput label={t("auth.name")} value={name} onChangeText={setName} placeholder="Maya" /> : null}
          <FormInput label={t("auth.email")} value={email} onChangeText={setEmail} placeholder="family@example.com" keyboardType="email-address" />
          <FormInput label={t("auth.password")} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          {mode === "register" && (
            <>
              <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-slate-600">{t("auth.pickAvatar")}</Text>
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
                  <Text className="text-center font-bold text-ink">{t("auth.createFamily")}</Text>
                </Pressable>
                <Pressable onPress={() => setJoinExisting(true)} className={`flex-1 rounded-2xl py-3.5 ${joinExisting ? "bg-white" : ""}`}>
                  <Text className="text-center font-bold text-ink">{t("auth.joinFamily")}</Text>
                </Pressable>
              </View>
            </>
          )}

          {mode === "register" &&
            (joinExisting ? (
              <FormInput label={t("auth.inviteCode")} value={inviteCode} onChangeText={setInviteCode} placeholder="AB12CD" />
            ) : (
              <FormInput label={t("auth.familyName")} value={familyName} onChangeText={setFamilyName} placeholder="The Lopez Family" />
            ))}

          <View className="mt-2">
            <PrimaryButton label={saving ? t("auth.pleaseWait") : mode === "login" ? t("auth.loginButton") : t("auth.startButton")} onPress={submit} color="#4F46E5" disabled={saving} />
          </View>

          <View className="mt-5 rounded-[22px] bg-slate-50 px-4 py-4">
            <Text className="text-sm font-bold uppercase tracking-[1.5px] text-slate-400">{t("auth.whyFamiliesLikeIt")}</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">{t("auth.whyFamiliesLikeItBody")}</Text>
          </View>
        </SurfaceCard>
      </ScrollView>
    </LinearGradient>
  );
};

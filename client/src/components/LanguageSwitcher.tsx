import { Pressable, Text, View } from "react-native";
import { AppLanguage, languageOptions, useLocale } from "../context/LocaleContext";

const labels: Record<AppLanguage, string> = {
  en: "EN",
  de: "DE",
  fa: "FA",
  ru: "RU",
};

export const LanguageSwitcher = ({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) => {
  const { language, setLanguage, t } = useLocale();

  return (
    <View className={compact ? "" : "mb-4"}>
      {!compact ? <Text className="mb-2 text-sm font-semibold text-slate-600">{t("language.label")}</Text> : null}
      <View className={`flex-row flex-wrap rounded-2xl ${inverted ? "bg-white/10" : "bg-slate-100"} p-1.5`}>
        {languageOptions.map((option) => {
          const active = language === option;
          return (
            <Pressable
              key={option}
              onPress={() => setLanguage(option)}
              className={`mr-1 rounded-xl px-3 py-2 ${active ? (inverted ? "bg-white/20" : "bg-white") : ""}`}
            >
              <Text className={`text-xs font-bold ${inverted ? "text-white" : "text-ink"}`}>{labels[option]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

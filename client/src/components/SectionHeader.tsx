import { Text, View } from "react-native";

export const SectionHeader = ({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent: string;
}) => (
  <View className="mb-5">
    <Text className="text-3xl font-bold text-ink">{title}</Text>
    <Text style={{ color: accent }} className="mt-1 text-base font-medium">
      {subtitle}
    </Text>
  </View>
);

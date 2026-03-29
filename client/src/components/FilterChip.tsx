import { Pressable, Text } from "react-native";

export const FilterChip = ({
  active,
  label,
  onPress,
  color,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  color: string;
}) => (
  <Pressable
    onPress={onPress}
    style={{ backgroundColor: active ? color : "#E2E8F0" }}
    className="mr-2 rounded-full px-4 py-2"
  >
    <Text className={`text-sm font-semibold ${active ? "text-white" : "text-slate-600"}`}>{label}</Text>
  </Pressable>
);

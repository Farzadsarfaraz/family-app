import { Text, Pressable } from "react-native";

export const PrimaryButton = ({
  label,
  onPress,
  color,
  disabled,
}: {
  label: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={{ backgroundColor: disabled ? "#CBD5E1" : color }}
    className="min-h-12 items-center justify-center rounded-2xl px-4"
  >
    <Text className="text-base font-semibold text-white">{label}</Text>
  </Pressable>
);

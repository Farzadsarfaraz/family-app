import { Text, TextInput, View } from "react-native";

export const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
}) => (
  <View className="mb-3">
    <Text className="mb-2 text-sm font-semibold text-slate-600">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-ink"
      placeholderTextColor="#94A3B8"
    />
  </View>
);

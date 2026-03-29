import { Text, View } from "react-native";

export const EmptyState = ({ title, message }: { title: string; message: string }) => (
  <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10">
    <Text className="text-lg font-semibold text-ink">{title}</Text>
    <Text className="mt-2 text-center text-slate-500">{message}</Text>
  </View>
);

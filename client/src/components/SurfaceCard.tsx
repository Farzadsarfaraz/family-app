import { ReactNode } from "react";
import { View } from "react-native";

export const SurfaceCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <View className={`mb-4 rounded-3xl bg-white p-4 shadow-sm ${className}`}>{children}</View>
);

import React from "react";
import { Text, View } from "react-native";

type EasyFamilyLogoProps = {
  compact?: boolean;
};

export const EasyFamilyLogo = ({ compact = false }: EasyFamilyLogoProps) => {
  return (
    <View className={`flex-row items-center ${compact ? "" : "mb-5"}`}>
      <View className="relative mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] bg-[#0F172A]">
        <View className="absolute left-[15px] top-[30px] h-[14px] w-[12px] rounded-full bg-[#60A5FA]" />
        <View className="absolute left-[27px] top-[26px] h-[16px] w-[13px] rounded-full bg-[#60A5FA]" />
        <View className="absolute left-[39px] top-[30px] h-[14px] w-[12px] rounded-full bg-[#60A5FA]" />

        <View
          className="absolute h-[22px] w-[42px] rounded-full border-[3px] border-[#F97316]"
          style={{ bottom: 15, borderTopColor: "transparent", transform: [{ rotate: "-7deg" }] }}
        />
        <View
          className="absolute h-[20px] w-[36px] rounded-full border-[3px] border-[#FB923C]"
          style={{ bottom: 18, borderTopColor: "transparent", transform: [{ rotate: "9deg" }] }}
        />
        <View
          className="absolute h-[18px] w-[30px] rounded-full border-[3px] border-[#FDBA74]"
          style={{ bottom: 20, borderTopColor: "transparent", transform: [{ rotate: "-16deg" }] }}
        />
      </View>

      <View>
        <View className="self-start rounded-full bg-[#0F172A] px-4 py-2">
          <Text className="text-[28px] font-black tracking-[1.2px]">
            <Text className="text-white">NEST</Text>
            <Text className="text-[#F97316]">IQ</Text>
          </Text>
        </View>
        {!compact ? (
          <Text className="mt-1 max-w-[240px] text-sm font-medium leading-5 text-slate-500">
            Family flow, nested into one tidy daily ritual.
          </Text>
        ) : null}
      </View>
    </View>
  );
};

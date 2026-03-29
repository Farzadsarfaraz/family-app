import React from "react";
import { Text, View } from "react-native";

type EasyFamilyLogoProps = {
  compact?: boolean;
};

export const EasyFamilyLogo = ({ compact = false }: EasyFamilyLogoProps) => {
  return (
    <View className={`flex-row items-center ${compact ? "" : "mb-5"}`}>
      <View className={`relative mr-3 items-center justify-center overflow-hidden bg-[#0F172A] ${compact ? "h-12 w-12 rounded-[16px]" : "h-16 w-16 rounded-[20px]"}`}>
        <View className={`absolute rounded-full bg-[#60A5FA] ${compact ? "left-[11px] top-[23px] h-[10px] w-[9px]" : "left-[15px] top-[30px] h-[14px] w-[12px]"}`} />
        <View className={`absolute rounded-full bg-[#60A5FA] ${compact ? "left-[21px] top-[20px] h-[12px] w-[10px]" : "left-[27px] top-[26px] h-[16px] w-[13px]"}`} />
        <View className={`absolute rounded-full bg-[#60A5FA] ${compact ? "left-[30px] top-[23px] h-[10px] w-[9px]" : "left-[39px] top-[30px] h-[14px] w-[12px]"}`} />

        <View
          className={`absolute rounded-full border-[#F97316] ${compact ? "h-[16px] w-[30px] border-[2px]" : "h-[22px] w-[42px] border-[3px]"}`}
          style={{ bottom: compact ? 10 : 15, borderTopColor: "transparent", transform: [{ rotate: "-7deg" }] }}
        />
        <View
          className={`absolute rounded-full border-[#FB923C] ${compact ? "h-[14px] w-[26px] border-[2px]" : "h-[20px] w-[36px] border-[3px]"}`}
          style={{ bottom: compact ? 12 : 18, borderTopColor: "transparent", transform: [{ rotate: "9deg" }] }}
        />
        <View
          className={`absolute rounded-full border-[#FDBA74] ${compact ? "h-[12px] w-[22px] border-[2px]" : "h-[18px] w-[30px] border-[3px]"}`}
          style={{ bottom: compact ? 14 : 20, borderTopColor: "transparent", transform: [{ rotate: "-16deg" }] }}
        />
      </View>

      <View>
        <View className={`self-start rounded-full bg-[#0F172A] ${compact ? "px-3 py-1.5" : "px-4 py-2"}`}>
          <Text className={`${compact ? "text-[18px]" : "text-[24px]"} font-black tracking-[1px] text-white`}>GoFamly</Text>
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

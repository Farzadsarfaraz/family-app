import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "GoFamly",
  slug: "gofamly",
  scheme: "gofamly",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  jsEngine: "hermes",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.farzadsarfaraz.gofamly",
  },
  android: {
    package: "com.farzadsarfaraz.gofamly",
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#F4F7FB",
    },
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: "pan",
  },
  web: {
    bundler: "metro",
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api",
  },
};

export default config;

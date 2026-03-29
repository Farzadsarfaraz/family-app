import AsyncStorage from "@react-native-async-storage/async-storage";

export const storageKeys = {
  auth: "family_app_auth",
};

export const storage = {
  get: async <T,>(key: string) => {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  set: (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)),
  remove: (key: string) => AsyncStorage.removeItem(key),
};

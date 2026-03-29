import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { authApi, setAuthToken } from "../services/api";
import { storage, storageKeys } from "../services/storage";
import { Family, User } from "../types";

type AuthState = {
  token: string | null;
  user: User | null;
  family: Family | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    name: string;
    email: string;
    password: string;
    avatarColor: string;
    familyName?: string;
    inviteCode?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = async (nextToken: string, nextUser: User, nextFamily: Family) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setFamily(nextFamily);
    await storage.set(storageKeys.auth, { token: nextToken, user: nextUser, family: nextFamily });
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const saved = await storage.get<{ token: string; user: User; family: Family }>(storageKeys.auth);
        if (saved?.token) {
          setAuthToken(saved.token);
          setToken(saved.token);
          const profile = await authApi.me();
          setUser(profile.user);
          setFamily(profile.family);
          await storage.set(storageKeys.auth, { token: saved.token, user: profile.user, family: profile.family });
        }
      } catch {
        await storage.remove(storageKeys.auth);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      family,
      loading,
      signIn: async (email, password) => {
        const response = await authApi.login({ email, password });
        await persist(response.token, response.user, response.family);
      },
      signUp: async (payload) => {
        const response = await authApi.register(payload);
        await persist(response.token, response.user, response.family);
      },
      signOut: async () => {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        setFamily(null);
        await storage.remove(storageKeys.auth);
      },
    }),
    [family, loading, token, user]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

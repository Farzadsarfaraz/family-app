import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type DialogTone = "default" | "danger";

type AlertOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: DialogTone;
};

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
};

type DialogState =
  | ({ type: "alert" } & Required<Pick<AlertOptions, "title" | "message" | "confirmLabel" | "tone">>)
  | ({ type: "confirm" } & Required<Pick<ConfirmOptions, "title" | "message" | "confirmLabel" | "cancelLabel" | "tone">>);

type AppDialogContextValue = {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export const AppDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeDialog = (result: boolean) => {
    setDialog(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  const value = useMemo<AppDialogContextValue>(
    () => ({
      showAlert: ({ title, message, confirmLabel = "OK", tone = "default" }) => {
        resolverRef.current = null;
        setDialog({ type: "alert", title, message, confirmLabel, tone });
      },
      showConfirm: ({ title, message, confirmLabel = "Continue", cancelLabel = "Cancel", tone = "default" }) =>
        new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
          setDialog({ type: "confirm", title, message, confirmLabel, cancelLabel, tone });
        }),
    }),
    []
  );

  const confirmButtonClass =
    dialog?.tone === "danger" ? "bg-rose-600" : "bg-slate-900";

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <Modal transparent visible={Boolean(dialog)} animationType="fade" onRequestClose={() => closeDialog(false)}>
        <View className="flex-1 items-center justify-center bg-slate-950/45 px-5">
          <View className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white px-5 py-5 shadow-2xl">
            <Text className={`text-[18px] font-black tracking-[-0.3px] ${dialog?.tone === "danger" ? "text-rose-700" : "text-ink"}`}>
              {dialog?.title}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">{dialog?.message}</Text>

            <View className="mt-5 flex-row justify-end">
              {dialog?.type === "confirm" ? (
                <Pressable onPress={() => closeDialog(false)} className="mr-2 rounded-full bg-slate-100 px-4 py-2.5">
                  <Text className="text-sm font-bold text-slate-600">{dialog.cancelLabel}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => closeDialog(true)} className={`rounded-full px-4 py-2.5 ${confirmButtonClass}`}>
                <Text className="text-sm font-bold text-white">{dialog?.confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const context = useContext(AppDialogContext);

  if (!context) {
    throw new Error("useAppDialog must be used inside AppDialogProvider");
  }

  return context;
};

import { navigateToAuth } from "@/lib/api/client";
import { useAuth, useNotification } from "@/providers";
import * as React from "react";

export function useAuthFlow() {
  const { refreshUser } = useAuth();
  const { showNotification } = useNotification();

  return React.useCallback(
    async (type: "login" | "logout" | "signup") => {
      try {
        const completed = await navigateToAuth(type);
        if (completed) await refreshUser();
      } catch (error) {
        showNotification(
          error instanceof Error ? error.message : "Authentication failed.",
          "error",
        );
      }
    },
    [refreshUser, showNotification],
  );
}

import { authApi, profileApi } from "@/lib/api/client";
import type { Auth0Profile, UserProfile } from "@/types/storage";
import * as React from "react";
import { MD3LightTheme, PaperProvider, Snackbar } from "react-native-paper";

// Replicate your MUI theme colors for React Native Paper
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#334155", // Deep slate
    onPrimary: "#FFFFFF",
    primaryContainer: "#E2E8F0",
    onPrimaryContainer: "#0F172A",
    secondary: "#0D9488", // Teal
    onSecondary: "#FFFFFF",
    secondaryContainer: "#CCFBF1",
    onSecondaryContainer: "#115E59",
    background: "#FAF9F6", // Warm ivory
    surface: "#FFFFFF",
    error: "#DC2626",
    onError: "#FFFFFF",
  },
};

export type AlertColor = "success" | "info" | "warning" | "error";

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
}

interface AuthContextType {
  user: Auth0Profile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  profile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const NotificationContext = React.createContext<NotificationContextType>({
  showNotification: () => {},
});

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  profile: null,
  profileLoading: true,
  refreshProfile: async () => {},
  setProfile: () => {},
});

export const useNotification = () => React.useContext(NotificationContext);
export const useAuth = () => React.useContext(AuthContext);

export function Providers({ children }: { children: React.ReactNode }) {
  // Notification state
  const [notification, setNotification] = React.useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showNotification = React.useCallback(
    (message: string, severity: AlertColor = "info") => {
      setNotification({ open: true, message, severity });
    },
    [],
  );

  const handleCloseNotification = React.useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  // Auth0 state
  const [user, setUser] = React.useState<Auth0Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // App Profile state
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);

  const refreshProfile = React.useCallback(async () => {
    try {
      setProfileLoading(true);
      const appProfile = await profileApi.get();
      setProfile(appProfile);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    try {
      setLoading(true);
      const auth0Profile = await authApi.getMe();
      setUser(auth0Profile);
      if (auth0Profile) {
        await refreshProfile();
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setProfileLoading(false);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Determine dynamic background color for the Snackbar based on severity
  const getSnackbarColor = (severity: AlertColor) => {
    switch (severity) {
      case "error":
        return theme.colors.error;
      case "warning":
        return "#D97706";
      case "success":
        return "#16A34A";
      case "info":
      default:
        return theme.colors.primary;
    }
  };

  return (
    <PaperProvider theme={theme}>
      <NotificationContext.Provider value={{ showNotification }}>
        <AuthContext.Provider
          value={{
            user,
            loading,
            refreshUser,
            profile,
            profileLoading,
            refreshProfile,
            setProfile,
          }}
        >
          {children}

          <Snackbar
            visible={notification.open}
            onDismiss={handleCloseNotification}
            duration={5000}
            style={{
              backgroundColor: getSnackbarColor(notification.severity),
              borderRadius: 8,
            }}
            action={{
              label: "Dismiss",
              textColor: "#FFFFFF",
              onPress: handleCloseNotification,
            }}
          >
            {notification.message}
          </Snackbar>
        </AuthContext.Provider>
      </NotificationContext.Provider>
    </PaperProvider>
  );
}

import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import * as React from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";

import { Providers } from "@/app/providers";
import { SearchCommandPalette } from "@/components/search/SearchCommandPalette";

// The root must export the layout component directly
export default function RootLayout() {
  return (
    <Providers>
      <RootNavigation />
    </Providers>
  );
}

// Separated component so we can access the React Native Paper theme provided above
function RootNavigation() {
  const theme = useTheme();

  // State to control the Search Command Palette visibility
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: "#FFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          // Trigger for the SearchCommandPalette
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setPaletteOpen(true)}
              style={{ padding: 8, marginRight: 8 }}
            >
              <MaterialIcons name="search" size={24} color="#FFF" />
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: "Dashboard" }} />
        <Stack.Screen name="profile" options={{ title: "Account Profile" }} />
        <Stack.Screen name="rooms/index" options={{ title: "Storage Rooms" }} />
        <Stack.Screen
          name="rooms/new"
          options={{
            title: "Create Room",
            presentation: "modal", // Slides up from the bottom natively
          }}
        />
        <Stack.Screen name="rooms/[id]" options={{ title: "Room Details" }} />
        <Stack.Screen
          name="rooms/[id]/edit"
          options={{
            title: "Edit Room",
            presentation: "modal",
          }}
        />
        <Stack.Screen name="containers/qr" options={{ title: "QR Scanner" }} />
        <Stack.Screen name="search" options={{ title: "Global Search" }} />
      </Stack>

      {/* The command palette mounts at the root level so it can overlay the entire stack */}
      <SearchCommandPalette
        visible={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import {
    ActivityIndicator,
    Avatar,
    Button,
    Card,
    Chip,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";

import { useAuth, useNotification } from "@/providers";
import { QuoteCard } from "@/components/common/QuoteCard";
import { ApiError, navigateToAuth, roomsApi } from "@/lib/api/client";
import { getInitials } from "@/lib/utils/profile";
import type { RoomSummary } from "@/types/storage";

export function DashboardOverview() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, loading: authLoading, profile } = useAuth();
  const { showNotification } = useNotification();

  const [roomsState, setRoomsState] = React.useState<{
    ownerSub: string;
    rooms: RoomSummary[];
  } | null>(null);
  const loadingRooms = !!user && roomsState?.ownerSub !== user.sub;

  const loadRooms = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await roomsApi.list();
      setRoomsState({ ownerSub: user.sub, rooms: data });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        showNotification("Could not load storage rooms.", "error");
      }
      setRoomsState({ ownerSub: user.sub, rooms: [] });
    }
  }, [showNotification, user]);

  React.useEffect(() => {
    if (user) void Promise.resolve().then(loadRooms);
  }, [user, loadRooms]);

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Unauthenticated View
  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[styles.heroCard, { backgroundColor: theme.colors.primary }]}
        >
          <Chip style={styles.heroChip} textStyle={{ color: "#FFF" }}>
            Physical Inventory Organized
          </Chip>
          <Text variant="headlineMedium" style={styles.heroTitle}>
            Welcome to myStuff -- the app designed to keep track of your stuff.
          </Text>
          <Text variant="bodyLarge" style={styles.heroSubtitle}>
            Map your storage rooms, shelves, boxes, bins, and items with
            hierarchical tracking, QR code printing and lookup.
          </Text>
          <View style={styles.heroActions}>
            <Button
              mode="contained"
              buttonColor="#FFF"
              textColor={theme.colors.primary}
              onPress={() => navigateToAuth("login")}
            >
              Sign In to Start
            </Button>
            <Button
              mode="outlined"
              textColor="#FFF"
              style={{ borderColor: "#FFF" }}
              onPress={() => navigateToAuth("signup")}
            >
              Create Account
            </Button>
          </View>
        </View>
        <QuoteCard />
      </ScrollView>
    );
  }

  // Authenticated View
  const isTablet = width > 768;
  const roomList =
    roomsState?.ownerSub === user.sub ? roomsState.rooms : [];

  const shortcuts = [
    {
      title: "New Storage Room",
      subtitle: "Add a new room or area",
      icon: "add-home",
      href: "/rooms/new",
    },
    {
      title: "View All Rooms",
      subtitle: `${roomList.length} ${roomList.length === 1 ? "room" : "rooms"} configured`,
      icon: "meeting-room",
      href: "/rooms",
    },
    {
      title: "Container QR Lookup",
      subtitle: "Find bins and inspect contents",
      icon: "qr-code-scanner",
      href: "/containers/qr",
    },
    {
      title: "Profile & Account",
      subtitle: "Update name & avatar",
      icon: "manage-accounts",
      href: "/profile",
    },
  ] as const;
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Hero Section */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: theme.colors.primary, marginBottom: 24 },
        ]}
      >
        <View style={styles.welcomeRow}>
          <Avatar.Text
            size={58}
            label={getInitials(
              profile?.firstName,
              profile?.lastName,
              user.name || user.email,
            )}
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            color="#FFF"
          />
          <View style={{ flex: 1 }}>
            <Text variant="headlineSmall" style={styles.heroTitle}>
              Welcome back, {profile?.firstName || user.name || "Explorer"}
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              Quick shortcuts to manage and organize your physical spaces
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {shortcuts.map((shortcut) => (
            <View
              key={shortcut.title}
              style={[styles.gridItem, isTablet && styles.gridItemTablet]}
            >
              <Card style={styles.shortcutCard} mode="outlined">
                <TouchableRipple
                  onPress={() => router.push(shortcut.href)}
                  style={styles.shortcutTouch}
                >
                  <View>
                    <View style={styles.shortcutIconBox}>
                      <MaterialIcons
                        name={shortcut.icon}
                        size={24}
                        color="#FFF"
                      />
                    </View>
                    <Text
                      variant="titleMedium"
                      style={{ color: "#FFF", fontWeight: "bold" }}
                    >
                      {shortcut.title}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {shortcut.subtitle}
                    </Text>
                  </View>
                </TouchableRipple>
              </Card>
            </View>
          ))}
        </View>
      </View>

      <QuoteCard />

      {/* Rooms Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
            Storage Rooms
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Your physical storage spaces and organizational hubs
          </Text>
        </View>
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => router.push("/rooms/new")}
        >
          Add Room
        </Button>
      </View>

      {loadingRooms ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator />
        </View>
      ) : roomList.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyCardContent}>
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialIcons
                name="meeting-room"
                size={32}
                color={theme.colors.onPrimaryContainer}
              />
            </View>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "bold", marginBottom: 8 }}
            >
              No storage rooms created yet
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                textAlign: "center",
                color: theme.colors.onSurfaceVariant,
                marginBottom: 16,
              }}
            >
              Start by creating your first storage room (e.g. Garage, Basement,
              Attic) to organize shelves and containers.
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => router.push("/rooms/new")}
            >
              Create Your First Room
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.grid}>
          {roomList.map((room) => (
            <View
              key={room.id}
              style={[styles.gridItem, isTablet && styles.gridItemTablet]}
            >
              <Card style={styles.roomCard} mode="outlined">
                <TouchableRipple
                  onPress={() =>
                    router.push({
                      pathname: "/rooms/[id]",
                      params: { id: room.id },
                    })
                  }
                  style={styles.roomTouch}
                >
                  <View>
                    <View
                      style={[
                        styles.roomIconBox,
                        { backgroundColor: theme.colors.primaryContainer },
                      ]}
                    >
                      <MaterialIcons
                        name="meeting-room"
                        size={24}
                        color={theme.colors.onPrimaryContainer}
                      />
                    </View>
                    <Text
                      variant="titleMedium"
                      style={{ fontWeight: "bold", marginBottom: 4 }}
                    >
                      {room.name}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      numberOfLines={2}
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginBottom: 16,
                      }}
                    >
                      {room.description || "No description provided"}
                    </Text>
                    <View style={styles.viewRoomRow}>
                      <Text
                        variant="labelLarge"
                        style={{ color: theme.colors.primary }}
                      >
                        View Room
                      </Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>
                </TouchableRipple>
              </Card>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },
  heroTitle: {
    color: "#FFF",
    fontWeight: "bold",
    marginBottom: 12,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    marginBottom: 24,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  gridItem: {
    width: "100%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  gridItemTablet: {
    width: "50%",
  },
  shortcutCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.3)",
  },
  shortcutTouch: {
    padding: 16,
  },
  shortcutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: "#FFF",
  },
  emptyCardContent: {
    alignItems: "center",
    padding: 32,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  roomCard: {
    backgroundColor: "#FFF",
    flex: 1,
  },
  roomTouch: {
    padding: 16,
    flex: 1,
  },
  roomIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  viewRoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: "auto",
  },
});

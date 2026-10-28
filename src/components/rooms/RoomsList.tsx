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
    Button,
    Card,
    IconButton,
    Menu,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";

import { useAuth, useNotification } from "@/providers";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useAuthFlow } from "@/hooks/use-auth-flow";
import { ApiError, roomsApi } from "@/lib/api/client";
import type { RoomSummary } from "@/types/storage";

export function RoomsList() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const startAuth = useAuthFlow();

  const [roomsState, setRoomsState] = React.useState<{
    ownerSub: string;
    rooms: RoomSummary[];
  } | null>(null);
  const roomList =
    user && roomsState?.ownerSub === user.sub ? roomsState.rooms : [];
  const loading =
    authLoading || (!!user && roomsState?.ownerSub !== user.sub);

  // Menu state for actions
  const [visibleMenuId, setVisibleMenuId] = React.useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = React.useState<RoomSummary | null>(
    null,
  );
  const [deleting, setDeleting] = React.useState(false);

  const fetchRooms = React.useCallback(async () => {
    if (!user) return;
    const ownerSub = user.sub;
    try {
      const data = await roomsApi.list();
      setRoomsState({ ownerSub, rooms: data });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Not authenticated
        setRoomsState({ ownerSub, rooms: [] });
      } else {
        showNotification(
          "Could not load rooms. Please check your backend connection.",
          "error",
        );
        setRoomsState({ ownerSub, rooms: [] });
      }
    }
  }, [showNotification, user]);

  React.useEffect(() => {
    if (user) void Promise.resolve().then(fetchRooms);
  }, [user, fetchRooms]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await roomsApi.delete(deleteTarget.id);
      setRoomsState((prev) =>
        prev && prev.ownerSub === user?.sub
          ? {
              ...prev,
              rooms: prev.rooms.filter((room) => room.id !== deleteTarget.id),
            }
          : prev,
      );
      showNotification(`Room "${deleteTarget.name}" deleted.`, "info");
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiError) {
        showNotification(err.message, "error");
      } else {
        showNotification("Failed to delete room", "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  const isTablet = width > 768;

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineMedium" style={styles.title}>
              Storage Rooms
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              Manage all your physical storage locations and inspect their
              contents.
            </Text>
          </View>
          {user && (
            <Button
              mode="contained"
              icon="plus"
              onPress={() => router.push("/rooms/new")}
              style={styles.headerBtn}
            >
              Create Room
            </Button>
          )}
        </View>

        {authLoading || loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : !user ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <MaterialIcons
                name="meeting-room"
                size={48}
                color={theme.colors.onSurfaceVariant}
                style={{ marginBottom: 16 }}
              />
              <Text variant="titleLarge" style={styles.emptyTitle}>
                Sign In Required
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Please sign in to access and manage your private storage rooms.
              </Text>
              <Button mode="contained" onPress={() => startAuth("login")}>
                Sign In
              </Button>
            </Card.Content>
          </Card>
        ) : roomList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <MaterialIcons
                name="meeting-room"
                size={48}
                color={theme.colors.primary}
                style={{ marginBottom: 16 }}
              />
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No storage rooms found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Get started by creating a room like &quot;Garage&quot;,
                &quot;Attic&quot;, or &quot;Storage Unit&quot;.
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
                  <View style={styles.menuAnchor}>
                    <Menu
                      visible={visibleMenuId === room.id}
                      onDismiss={() => setVisibleMenuId(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          iconColor={theme.colors.onSurfaceVariant}
                          onPress={() => setVisibleMenuId(room.id)}
                        />
                      }
                    >
                      <Menu.Item
                        leadingIcon="pencil"
                        onPress={() => {
                          setVisibleMenuId(null);
                          router.push({
                            pathname: "/rooms/[id]/edit",
                            params: { id: room.id },
                          });
                        }}
                        title="Edit Room"
                      />
                      <Menu.Item
                        leadingIcon="delete"
                        titleStyle={{ color: theme.colors.error }}
                        onPress={() => {
                          setVisibleMenuId(null);
                          setDeleteTarget(room);
                        }}
                        title="Delete Room"
                      />
                    </Menu>
                  </View>

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
                        style={{
                          fontWeight: "bold",
                          marginBottom: 4,
                          paddingRight: 32,
                        }}
                      >
                        {room.name}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        numberOfLines={2}
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          marginBottom: 24,
                        }}
                      >
                        {room.description || "No description provided"}
                      </Text>
                      <View style={styles.viewRoomRow}>
                        <Text
                          variant="labelLarge"
                          style={{
                            color: theme.colors.primary,
                            fontWeight: "bold",
                          }}
                        >
                          View Shelves & Items
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Storage Room"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}" and all of its shelves, containers, and items? This action cannot be undone.`}
        confirmLabel="Delete Room"
        confirmColor="error"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  headerBtn: {
    marginTop: 4,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: "#FFF",
    marginTop: 16,
  },
  emptyCardContent: {
    alignItems: "center",
    padding: 32,
    textAlign: "center",
  },
  emptyTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    color: "#6B7280",
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
  roomCard: {
    backgroundColor: "#FFF",
    flex: 1,
    position: "relative",
  },
  roomTouch: {
    padding: 24,
    flex: 1,
  },
  menuAnchor: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  roomIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
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

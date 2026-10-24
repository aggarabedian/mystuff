import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
    Button,
    Card,
    Chip,
    IconButton,
    Text,
    useTheme
} from "react-native-paper";

import { useNotification } from "@/providers";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PrintLabelButton } from "@/components/common/PrintLabelButton";
import { ContainerDrawer } from "@/components/rooms/drawers/ContainerDrawer";
import { ItemDrawer } from "@/components/rooms/drawers/ItemDrawer";
import { ShelfDrawer } from "@/components/rooms/drawers/ShelfDrawer";
import { ShelfRowDrawer } from "@/components/rooms/drawers/ShelfRowDrawer";
import {
    ApiError,
    containersApi,
    itemsApi,
    roomsApi,
    shelfRowsApi,
    shelvesApi,
} from "@/lib/api/client";
import type {
    ContainerType,
    NestedContainer,
    NestedRoom,
} from "@/types/storage";

interface RoomDetailViewProps {
  roomId: string;
}

export function RoomDetailView({ roomId }: RoomDetailViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = React.useState(true);
  const [room, setRoom] = React.useState<NestedRoom | null>(null);

  // Drawer States
  const [shelfDrawer, setShelfDrawer] = React.useState<{
    open: boolean;
    shelf?: { id: string; name: string } | null;
  }>({ open: false });

  const [shelfRowDrawer, setShelfRowDrawer] = React.useState<{
    open: boolean;
    shelfId: string;
    row?: { id: string; rowNumber: number; label?: string } | null;
    nextSuggestedRowNumber?: number;
  }>({ open: false, shelfId: "" });

  const [containerDrawer, setContainerDrawer] = React.useState<{
    open: boolean;
    target?:
      | { type: "row"; rowId: string }
      | { type: "container"; parentContainerId: string }
      | null;
    container?: {
      id: string;
      name: string;
      containerType: ContainerType;
      qrCode?: string;
    } | null;
  }>({ open: false });

  const [itemDrawer, setItemDrawer] = React.useState<{
    open: boolean;
    target?:
      | { type: "row"; rowId: string }
      | { type: "container"; containerId: string }
      | null;
    item?: {
      id: string;
      name: string;
      quantity: number;
      description?: string;
      photoUrl?: string;
    } | null;
  }>({ open: false });

  const fetchRoomTree = React.useCallback(async () => {
    try {
      const res = await roomsApi.getTree(roomId);
      setRoom(res.room);
    } catch (err) {
      showNotification(
        err instanceof ApiError ? err.message : "Failed to load room hierarchy",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [roomId, showNotification]);

  React.useEffect(() => {
    void Promise.resolve().then(fetchRoomTree);
  }, [fetchRoomTree]);

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
    loading?: boolean;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  const handleDeleteShelf = (shelfId: string, shelfName: string) => {
    setDeleteConfirm({
      open: true,
      title: "Delete Shelving Unit",
      message: `Are you sure you want to permanently delete "${shelfName}" and all of its rows, containers, and items?`,
      confirmLabel: "Delete Shelf",
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, loading: true }));
          await shelvesApi.delete(shelfId);
          showNotification(`Shelf "${shelfName}" deleted`, "info");
          setDeleteConfirm((prev) => ({
            ...prev,
            open: false,
            loading: false,
          }));
          fetchRoomTree();
        } catch {
          showNotification("Failed to delete shelf", "error");
          setDeleteConfirm((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleDeleteRow = (rowId: string, rowNum: number) => {
    setDeleteConfirm({
      open: true,
      title: "Delete Shelf Row",
      message: `Are you sure you want to permanently delete Row #${rowNum} and all of its containers and items?`,
      confirmLabel: "Delete Row",
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, loading: true }));
          await shelfRowsApi.delete(rowId);
          showNotification(`Row #${rowNum} deleted`, "info");
          setDeleteConfirm((prev) => ({
            ...prev,
            open: false,
            loading: false,
          }));
          fetchRoomTree();
        } catch {
          showNotification("Failed to delete shelf row", "error");
          setDeleteConfirm((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleDeleteContainer = (
    containerId: string,
    containerName: string,
  ) => {
    setDeleteConfirm({
      open: true,
      title: "Delete Container",
      message: `Are you sure you want to permanently delete container "${containerName}" and any items or nested boxes inside it?`,
      confirmLabel: "Delete Container",
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, loading: true }));
          await containersApi.delete(containerId);
          showNotification(`Container "${containerName}" deleted`, "info");
          setDeleteConfirm((prev) => ({
            ...prev,
            open: false,
            loading: false,
          }));
          fetchRoomTree();
        } catch {
          showNotification("Failed to delete container", "error");
          setDeleteConfirm((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    setDeleteConfirm({
      open: true,
      title: "Delete Item",
      message: `Are you sure you want to permanently delete item "${itemName}"?`,
      confirmLabel: "Delete Item",
      onConfirm: async () => {
        try {
          setDeleteConfirm((prev) => ({ ...prev, loading: true }));
          await itemsApi.delete(itemId);
          showNotification(`Item "${itemName}" deleted`, "info");
          setDeleteConfirm((prev) => ({
            ...prev,
            open: false,
            loading: false,
          }));
          fetchRoomTree();
        } catch {
          showNotification("Failed to delete item", "error");
          setDeleteConfirm((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.centerContainer}>
        <Card style={styles.notFoundCard}>
          <Card.Content style={styles.notFoundContent}>
            <Text
              variant="titleLarge"
              style={{ fontWeight: "bold", marginBottom: 8 }}
            >
              Room Not Found
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              The requested room may have been deleted or does not belong to
              your account.
            </Text>
            <Button mode="contained" onPress={() => router.push("/rooms")}>
              View All Rooms
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => router.push("/rooms")}
          style={styles.backBtn}
          textColor={theme.colors.onSurfaceVariant}
        >
          Back to Rooms
        </Button>

        <View style={styles.roomHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.roomTitleRow}>
              <MaterialIcons
                name="meeting-room"
                size={28}
                color={theme.colors.primary}
              />
              <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
                {room.name}
              </Text>
            </View>
            {!!room.description && (
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
              >
                {room.description}
              </Text>
            )}
          </View>
          <View style={styles.roomHeaderActions}>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() =>
                router.push({
                  pathname: "/rooms/[id]/edit",
                  params: { id: room.id },
                })
              }
            >
              Edit
            </Button>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => setShelfDrawer({ open: true, shelf: null })}
            >
              Add Shelf
            </Button>
          </View>
        </View>

        {room.shelves.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <MaterialIcons
                name="table-rows"
                size={44}
                color={theme.colors.onSurfaceVariant}
                style={{ marginBottom: 16 }}
              />
              <Text
                variant="titleLarge"
                style={{ fontWeight: "bold", marginBottom: 8 }}
              >
                No Shelving Units Added
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                Add your first shelf to start arranging rows, boxes, and items.
              </Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => setShelfDrawer({ open: true, shelf: null })}
              >
                Add Shelf
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.shelvesContainer}>
            {room.shelves.map((shelf) => (
              <Card key={shelf.id} style={styles.shelfCard} mode="outlined">
                <View
                  style={[
                    styles.shelfHeader,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <View style={styles.shelfTitleRow}>
                    <MaterialIcons
                      name="table-rows"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                      {shelf.name}
                    </Text>
                    <Chip
                      style={styles.smallChip}
                      textStyle={styles.smallChipText}
                    >
                      {shelf.rows.length} rows
                    </Chip>
                  </View>
                  <View style={styles.shelfActions}>
                    <Button
                      mode="outlined"
                      icon="plus"
                      compact
                      onPress={() => {
                        const nextRow =
                          shelf.rows.length > 0
                            ? Math.max(...shelf.rows.map((r) => r.rowNumber)) +
                              1
                            : 1;
                        setShelfRowDrawer({
                          open: true,
                          shelfId: shelf.id,
                          nextSuggestedRowNumber: nextRow,
                          row: null,
                        });
                      }}
                    >
                      Row
                    </Button>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() =>
                        setShelfDrawer({
                          open: true,
                          shelf: { id: shelf.id, name: shelf.name },
                        })
                      }
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => handleDeleteShelf(shelf.id, shelf.name)}
                    />
                  </View>
                </View>

                <View style={styles.shelfRowsContainer}>
                  {shelf.rows.length === 0 ? (
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontStyle: "italic",
                        textAlign: "center",
                      }}
                    >
                      No rows configured on this shelf yet.
                    </Text>
                  ) : (
                    shelf.rows.map((row) => (
                      <View
                        key={row.id}
                        style={[
                          styles.rowContainer,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.surfaceVariant,
                          },
                        ]}
                      >
                        <View style={styles.rowHeader}>
                          <View style={styles.rowTitleArea}>
                            <Text
                              variant="titleMedium"
                              style={{ fontWeight: "bold" }}
                            >
                              Row #{row.rowNumber}
                            </Text>
                            {!!row.label && (
                              <Chip
                                mode="outlined"
                                style={styles.smallChip}
                                textStyle={styles.smallChipText}
                              >
                                {row.label}
                              </Chip>
                            )}
                          </View>
                          <View style={styles.rowActions}>
                            <IconButton
                              icon="inbox-multiple"
                              size={20}
                              onPress={() =>
                                setContainerDrawer({
                                  open: true,
                                  target: { type: "row", rowId: row.id },
                                  container: null,
                                })
                              }
                            />
                            <IconButton
                              icon="shape"
                              size={20}
                              onPress={() =>
                                setItemDrawer({
                                  open: true,
                                  target: { type: "row", rowId: row.id },
                                  item: null,
                                })
                              }
                            />
                            <IconButton
                              icon="pencil"
                              size={20}
                              onPress={() =>
                                setShelfRowDrawer({
                                  open: true,
                                  shelfId: shelf.id,
                                  row: {
                                    id: row.id,
                                    rowNumber: row.rowNumber,
                                    label: row.label,
                                  },
                                })
                              }
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor={theme.colors.error}
                              onPress={() =>
                                handleDeleteRow(row.id, row.rowNumber)
                              }
                            />
                          </View>
                        </View>

                        {row.containers.length > 0 && (
                          <View style={{ marginBottom: 16 }}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.sectionLabel,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              CONTAINERS ({row.containers.length})
                            </Text>
                            <View style={styles.nodesContainer}>
                              {row.containers.map((container) => (
                                <ContainerItemNode
                                  key={container.id}
                                  container={container}
                                  onEditContainer={(c) =>
                                    setContainerDrawer({
                                      open: true,
                                      container: c,
                                    })
                                  }
                                  onAddNestedContainer={(id) =>
                                    setContainerDrawer({
                                      open: true,
                                      target: {
                                        type: "container",
                                        parentContainerId: id,
                                      },
                                      container: null,
                                    })
                                  }
                                  onAddItem={(id) =>
                                    setItemDrawer({
                                      open: true,
                                      target: {
                                        type: "container",
                                        containerId: id,
                                      },
                                      item: null,
                                    })
                                  }
                                  onEditItem={(item) =>
                                    setItemDrawer({ open: true, item })
                                  }
                                  onDeleteContainer={handleDeleteContainer}
                                  onDeleteItem={handleDeleteItem}
                                />
                              ))}
                            </View>
                          </View>
                        )}

                        {row.items.length > 0 && (
                          <View>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.sectionLabel,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              DIRECT SHELF ITEMS ({row.items.length})
                            </Text>
                            <View style={styles.itemChipsContainer}>
                              {row.items.map((item) => (
                                <Chip
                                  key={item.id}
                                  mode="outlined"
                                  onPress={() =>
                                    setItemDrawer({ open: true, item })
                                  }
                                  onClose={() =>
                                    handleDeleteItem(item.id, item.name)
                                  }
                                  style={styles.itemChip}
                                >
                                  {item.name} ({item.quantity}x)
                                </Chip>
                              ))}
                            </View>
                          </View>
                        )}

                        {row.containers.length === 0 &&
                          row.items.length === 0 && (
                            <Text
                              variant="bodySmall"
                              style={{
                                color: theme.colors.onSurfaceVariant,
                                fontStyle: "italic",
                              }}
                            >
                              Empty row. Add a container or place items
                              directly.
                            </Text>
                          )}
                      </View>
                    ))
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* These will be translated to Modals in their respective files */}
      <ShelfDrawer
        open={shelfDrawer.open}
        roomId={roomId}
        shelf={shelfDrawer.shelf}
        onClose={() => setShelfDrawer({ open: false })}
        onSuccess={fetchRoomTree}
      />
      <ShelfRowDrawer
        open={shelfRowDrawer.open}
        shelfId={shelfRowDrawer.shelfId}
        row={shelfRowDrawer.row}
        nextSuggestedRowNumber={shelfRowDrawer.nextSuggestedRowNumber}
        onClose={() => setShelfRowDrawer({ open: false, shelfId: "" })}
        onSuccess={fetchRoomTree}
      />
      <ContainerDrawer
        open={containerDrawer.open}
        target={containerDrawer.target}
        container={containerDrawer.container}
        onClose={() => setContainerDrawer({ open: false })}
        onSuccess={fetchRoomTree}
      />
      <ItemDrawer
        open={itemDrawer.open}
        target={itemDrawer.target}
        item={itemDrawer.item}
        onClose={() => setItemDrawer({ open: false })}
        onSuccess={fetchRoomTree}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmLabel={deleteConfirm.confirmLabel || "Delete"}
        confirmColor="error"
        loading={deleteConfirm.loading}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
        onConfirm={deleteConfirm.onConfirm}
      />
    </View>
  );
}

function ContainerItemNode({
  container,
  onEditContainer,
  onAddNestedContainer,
  onAddItem,
  onEditItem,
  onDeleteContainer,
  onDeleteItem,
}: {
  container: NestedContainer;
  onEditContainer: (c: {
    id: string;
    name: string;
    containerType: ContainerType;
    qrCode?: string;
  }) => void;
  onAddNestedContainer: (id: string) => void;
  onAddItem: (id: string) => void;
  onEditItem: (item: {
    id: string;
    name: string;
    quantity: number;
    description?: string;
    photoUrl?: string;
  }) => void;
  onDeleteContainer: (id: string, name: string) => void;
  onDeleteItem: (id: string, name: string) => void;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.nodeCard} mode="outlined">
      <View style={styles.nodeHeader}>
        <View style={styles.nodeTitleArea}>
          <MaterialIcons name="inbox" size={20} color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ fontWeight: "bold" }}>
            {container.name}
          </Text>
          <Chip
            mode="outlined"
            style={styles.smallChip}
            textStyle={styles.smallChipText}
          >
            {container.containerType}
          </Chip>
        </View>
        <View style={styles.nodeActions}>
          <IconButton
            icon="pencil"
            size={18}
            onPress={() =>
              onEditContainer({
                id: container.id,
                name: container.name,
                containerType: container.containerType,
                qrCode: container.qrCode,
              })
            }
          />
          <IconButton
            icon="inbox-multiple"
            size={18}
            onPress={() => onAddNestedContainer(container.id)}
          />
          <IconButton
            icon="shape"
            size={18}
            onPress={() => onAddItem(container.id)}
          />
          <IconButton
            icon="delete"
            size={18}
            iconColor={theme.colors.error}
            onPress={() => onDeleteContainer(container.id, container.name)}
          />
        </View>
      </View>
      {container.qrCode && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <PrintLabelButton qrCode={container.qrCode} />
        </View>
      )}

      {(container.items.length > 0 || container.containers.length > 0) && (
        <View
          style={[
            styles.nodeChildrenArea,
            { borderColor: theme.colors.surfaceVariant },
          ]}
        >
          {container.items.length > 0 && (
            <View style={styles.itemChipsContainer}>
              {container.items.map((item) => (
                <Chip
                  key={item.id}
                  mode="outlined"
                  onPress={() => onEditItem(item)}
                  onClose={() => onDeleteItem(item.id, item.name)}
                  style={[
                    styles.itemChip,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                  textStyle={{ fontSize: 12 }}
                >
                  {item.name} ({item.quantity}x)
                </Chip>
              ))}
            </View>
          )}

          {container.containers.length > 0 && (
            <View style={styles.nestedContainers}>
              {container.containers.map((child) => (
                <ContainerItemNode
                  key={child.id}
                  container={child}
                  onEditContainer={onEditContainer}
                  onAddNestedContainer={onAddNestedContainer}
                  onAddItem={onAddItem}
                  onEditItem={onEditItem}
                  onDeleteContainer={onDeleteContainer}
                  onDeleteItem={onDeleteItem}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 16, marginLeft: -8 },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  roomTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  roomHeaderActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  notFoundCard: { backgroundColor: "#FFF", width: "100%", maxWidth: 400 },
  notFoundContent: { alignItems: "center", padding: 24 },
  emptyCard: { backgroundColor: "#FFF", marginTop: 16 },
  emptyCardContent: { alignItems: "center", padding: 32 },
  shelvesContainer: { gap: 24 },
  shelfCard: { backgroundColor: "#FFF", overflow: "hidden" },
  shelfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    flexWrap: "wrap",
    gap: 12,
  },
  shelfTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  shelfActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  smallChip: { height: 24, justifyContent: "center" },
  smallChipText: { fontSize: 11, marginVertical: 0 },
  shelfRowsContainer: { padding: 16, gap: 16 },
  rowContainer: { padding: 16, borderRadius: 12, borderWidth: 1 },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  rowTitleArea: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowActions: { flexDirection: "row", alignItems: "center", marginRight: -12 },
  sectionLabel: { fontWeight: "bold", letterSpacing: 0.5, marginBottom: 8 },
  nodesContainer: { gap: 12 },
  itemChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  itemChip: { borderRadius: 16 },
  nodeCard: { backgroundColor: "#FFF", borderRadius: 8 },
  nodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  nodeTitleArea: { flexDirection: "row", alignItems: "center", gap: 6 },
  nodeActions: { flexDirection: "row", alignItems: "center", marginRight: -8 },
  nodeChildrenArea: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  nestedContainers: {
    gap: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#E2E8F0",
    marginTop: 4,
  },
});

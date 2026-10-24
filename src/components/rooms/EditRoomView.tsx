import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

import { useNotification } from "@/providers";
import { FormTextField } from "@/components/forms/FormTextField";
import { ApiError, roomsApi } from "@/lib/api/client";

interface EditRoomFormData {
  name: string;
  description: string;
}

interface EditRoomViewProps {
  roomId: string;
}

export function EditRoomView({ roomId }: EditRoomViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const { control, handleSubmit, reset } = useForm<EditRoomFormData>({
    defaultValues: { name: "", description: "" },
  });

  React.useEffect(() => {
    async function loadRoom() {
      try {
        setLoading(true);
        const res = await roomsApi.getTree(roomId);
        reset({
          name: res.room.name,
          description: res.room.description || "",
        });
      } catch (err) {
        showNotification(
          err instanceof ApiError ? err.message : "Failed to load room details",
          "error",
        );
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [roomId, reset, showNotification]);

  const onSubmit = async (data: EditRoomFormData) => {
    if (!data.name.trim()) {
      showNotification("Room name is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      await roomsApi.update(roomId, {
        name: data.name.trim(),
        description: data.description.trim() ? data.description.trim() : null,
      });
      showNotification("Room updated successfully!", "success");
      router.back();
    } catch (err) {
      showNotification(
        err instanceof ApiError ? err.message : "Failed to update room.",
        "error",
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View
          style={[styles.iconBox, { backgroundColor: theme.colors.primary }]}
        >
          <MaterialIcons name="edit-note" size={28} color="#FFF" />
        </View>
        <View style={styles.headerText}>
          <Text variant="headlineSmall" style={styles.title}>
            Edit Storage Room
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Update the title and description for this storage space.
          </Text>
        </View>
      </View>

      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.formSpacing}>
            <FormTextField
              name="name"
              control={control}
              label="Room Name"
              placeholder="e.g. Main Garage"
            />
            <FormTextField
              name="description"
              control={control}
              label="Description"
              placeholder="Optional details about layout or notes"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={submitting}
              style={styles.actionBtn}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              disabled={submitting}
              loading={submitting}
              style={styles.actionBtn}
            >
              Save Changes
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontWeight: "bold" },
  card: { borderRadius: 16, backgroundColor: "#FFF" },
  formSpacing: { gap: 16, marginBottom: 24 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  actionBtn: { minWidth: 100 },
});

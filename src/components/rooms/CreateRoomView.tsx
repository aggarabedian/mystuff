import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { useForm } from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";

import { useNotification } from "@/providers";
import { FormTextField } from "@/components/forms/FormTextField";
import { ApiError, roomsApi } from "@/lib/api/client";

interface CreateRoomFormData {
  name: string;
  description: string;
}

const ROOM_SUGGESTIONS = [
  "Garage",
  "Basement",
  "Attic",
  "Storage Unit",
  "Pantry",
  "Workshop",
  "Master Closet",
  "Shed",
];

export function CreateRoomView() {
  const theme = useTheme();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [submitting, setSubmitting] = React.useState(false);

  const { control, handleSubmit, setValue } = useForm<CreateRoomFormData>({
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (data: CreateRoomFormData) => {
    if (!data.name.trim()) {
      showNotification("Room name is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const newRoom = await roomsApi.create({
        name: data.name.trim(),
        description: data.description.trim() || undefined,
      });
      showNotification(
        `Room "${newRoom.name}" created successfully!`,
        "success",
      );

      // Navigate to the newly created room and replace the current history stack
      // so hitting 'back' doesn't return to this form
      router.replace({ pathname: "/rooms/[id]", params: { id: newRoom.id } });
    } catch (err) {
      if (err instanceof ApiError) {
        showNotification(err.message, "error");
      } else {
        showNotification(
          "Failed to create room. Please ensure you are signed in.",
          "error",
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[styles.iconBox, { backgroundColor: theme.colors.primary }]}
        >
          <MaterialIcons name="add-business" size={28} color="#FFF" />
        </View>
        <View style={styles.headerText}>
          <Text variant="headlineSmall" style={styles.title}>
            Create Storage Room
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Set up a physical space to organize shelves, racks, containers, and
            items.
          </Text>
        </View>
      </View>

      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text
            variant="labelMedium"
            style={[
              styles.suggestionLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            POPULAR ROOM TYPES (TAP TO APPLY)
          </Text>
          <View style={styles.chipContainer}>
            {ROOM_SUGGESTIONS.map((suggestion) => (
              <Chip
                key={suggestion}
                mode="outlined"
                onPress={() =>
                  setValue("name", suggestion, { shouldDirty: true })
                }
                style={styles.chip}
              >
                {suggestion}
              </Chip>
            ))}
          </View>

          <View style={styles.formSpacing}>
            <FormTextField
              name="name"
              control={control}
              label="Room Name"
              placeholder="e.g. Main Garage or Attic Storage"
              helperText="Give this room an easily identifiable name."
            />
            <FormTextField
              name="description"
              control={control}
              label="Description (Optional)"
              placeholder="e.g. 2-car garage with left wall shelving"
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
              Create Room
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerText: { flex: 1 },
  title: { fontWeight: "bold" },
  card: { borderRadius: 16, backgroundColor: "#FFF" },
  suggestionLabel: { fontWeight: "bold", marginBottom: 8, letterSpacing: 0.5 },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  chip: { borderRadius: 16 },
  formSpacing: { gap: 16, marginBottom: 24 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  actionBtn: { minWidth: 100 },
});

import { MaterialIcons } from "@expo/vector-icons";
import * as React from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import {
    Button,
    IconButton,
    Modal,
    Portal,
    Surface,
    Text,
    useTheme,
} from "react-native-paper";

import { useNotification } from "@/app/providers";
import { FormTextField } from "@/components/forms/FormTextField";
import { ApiError, shelvesApi } from "@/lib/api/client";

interface ShelfDrawerProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  shelf?: { id: string; name: string } | null;
  onSuccess: () => void;
}

interface ShelfFormData {
  name: string;
}

export function ShelfDrawer({
  open,
  onClose,
  roomId,
  shelf,
  onSuccess,
}: ShelfDrawerProps) {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const [submitting, setSubmitting] = React.useState(false);
  const isEditing = Boolean(shelf);

  const { control, handleSubmit, reset } = useForm<ShelfFormData>({
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    if (shelf) {
      reset({ name: shelf.name });
    } else {
      reset({ name: "" });
    }
  }, [shelf, reset, open]);

  const onSubmit = async (data: ShelfFormData) => {
    if (!data.name.trim()) {
      showNotification("Shelf name is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && shelf) {
        await shelvesApi.update(shelf.id, { name: data.name.trim() });
        showNotification(`Shelf updated to "${data.name.trim()}"`, "success");
      } else {
        await shelvesApi.create(roomId, { name: data.name.trim() });
        showNotification(`Shelf "${data.name.trim()}" created`, "success");
      }
      onClose();
      onSuccess();
    } catch (err) {
      showNotification(
        err instanceof ApiError ? err.message : "Failed to save shelf",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={() => {
          if (!submitting) onClose();
        }}
        contentContainerStyle={styles.modalWrapper}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Surface style={styles.container} elevation={2}>
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <MaterialIcons
                    name="table-rows"
                    size={24}
                    color={theme.colors.onPrimaryContainer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
                    {isEditing ? "Edit Shelving Unit" : "Add Shelving Unit"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {isEditing
                      ? "Update shelving rack name"
                      : "Add a rack, shelving unit, or wall shelf"}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                disabled={submitting}
              />
            </View>

            <View style={styles.formContent}>
              <FormTextField
                name="name"
                control={control}
                label="Shelving Unit Name"
                placeholder="e.g. Heavy Duty Wire Rack"
                helperText="An identifiable name for this shelving structure."
              />
            </View>

            <View
              style={[
                styles.actions,
                { borderTopColor: theme.colors.outlineVariant },
              ]}
            >
              <Button
                mode="outlined"
                onPress={onClose}
                disabled={submitting}
                style={styles.actionBtn}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                disabled={submitting}
                loading={submitting}
                style={styles.actionBtn}
              >
                {submitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Shelf"}
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: { justifyContent: "center", alignItems: "center", padding: 16 },
  keyboardView: { width: "100%", maxWidth: 500, maxHeight: "90%" },
  container: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFF",
    flexShrink: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formContent: { padding: 16, gap: 16 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: { minWidth: 100 },
});

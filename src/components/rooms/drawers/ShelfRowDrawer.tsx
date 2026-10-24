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

import { useNotification } from "@/providers";
import { FormTextField } from "@/components/forms/FormTextField";
import { ApiError, shelfRowsApi } from "@/lib/api/client";

interface ShelfRowDrawerProps {
  open: boolean;
  onClose: () => void;
  shelfId: string;
  row?: { id: string; rowNumber: number; label?: string } | null;
  nextSuggestedRowNumber?: number;
  onSuccess: () => void;
}

interface RowFormData {
  rowNumber: string; // Stored as string for TextInput, parsed on submit
  label: string;
}

export function ShelfRowDrawer({
  open,
  onClose,
  shelfId,
  row,
  nextSuggestedRowNumber = 1,
  onSuccess,
}: ShelfRowDrawerProps) {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const [submitting, setSubmitting] = React.useState(false);
  const isEditing = Boolean(row);

  const { control, handleSubmit, reset } = useForm<RowFormData>({
    defaultValues: {
      rowNumber: String(nextSuggestedRowNumber),
      label: "",
    },
  });

  React.useEffect(() => {
    if (row) {
      reset({
        rowNumber: String(row.rowNumber),
        label: row.label || "",
      });
    } else {
      reset({
        rowNumber: String(nextSuggestedRowNumber),
        label: "",
      });
    }
  }, [row, nextSuggestedRowNumber, reset, open]);

  const onSubmit = async (data: RowFormData) => {
    const rowNum = Number(data.rowNumber);
    if (isNaN(rowNum) || rowNum < 1) {
      showNotification("Row number must be a positive integer", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && row) {
        await shelfRowsApi.update(row.id, {
          rowNumber: rowNum,
          label: data.label.trim() ? data.label.trim() : null,
        });
        showNotification(`Row updated to #${rowNum}`, "success");
      } else {
        await shelfRowsApi.create(shelfId, {
          rowNumber: rowNum,
          label: data.label.trim() || undefined,
        });
        showNotification(`Row #${rowNum} created`, "success");
      }
      onClose();
      onSuccess();
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.errorCode === "row_number_already_exists"
      ) {
        showNotification(
          `Row #${rowNum} already exists on this shelf. Please choose a different number.`,
          "error",
        );
      } else if (err instanceof ApiError) {
        showNotification(err.message, "error");
      } else {
        showNotification("Failed to save shelf row", "error");
      }
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
                    name="view-stream"
                    size={24}
                    color={theme.colors.onPrimaryContainer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
                    {isEditing ? "Edit Shelf Row" : "Add Shelf Row"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {isEditing
                      ? "Adjust row index and tier label"
                      : "Create a numbered tier for containers & items"}
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
                name="rowNumber"
                control={control}
                label="Row Number (Positive Integer)"
                keyboardType="numeric"
                helperText="Numbered from top to bottom (e.g. 1 for top shelf)."
              />

              <FormTextField
                name="label"
                control={control}
                label="Tier Label (Optional)"
                placeholder="e.g. Top Tier, Bottom Storage"
                helperText="An optional descriptive label to help locate items."
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
                onPress={() => {
                  void handleSubmit(onSubmit)();
                }}
                disabled={submitting}
                loading={submitting}
                style={styles.actionBtn}
              >
                {submitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Row"}
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

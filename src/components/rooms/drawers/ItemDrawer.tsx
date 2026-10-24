import { MaterialIcons } from "@expo/vector-icons";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
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
import { ApiError, itemsApi } from "@/lib/api/client";

interface ItemDrawerProps {
  open: boolean;
  onClose: () => void;
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
  onSuccess: () => void;
}

interface ItemFormData {
  name: string;
  quantity: string; // Stored as string for TextInput, parsed to number on submit
  description: string;
  photoUrl: string;
}

export function ItemDrawer({
  open,
  onClose,
  target,
  item,
  onSuccess,
}: ItemDrawerProps) {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const [submitting, setSubmitting] = React.useState(false);
  const isEditing = Boolean(item);

  const { control, handleSubmit, reset } = useForm<ItemFormData>({
    defaultValues: {
      name: "",
      quantity: "1",
      description: "",
      photoUrl: "",
    },
  });

  const photoUrlValue = useWatch({ control, name: "photoUrl" }) ?? "";

  React.useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        quantity: String(item.quantity),
        description: item.description || "",
        photoUrl: item.photoUrl || "",
      });
    } else {
      reset({ name: "", quantity: "1", description: "", photoUrl: "" });
    }
  }, [item, reset, open]);

  const onSubmit = async (data: ItemFormData) => {
    if (!data.name.trim()) {
      showNotification("Item name is required", "error");
      return;
    }

    const qty = Number(data.quantity);
    if (isNaN(qty) || qty < 1) {
      showNotification("Quantity must be at least 1", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && item) {
        await itemsApi.update(item.id, {
          name: data.name.trim(),
          quantity: qty,
          description: data.description.trim() ? data.description.trim() : null,
          photoUrl: data.photoUrl.trim() ? data.photoUrl.trim() : null,
        });
        showNotification(`Item "${data.name.trim()}" updated`, "success");
      } else if (target?.type === "row") {
        await itemsApi.createOnRow(target.rowId, {
          name: data.name.trim(),
          quantity: qty,
          description: data.description.trim() || undefined,
          photoUrl: data.photoUrl.trim() || undefined,
        });
        showNotification(`Item "${data.name.trim()}" added to row`, "success");
      } else if (target?.type === "container") {
        await itemsApi.createInContainer(target.containerId, {
          name: data.name.trim(),
          quantity: qty,
          description: data.description.trim() || undefined,
          photoUrl: data.photoUrl.trim() || undefined,
        });
        showNotification(
          `Item "${data.name.trim()}" added to container`,
          "success",
        );
      }
      onClose();
      onSuccess();
    } catch (err) {
      showNotification(
        err instanceof ApiError ? err.message : "Failed to save item",
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <MaterialIcons
                    name="category"
                    size={24}
                    color={theme.colors.onPrimaryContainer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
                    {isEditing ? "Edit Item" : "Add Item"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {isEditing
                      ? "Modify item properties and quantity"
                      : "Store an item directly on a row or inside a container"}
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

            {/* Form */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
            >
              <FormTextField
                name="name"
                control={control}
                label="Item Name"
                placeholder="e.g. 25ft Heavy Duty Extension Cord"
              />

              <FormTextField
                name="quantity"
                control={control}
                label="Quantity"
                keyboardType="numeric"
                helperText="Number of units stored."
              />

              <FormTextField
                name="description"
                control={control}
                label="Description (Optional)"
                placeholder="Notes on condition, model number, etc."
                multiline
                numberOfLines={3}
              />

              <FormTextField
                name="photoUrl"
                control={control}
                label="Photo URL (Optional)"
                placeholder="https://example.com/item.jpg"
                helperText="A direct link to an image of this item."
                keyboardType="url"
                autoCapitalize="none"
              />

              {/* Photo Preview */}
              {!!photoUrlValue && photoUrlValue.trim().startsWith("http") && (
                <View
                  style={[
                    styles.photoPreview,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    PHOTO PREVIEW
                  </Text>
                  <Image
                    source={{ uri: photoUrlValue.trim() }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                </View>
              )}
            </ScrollView>

            {/* Actions */}
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
                    : "Save Item"}
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  keyboardView: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
  },
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
  formScroll: {
    flexShrink: 1,
  },
  formScrollContent: {
    padding: 16,
    gap: 16,
  },
  photoPreview: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 8,
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    minWidth: 100,
  },
});

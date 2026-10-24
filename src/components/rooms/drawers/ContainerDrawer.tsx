import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as React from "react";
import { useForm } from "react-hook-form";
import {
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
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextField } from "@/components/forms/FormTextField";
import { ApiError, containersApi } from "@/lib/api/client";
import { CONTAINER_TYPES, type ContainerType } from "@/types/storage";

interface ContainerDrawerProps {
  open: boolean;
  onClose: () => void;
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
  onSuccess: () => void;
}

interface ContainerFormData {
  name: string;
  containerType: ContainerType;
}

const CONTAINER_OPTIONS = CONTAINER_TYPES.map((type) => ({
  label: type,
  value: type,
}));

export function ContainerDrawer({
  open,
  onClose,
  target,
  container,
  onSuccess,
}: ContainerDrawerProps) {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const isEditing = Boolean(container);

  const { control, handleSubmit, reset } = useForm<ContainerFormData>({
    defaultValues: {
      name: "",
      containerType: "Box",
    },
  });

  React.useEffect(() => {
    if (container) {
      reset({
        name: container.name,
        containerType: container.containerType,
      });
    } else {
      reset({
        name: "",
        containerType: "Box",
      });
    }
  }, [container, reset, open]);

  const handleCopyQr = async () => {
    if (container?.qrCode) {
      await Clipboard.setStringAsync(container.qrCode);
      setCopied(true);
      showNotification("QR code copied to clipboard", "info");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSubmit = async (data: ContainerFormData) => {
    if (!data.name.trim()) {
      showNotification("Container name is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && container) {
        await containersApi.update(container.id, {
          name: data.name.trim(),
          containerType: data.containerType,
        });
        showNotification(`Container "${data.name.trim()}" updated`, "success");
      } else if (target?.type === "row") {
        const created = await containersApi.createOnRow(target.rowId, {
          name: data.name.trim(),
          containerType: data.containerType,
        });
        showNotification(
          `Container "${created.name}" created! Unique QR: ${created.qrCode?.slice(0, 12)}...`,
          "success",
        );
      } else if (target?.type === "container") {
        const created = await containersApi.createNested(
          target.parentContainerId,
          {
            name: data.name.trim(),
            containerType: data.containerType,
          },
        );
        showNotification(
          `Nested container "${created.name}" created! Unique QR: ${created.qrCode?.slice(0, 12)}...`,
          "success",
        );
      }
      onClose();
      onSuccess();
    } catch (err) {
      showNotification(
        err instanceof ApiError ? err.message : "Failed to save container",
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
                    { backgroundColor: theme.colors.secondaryContainer },
                  ]}
                >
                  <MaterialIcons
                    name="all-inbox"
                    size={24}
                    color={theme.colors.onSecondaryContainer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
                    {isEditing ? "Edit Container" : "Add Container"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {isEditing
                      ? "Update container name and type"
                      : "Add a physical container with a unique QR code"}
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
                label="Container Name"
                placeholder="e.g. Holiday Lights, Power Tools"
                helperText="A label describing this box or tote."
              />

              <FormSelect
                name="containerType"
                control={control}
                label="Container Type"
                options={CONTAINER_OPTIONS}
              />

              {/* QR code info (if editing) */}
              {isEditing && container?.qrCode && (
                <View
                  style={[
                    styles.qrContainer,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.qrHeader}>
                    <MaterialIcons
                      name="qr-code"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text
                      variant="labelMedium"
                      style={{
                        fontWeight: "bold",
                        color: theme.colors.primary,
                      }}
                    >
                      UNIQUE QR CODE
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.qrCodeBox,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      style={{
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                      }}
                    >
                      {container.qrCode}
                    </Text>
                  </View>

                  <Button
                    mode="text"
                    icon={copied ? "check" : "content-copy"}
                    textColor={
                      copied
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                    onPress={handleCopyQr}
                    style={styles.copyBtn}
                    labelStyle={{ fontSize: 13 }}
                  >
                    {copied ? "Copied" : "Copy QR"}
                  </Button>
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
                    : "Create Container"}
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
  qrContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  qrHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  qrCodeBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  copyBtn: {
    alignSelf: "flex-end",
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

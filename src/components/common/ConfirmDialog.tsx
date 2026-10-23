import { MaterialIcons } from "@expo/vector-icons";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, useTheme } from "react-native-paper";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode | string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "error" | "primary" | "warning";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmColor = "error",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const theme = useTheme();

  // Map MUI color intentions to React Native Paper theme/hex values
  const colorMap = {
    error: { main: theme.colors.error, light: "#FEE2E2" },
    warning: { main: "#D97706", light: "#FEF3C7" },
    primary: { main: theme.colors.primary, light: "#E0E7FF" },
  };

  const activeColors = colorMap[confirmColor] || colorMap.error;

  return (
    <Portal>
      <Dialog
        visible={open}
        onDismiss={() => {
          if (!loading) onClose();
        }}
        style={styles.dialog}
      >
        <Dialog.Title>
          <View style={styles.titleContainer}>
            <View
              style={[styles.iconBox, { backgroundColor: activeColors.light }]}
            >
              <MaterialIcons
                name="warning-amber"
                size={24}
                color={activeColors.main}
              />
            </View>
            <Text variant="titleLarge" style={styles.titleText}>
              {title}
            </Text>
          </View>
        </Dialog.Title>

        <Dialog.Content>
          {typeof message === "string" ? (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {message}
            </Text>
          ) : (
            message
          )}
        </Dialog.Content>

        <Dialog.Actions style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={onClose}
            disabled={loading}
            textColor={theme.colors.onSurfaceVariant}
          >
            {cancelLabel}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            disabled={loading}
            loading={loading}
            buttonColor={activeColors.main}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontWeight: "bold",
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
});

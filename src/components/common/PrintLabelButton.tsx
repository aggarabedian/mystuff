import { useNotification } from "@/app/providers";
import { buildApiUrl } from "@/lib/api/client";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as React from "react";
import { Button, useTheme } from "react-native-paper";

interface PrintLabelButtonProps {
  qrCode: string;
}

export function PrintLabelButton({ qrCode }: PrintLabelButtonProps) {
  const theme = useTheme();
  const [printing, setPrinting] = React.useState(false);
  const { showNotification } = useNotification();

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const url = buildApiUrl(`/api/labels/${encodeURIComponent(qrCode)}`);

      // We must fetch manually to include the session cookie; expo-print cannot pass credentials directly
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to generate label");

      // Read blob as base64 to save it to the local file system
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          // Extract the raw base64 string from the data URI (data:application/pdf;base64,...)
          const base64 = base64data.split(",")[1];
          const fileUri = `${FileSystem.cacheDirectory}label-${qrCode}.pdf`;

          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Trigger the native OS print dialog
          await Print.printAsync({ uri: fileUri });
        } catch (err) {
          showNotification("Could not open print dialog.", "error");
        } finally {
          setPrinting(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(error);
      showNotification("Could not fetch or print the label.", "error");
      setPrinting(false);
    }
  };

  return (
    <Button
      mode="outlined"
      icon="printer"
      loading={printing}
      disabled={printing}
      onPress={handlePrint}
      textColor={theme.colors.secondary}
      style={{ borderColor: theme.colors.outlineVariant, marginLeft: 8 }}
      labelStyle={{ fontSize: 13, fontWeight: "600" }}
    >
      {printing ? "Generating..." : "Print QR"}
    </Button>
  );
}

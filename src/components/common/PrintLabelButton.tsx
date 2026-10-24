import { useNotification } from "@/providers";
import { buildApiUrl } from "@/lib/api/client";
import { File, Paths } from "expo-file-system";
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

      const bytes = new Uint8Array(await response.arrayBuffer());
      const safeQrCode = qrCode.replace(/[^a-zA-Z0-9_-]/g, "_");
      const file = new File(Paths.cache, `label-${safeQrCode}.pdf`);
      await file.write(bytes);
      await Print.printAsync({ uri: file.uri });
    } catch (error) {
      console.error(error);
      showNotification("Could not fetch or print the label.", "error");
    } finally {
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

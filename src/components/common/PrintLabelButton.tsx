import { useNotification } from "@/providers";
import { apiFetchBytes } from "@/lib/api/client";
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
      const bytes = await apiFetchBytes(
        `/api/labels/${encodeURIComponent(qrCode)}`,
      );
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

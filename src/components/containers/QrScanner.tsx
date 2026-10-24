import { CameraView, useCameraPermissions } from "expo-camera";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

export interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export function QrScanner({ onScanSuccess }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: "center", marginBottom: 16 }}>
          We need your permission to use the camera to scan QR codes.
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanSuccess(data);
    // Reset scanned state after a short delay if the parent doesn't immediately unmount the scanner
    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanTarget} />
        <Text style={styles.hintText}>
          Align the container's QR code within the frame
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    width: "100%",
    maxWidth: 400,
    aspectRatio: 1,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  scanTarget: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#0D9488", // Teal secondary color
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  hintText: {
    color: "#FFF",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 32,
    fontSize: 13,
    fontWeight: "600",
  },
});

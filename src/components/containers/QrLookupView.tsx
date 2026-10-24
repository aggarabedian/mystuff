import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Divider,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAuth, useNotification } from "@/providers";
import { PrintLabelButton } from "@/components/common/PrintLabelButton";
import { QrScanner } from "@/components/containers/QrScanner";
import { ApiError, containersApi } from "@/lib/api/client";
import type { ContainerSummary } from "@/types/storage";

export function QrLookupView() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();

  const [qrCode, setQrCode] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [container, setContainer] = React.useState<ContainerSummary | null>(
    null,
  );
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const performLookup = async (code: string) => {
    if (!code.trim()) return;
    Keyboard.dismiss();

    try {
      setSearching(true);
      setHasSearched(true);
      const result = await containersApi.lookupByQr(code.trim());
      setContainer(result);
      setQrCode(code.trim());
    } catch (err) {
      setContainer(null);
      if (err instanceof ApiError) {
        showNotification(
          err.status === 404
            ? `No container found with QR code "${code.trim()}"`
            : err.message,
          "error",
        );
      } else {
        showNotification("Failed to lookup QR code", "error");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    performLookup(qrCode);
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    performLookup(decodedText);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIconBox,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialIcons
            name="qr-code-scanner"
            size={32}
            color={theme.colors.onPrimaryContainer}
          />
        </View>
        <Text variant="headlineMedium" style={styles.title}>
          Container QR Code Lookup
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Scan or input the unique QR code on any bin, tote, or box to inspect
          its details and type.
        </Text>
      </View>

      <Card style={styles.searchCard} mode="outlined">
        <Card.Content>
          <View style={styles.cameraToggle}>
            <Button
              mode={isScanning ? "outlined" : "contained"}
              buttonColor={isScanning ? undefined : theme.colors.secondary}
              icon={isScanning ? "close" : "camera"}
              onPress={() => setIsScanning(!isScanning)}
              style={styles.scanBtn}
            >
              {isScanning ? "Cancel Scanner" : "Scan with Camera"}
            </Button>
          </View>

          {isScanning && (
            <View style={styles.scannerContainer}>
              <QrScanner onScanSuccess={handleScanSuccess} />
            </View>
          )}

          <View style={styles.dividerRow}>
            <Divider style={styles.dividerLine} />
            <Text
              variant="labelSmall"
              style={[
                styles.dividerText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              OR ENTER MANUALLY
            </Text>
            <Divider style={styles.dividerLine} />
          </View>

          <View style={styles.manualEntryRow}>
            <TextInput
              mode="outlined"
              label="Container QR Code"
              placeholder="e.g. mystuff-123e4567..."
              value={qrCode}
              onChangeText={setQrCode}
              disabled={isScanning || searching}
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="qrcode-scan" />}
              onSubmitEditing={handleSearch}
            />
            <Button
              mode="contained"
              icon="magnify"
              disabled={searching || !qrCode.trim() || isScanning}
              loading={searching}
              onPress={handleSearch}
              style={styles.searchBtn}
              contentStyle={styles.searchBtnContent}
            >
              Search
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Results */}
      {container ? (
        <Surface
          style={[
            styles.resultCard,
            { borderColor: theme.colors.primaryContainer },
          ]}
          elevation={1}
        >
          <View style={styles.resultHeader}>
            <View style={styles.resultTitleRow}>
              <View
                style={[
                  styles.resultIconBox,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <MaterialIcons name="inventory" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
                  {container.name}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Created {new Date(container.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.resultBadges}>
              <Chip
                mode="flat"
                style={{ backgroundColor: theme.colors.primaryContainer }}
                textStyle={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: "bold",
                }}
              >
                {container.containerType}
              </Chip>
              {!!container.qrCode && (
                <PrintLabelButton qrCode={container.qrCode} />
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                UNIQUE QR IDENTIFIER
              </Text>
              <View
                style={[
                  styles.monoBox,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Text variant="bodySmall" style={styles.monoText}>
                  {container.qrCode}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                INTERNAL UUID
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.monoText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {container.id}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.resultFooter,
              { borderTopColor: theme.colors.outlineVariant },
            ]}
          >
            <Button
              mode="outlined"
              icon="door"
              onPress={() => router.push("/rooms")}
            >
              Browse Containing Room
            </Button>
          </View>
        </Surface>
      ) : hasSearched && !searching ? (
        <Surface
          style={[
            styles.notFoundCard,
            { borderColor: theme.colors.outlineVariant },
          ]}
          elevation={0}
        >
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            No container matched QR code{"\n"}
            <Text style={{ fontWeight: "bold" }}>
              &quot;{qrCode}&quot;
            </Text>
            .{"\n"}
            Verify the code and try again.
          </Text>
        </Surface>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40, alignItems: "center" },
  header: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
    maxWidth: 500,
  },
  headerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { textAlign: "center" },
  searchCard: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "#FFF",
    marginBottom: 32,
  },
  cameraToggle: { alignItems: "center", marginBottom: 24 },
  scanBtn: { minWidth: 200 },
  scannerContainer: { marginBottom: 24 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  dividerLine: { flex: 1 },
  dividerText: { marginHorizontal: 16, fontWeight: "bold", letterSpacing: 1 },
  manualEntryRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  textInput: { flex: 1, minWidth: 200, backgroundColor: "#FFF" },
  searchBtn: { justifyContent: "center" },
  searchBtnContent: { height: 50 },
  resultCard: {
    width: "100%",
    maxWidth: 600,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  resultHeader: { padding: 24 },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  resultIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  divider: { marginHorizontal: 24 },
  detailsList: { padding: 24, gap: 16 },
  detailItem: { gap: 4 },
  detailLabel: { fontWeight: "bold", letterSpacing: 0.5, color: "#64748B" },
  monoBox: { padding: 12, borderRadius: 8 },
  monoText: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  resultFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderStyle: "dashed",
    backgroundColor: "#F8FAFC",
  },
  notFoundCard: {
    width: "100%",
    maxWidth: 600,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
});

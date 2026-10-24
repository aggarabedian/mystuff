import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Divider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { searchApi } from "@/lib/api/client";
import { getStorageSearchResultLocation } from "@/lib/utils/storage-search";
import type { StorageSearchResult } from "@/types/storage";

interface SearchCommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export function SearchCommandPalette({
  visible,
  onClose,
}: SearchCommandPaletteProps) {
  const theme = useTheme();
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [results, setResults] = React.useState<StorageSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
    }
  };

  // Fast debounce for the command palette (150ms instead of 300ms)
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) return;

    let cancelled = false;
    const fetchQuickResults = async () => {
      setLoading(true);
      try {
        const res = await searchApi.search({ q, limit: 5, offset: 0 });
        if (!cancelled) {
          setResults(res.results);
        }
      } catch (error) {
        console.error("Quick search failed", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQuickResults();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelectResult = (result: StorageSearchResult) => {
    onClose();
    // Navigate based on type
    if (result.type === "shelf") {
      router.push({
        pathname: "/rooms/[id]",
        params: { id: result.location.room.id },
      });
    } else {
      router.push({
        pathname: "/rooms/[id]",
        params: {
          id: result.location.room.id,
          highlight: result.id,
        },
      });
    }
  };

  const handleSeeAll = () => {
    onClose();
    router.push({ pathname: "/search", params: { q: query.trim() } });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "item":
        return "category";
      case "container":
        return "all-inbox";
      case "shelf":
        return "table-rows";
      default:
        return "search";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.paletteContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              autoFocus
              mode="flat"
              placeholder="Jump to a room, box, or item..."
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSeeAll}
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              left={
                <TextInput.Icon
                  icon="magnify"
                  color={theme.colors.onSurfaceVariant}
                />
              }
              right={
                query.length > 0 ? (
                  <TextInput.Icon
                    icon="close-circle"
                    onPress={() => setQuery("")}
                  />
                ) : null
              }
            />
          </View>

          <Divider />

          {loading && results.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : results.length > 0 ? (
            <View style={styles.resultsList}>
              <Text
                variant="labelSmall"
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                QUICK MATCHES
              </Text>

              {results.map((result) => (
                <TouchableOpacity
                  key={`${result.type}-${result.id}`}
                  style={styles.resultItem}
                  onPress={() => handleSelectResult(result)}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <MaterialIcons
                      name={getIcon(result.type)}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text
                      variant="bodyLarge"
                      numberOfLines={1}
                      style={{ fontWeight: "600" }}
                    >
                      {result.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      numberOfLines={1}
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {getStorageSearchResultLocation(result)}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="subdirectory-arrow-left"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.seeAllBtn} onPress={handleSeeAll}>
                <Text
                  style={{ color: theme.colors.primary, fontWeight: "bold" }}
                >
                  See all results for &quot;{query.trim()}&quot;
                </Text>
              </TouchableOpacity>
            </View>
          ) : query.trim().length > 0 && !loading ? (
            <View style={styles.centerBox}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                No quick matches found.
              </Text>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 60 : 20, // Offset for safe area
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  paletteContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: "80%",
  },
  inputWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  input: {
    height: 56,
    fontSize: 16,
  },
  centerBox: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  resultsList: {
    paddingVertical: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextContainer: {
    flex: 1,
  },
  seeAllBtn: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 8,
  },
});

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper";

import type { StorageSearchResult } from "@/types/storage";

interface SearchResultCardProps {
  result: StorageSearchResult;
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const getIcon = () => {
    switch (result.type) {
      case "item":
        return "category";
      case "container":
        return "all-inbox";
      case "shelf":
        return "table-rows";
      case "room":
        return "meeting-room";
      default:
        return "search";
    }
  };

  const getUrl = () => {
    switch (result.type) {
      case "room":
      case "shelf":
        return `/rooms/${result.roomId}`;
      case "container":
      case "item":
        return `/rooms/${result.roomId}?highlight=${result.id}`;
      default:
        return "/rooms";
    }
  };

  const getTypeLabel = () => {
    switch (result.type) {
      case "item":
        return "Item";
      case "container":
        return "Container";
      case "shelf":
        return "Shelf";
      case "room":
        return "Room";
      default:
        return "Result";
    }
  };

  return (
    <Card style={styles.card} mode="outlined">
      <TouchableRipple
        onPress={() => router.push(getUrl() as any)}
        style={styles.touchArea}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <MaterialIcons
              name={getIcon()}
              size={24}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text
                variant="labelSmall"
                style={[styles.typeBadge, { color: theme.colors.secondary }]}
              >
                {getTypeLabel()}
              </Text>
              {result.quantity !== undefined && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Qty: {result.quantity}
                </Text>
              )}
            </View>

            <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
              {result.name}
            </Text>

            <View style={styles.pathRow}>
              <MaterialIcons
                name="place"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodySmall"
                style={[
                  styles.pathText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {result.path}
              </Text>
            </View>

            {!!result.description && (
              <Text
                variant="bodySmall"
                style={[
                  styles.description,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
              >
                {result.description}
              </Text>
            )}
          </View>

          <MaterialIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </TouchableRipple>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  touchArea: {
    padding: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontWeight: "bold",
  },
  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pathText: {
    flex: 1,
  },
  description: {
    marginTop: 4,
    fontStyle: "italic",
  },
});

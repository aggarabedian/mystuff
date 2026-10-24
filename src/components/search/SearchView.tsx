import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

import { useAuth, useNotification } from "@/app/providers";
import { ApiError, searchApi } from "@/lib/api/client";
import type {
  StorageSearchResult,
  StorageSearchResultType,
} from "@/types/storage";

// We will translate these two dependency components next
import { SearchFilters } from "./SearchFilters";
import { SearchResultCard } from "./SearchResultCard";

interface SearchViewProps {
  initialQuery?: string;
  initialTypes?: StorageSearchResultType[];
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

function ResultSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.skeletonContainer,
        { borderColor: theme.colors.outlineVariant },
      ]}
    >
      <View style={styles.skeletonRow}>
        <View
          style={[
            styles.skeletonBlock,
            {
              width: 70,
              height: 24,
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        />
        <View
          style={[
            styles.skeletonBlock,
            {
              width: "55%",
              height: 22,
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.skeletonBlock,
          {
            width: "80%",
            height: 18,
            backgroundColor: theme.colors.surfaceVariant,
          },
        ]}
      />
      <View
        style={[
          styles.skeletonBlock,
          {
            width: "45%",
            height: 16,
            backgroundColor: theme.colors.surfaceVariant,
            marginTop: 4,
          },
        ]}
      />
    </View>
  );
}

export function SearchView({
  initialQuery = "",
  initialTypes = [],
}: SearchViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { user, loading: authLoading } = useAuth();

  const [query, setQuery] = React.useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery);
  const [selectedTypes, setSelectedTypes] =
    React.useState<StorageSearchResultType[]>(initialTypes);

  const [results, setResults] = React.useState<StorageSearchResult[]>([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(!!initialQuery.trim());

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  // Debounce the query input
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Fire search when debounced query or types change
  React.useEffect(() => {
    if (!user) return;
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setHasMore(false);
      setOffset(0);
      setHasSearched(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchApi.search({
          q,
          types: selectedTypes.length > 0 ? selectedTypes : undefined,
          limit: PAGE_SIZE,
          offset: 0,
        });
        if (cancelled) return;
        setResults(res.results);
        setHasMore(res.hasMore);
        setOffset(res.offset + res.results.length);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 400) {
          setResults([]);
          setHasMore(false);
        } else {
          showNotification("Search failed. Please try again.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, selectedTypes, user]);

  const handleLoadMore = async () => {
    const q = debouncedQuery.trim();
    if (!q || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await searchApi.search({
        q,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setResults((prev) => [...prev, ...res.results]);
      setHasMore(res.hasMore);
      setOffset(res.offset + res.results.length);
    } catch {
      showNotification("Failed to load more results.", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTypesChange = (types: StorageSearchResultType[]) => {
    setSelectedTypes(types);
    setOffset(0);
  };

  const trimmedQuery = debouncedQuery.trim();

  if (authLoading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headlineMedium" style={styles.title}>
        Search
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        Find items, containers, and shelves across all your storage rooms.
      </Text>

      <TextInput
        mode="outlined"
        placeholder="Search for anything…"
        value={query}
        onChangeText={setQuery}
        autoFocus={!initialQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
        left={<TextInput.Icon icon="magnify" />}
        right={
          loading ? (
            <TextInput.Icon icon={() => <ActivityIndicator size={16} />} />
          ) : null
        }
        style={styles.searchInput}
      />

      <View style={styles.filtersContainer}>
        <SearchFilters
          selected={selectedTypes}
          onChange={handleTypesChange}
          disabled={loading}
        />
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />

      {loading ? (
        <View style={styles.resultsList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ResultSkeleton key={i} />
          ))}
        </View>
      ) : !hasSearched ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="explore"
            size={64}
            color={theme.colors.surfaceVariant}
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Start typing to search
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptyDesc, { color: theme.colors.onSurfaceVariant }]}
          >
            Search across items, containers, and shelves in all your rooms.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="search-off"
            size={64}
            color={theme.colors.surfaceVariant}
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No results for "{trimmedQuery}"
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptyDesc, { color: theme.colors.onSurfaceVariant }]}
          >
            Try different keywords, or check your spelling.
          </Text>
        </View>
      ) : (
        <>
          <Text
            variant="labelMedium"
            style={[
              styles.resultCount,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {results.length} result{results.length !== 1 ? "s" : ""}
            {hasMore ? "+" : ""} for "{trimmedQuery}"
          </Text>

          <View style={styles.resultsList}>
            {results.map((result) => (
              <SearchResultCard
                key={`${result.type}-${result.id}`}
                result={result}
              />
            ))}
          </View>

          {hasMore && (
            <Button
              mode="outlined"
              onPress={handleLoadMore}
              disabled={loadingMore}
              loading={loadingMore}
              style={styles.loadMoreBtn}
            >
              {loadingMore ? "Loading…" : "Load more results"}
            </Button>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: {
    padding: 16,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
  },
  title: { fontWeight: "bold", marginBottom: 4 },
  subtitle: { marginBottom: 24 },
  searchInput: { backgroundColor: "#FFF", marginBottom: 16 },
  filtersContainer: { marginBottom: 24 },
  divider: { height: 1, marginBottom: 24 },
  resultsList: { gap: 12, paddingBottom: 16 },
  skeletonContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  skeletonRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  skeletonBlock: { borderRadius: 4 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 16 },
  emptyTitle: { fontWeight: "bold", color: "#64748B" },
  emptyDesc: { textAlign: "center", maxWidth: 300 },
  resultCount: {
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadMoreBtn: { alignSelf: "center", marginTop: 16, minWidth: 200 },
});

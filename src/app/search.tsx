import { useLocalSearchParams } from "expo-router";

import { SearchView } from "@/components/search/SearchView";

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const initialQuery = Array.isArray(q) ? q[0] : q;

  return <SearchView initialQuery={initialQuery} />;
}

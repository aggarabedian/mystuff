import type { StorageSearchResultType } from "@/types/storage";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, useTheme } from "react-native-paper";

interface SearchFiltersProps {
  selected: StorageSearchResultType[];
  onChange: (types: StorageSearchResultType[]) => void;
  disabled?: boolean;
}

const FILTER_OPTIONS: { label: string; value: StorageSearchResultType }[] = [
  { label: "Items", value: "item" },
  { label: "Containers", value: "container" },
  { label: "Shelves", value: "shelf" },
];

export function SearchFilters({
  selected,
  onChange,
  disabled,
}: SearchFiltersProps) {
  const theme = useTheme();

  const handleToggle = (value: StorageSearchResultType) => {
    if (disabled) return;
    if (selected.includes(value)) {
      onChange(selected.filter((t) => t !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Chip
              key={option.value}
              mode={isSelected ? "flat" : "outlined"}
              selected={isSelected}
              onPress={() => handleToggle(option.value)}
              disabled={disabled}
              style={[
                styles.chip,
                isSelected && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              textStyle={[
                styles.chipText,
                isSelected && {
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: "bold",
                },
              ]}
              showSelectedCheck={false}
            >
              {option.label}
            </Chip>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
  },
});

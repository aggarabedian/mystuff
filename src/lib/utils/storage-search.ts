import type { StorageSearchResult } from "@/types/storage";

export function getStorageSearchResultLocation(
  result: StorageSearchResult,
): string {
  const { room, shelf, row, containerPath } = result.location;
  return [
    room.name,
    shelf?.name,
    row ? (row.label || `Row ${row.rowNumber}`) : undefined,
    ...(containerPath ?? []),
  ]
    .filter(Boolean)
    .join(" › ");
}

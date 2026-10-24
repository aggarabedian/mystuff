/**
 * Domain Types for myStuff Storage Application
 * Based on frontend-api-contract.md
 */

export type ContainerType = "Box" | "Bin" | "Bag" | "Tote" | "Drawer";

export const CONTAINER_TYPES: readonly ContainerType[] = [
  "Box",
  "Bin",
  "Bag",
  "Tote",
  "Drawer",
] as const;

/**
 * Backend database user shape (from tree response)
 */
export interface User {
  id: string;
  auth0Sub: string;
  email?: string;
  name?: string;
  createdAt: string;
}

/**
 * Auth0 profile returned by GET /me
 */
export interface Auth0Profile {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Application profile returned by GET /api/profile and PATCH /api/profile
 */
export interface UserProfile {
  id: string;
  email?: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

/**
 * Nested Item inside a ShelfRow or Container
 */
export interface NestedItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  photoUrl?: string;
  createdAt: string;
}

/**
 * Nested Container (can contain child containers and items)
 */
export interface NestedContainer {
  id: string;
  name: string;
  containerType: ContainerType;
  qrCode?: string;
  containers: NestedContainer[];
  items: NestedItem[];
  createdAt: string;
}

/**
 * Nested Shelf Row inside a Shelf
 */
export interface NestedShelfRow {
  id: string;
  rowNumber: number;
  label?: string;
  containers: NestedContainer[];
  items: NestedItem[];
  createdAt: string;
}

/**
 * Nested Shelf inside a Room
 */
export interface NestedShelf {
  id: string;
  name: string;
  rows: NestedShelfRow[];
  createdAt: string;
}

/**
 * Nested Room containing full shelf hierarchy
 */
export interface NestedRoom {
  id: string;
  name: string;
  description?: string;
  shelves: NestedShelf[];
  createdAt: string;
}

/**
 * Full room hierarchy response from GET /api/rooms/{roomId}/tree
 */
export interface NestedStorageTreeResponse {
  user: User;
  room: NestedRoom;
}

/**
 * Room Summary returned by GET /api/rooms
 */
export interface RoomSummary {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

/**
 * Shelf Summary returned by POST /api/rooms/{roomId}/shelves and PATCH /api/shelves/{shelfId}
 */
export interface ShelfSummary {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Shelf Row Summary returned by POST /api/shelves/{shelfId}/rows and PATCH /api/shelf-rows/{rowId}
 */
export interface ShelfRowSummary {
  id: string;
  rowNumber: number;
  label?: string;
  createdAt: string;
}

/**
 * Container Summary (e.g. from QR lookup or container creation)
 */
export interface ContainerSummary {
  id: string;
  name: string;
  containerType: ContainerType;
  qrCode?: string;
  createdAt: string;
}

/**
 * Item Summary returned by item creation / update
 */
export interface ItemSummary {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  photoUrl?: string;
  createdAt: string;
}

/* =========================================================================
   Mutation Input Payloads
   ========================================================================= */

export interface CreateRoomInput {
  name: string;
  description?: string;
}

export interface UpdateRoomInput {
  name?: string;
  description?: string | null;
}

export interface CreateShelfInput {
  name: string;
}

export interface UpdateShelfInput {
  name: string;
}

export interface CreateShelfRowInput {
  rowNumber: number;
  label?: string;
}

export interface UpdateShelfRowInput {
  rowNumber?: number;
  label?: string | null;
}

export interface CreateContainerInput {
  name: string;
  containerType: ContainerType;
}

export interface UpdateContainerInput {
  name?: string;
  containerType?: ContainerType;
}

export type MoveContainerInput =
  | { shelfRowId: string; parentContainerId?: never }
  | { parentContainerId: string; shelfRowId?: never };

export interface CreateItemInput {
  name: string;
  quantity: number;
  description?: string;
  photoUrl?: string;
}

export interface UpdateItemInput {
  name?: string;
  quantity?: number;
  description?: string | null;
  photoUrl?: string | null;
}

export type MoveItemInput =
  | { shelfRowId: string; parentContainerId?: never }
  | { parentContainerId: string; shelfRowId?: never };

/* =========================================================================
   Search Types
   ========================================================================= */

export type StorageSearchResultType = "item" | "container" | "shelf";

export interface StorageSearchResult {
  type: StorageSearchResultType;
  id: string;
  name: string;
  description?: string;
  location: {
    room: { id: string; name: string };
    shelf?: { id: string; name: string };
    row?: { id: string; rowNumber: number; label?: string };
    containerPath?: string[];
  };
}

export interface StorageSearchResponse {
  results: StorageSearchResult[];
  hasMore: boolean;
  limit: number;
  offset: number;
}

export interface SearchParams {
  q: string;
  types?: StorageSearchResultType[];
  limit?: number;
  offset?: number;
}

/* =========================================================================
   Backend API Errors
   ========================================================================= */

export type ApiErrorCode =
  | "not_authenticated"
  | "storage_database_not_configured"
  | "container_move_would_create_cycle"
  | "row_number_already_exists"
  | string;

export interface ApiErrorResponse {
  error: ApiErrorCode;
  message?: string;
}

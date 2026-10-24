import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type {
  Auth0Profile,
  ContainerSummary,
  CreateContainerInput,
  CreateItemInput,
  CreateRoomInput,
  CreateShelfInput,
  CreateShelfRowInput,
  ItemSummary,
  NestedStorageTreeResponse,
  RoomSummary,
  SearchParams,
  ShelfRowSummary,
  ShelfSummary,
  StorageSearchResponse,
  UpdateContainerInput,
  UpdateItemInput,
  UpdateProfileInput,
  UpdateRoomInput,
  UpdateShelfInput,
  UpdateShelfRowInput,
  UserProfile,
} from "@/types/storage";

// Resolve the backend URL via environment variables.
// For local development, this would be something like http://192.168.1.x:3000
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://your-production-backend.com";

export class ApiError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.name = "ApiError";
  }
}

export function buildApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = buildApiUrl(path);

  // React Native's fetch automatically handles storing and sending cookies,
  // just like the web browser, so your Next.js auth cookies will work!
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    let errorCode;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.errorCode;
    } catch {
      // Fallback if the response isn't JSON
    }
    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Native Auth0 redirect handling using Expo WebBrowser.
 * This opens a secure modal window for the user to log in,
 * then catches the redirect back to the app's custom URL scheme.
 */
export async function navigateToAuth(type: "login" | "logout" | "signup") {
  // Create a deep link back to the app (e.g., mystuff://)
  const returnUrl = Linking.createURL("/");

  // Construct the URL to your Next.js backend's auth route, appending the deep link
  const authUrl = buildApiUrl(
    `/api/auth/${type}?returnTo=${encodeURIComponent(returnUrl)}`,
  );

  // Open the secure auth session natively
  await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
}

// --- API Service Objects ---

export const authApi = {
  getMe: () => apiFetch<Auth0Profile>("/api/auth/me"),
};

export const profileApi = {
  get: () => apiFetch<UserProfile>("/api/profile"),
  update: (data: UpdateProfileInput) =>
    apiFetch<UserProfile>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const roomsApi = {
  list: () => apiFetch<RoomSummary[]>("/api/rooms"),
  getTree: (id: string) =>
    apiFetch<NestedStorageTreeResponse>(`/api/rooms/${id}/tree`),
  create: (data: CreateRoomInput) =>
    apiFetch<RoomSummary>("/api/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateRoomInput) =>
    apiFetch<RoomSummary>(`/api/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/rooms/${id}`, { method: "DELETE" }),
};

export const shelvesApi = {
  create: (roomId: string, data: CreateShelfInput) =>
    apiFetch<ShelfSummary>(`/api/rooms/${roomId}/shelves`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateShelfInput) =>
    apiFetch<ShelfSummary>(`/api/shelves/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/shelves/${id}`, { method: "DELETE" }),
};

export const shelfRowsApi = {
  create: (shelfId: string, data: CreateShelfRowInput) =>
    apiFetch<ShelfRowSummary>(`/api/shelves/${shelfId}/rows`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateShelfRowInput) =>
    apiFetch<ShelfRowSummary>(`/api/shelf-rows/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/shelf-rows/${id}`, { method: "DELETE" }),
};

export const containersApi = {
  lookupByQr: (qrCode: string) =>
    apiFetch<ContainerSummary>(
      `/api/containers/qr/${encodeURIComponent(qrCode)}`,
    ),
  createOnRow: (rowId: string, data: CreateContainerInput) =>
    apiFetch<ContainerSummary>(`/api/shelf-rows/${rowId}/containers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createNested: (parentId: string, data: CreateContainerInput) =>
    apiFetch<ContainerSummary>(`/api/containers/${parentId}/containers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateContainerInput) =>
    apiFetch<ContainerSummary>(`/api/containers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/containers/${id}`, { method: "DELETE" }),
};

export const itemsApi = {
  createOnRow: (rowId: string, data: CreateItemInput) =>
    apiFetch<ItemSummary>(`/api/shelf-rows/${rowId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createInContainer: (containerId: string, data: CreateItemInput) =>
    apiFetch<ItemSummary>(`/api/containers/${containerId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateItemInput) =>
    apiFetch<ItemSummary>(`/api/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/items/${id}`, { method: "DELETE" }),
};

export const searchApi = {
  search: (params: SearchParams) => {
    const searchParams = new URLSearchParams();
    searchParams.append("q", params.q);
    if (params.types)
      params.types.forEach((t) => searchParams.append("types", t));
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.offset) searchParams.append("offset", params.offset.toString());

    return apiFetch<StorageSearchResponse>(
      `/api/search?${searchParams.toString()}`,
    );
  },
};

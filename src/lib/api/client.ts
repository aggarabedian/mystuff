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
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Resolve the backend URL via environment variables.
// For local development, this would be something like http://192.168.1.x:3000
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.6:5000";
const AUTH_TOKEN_KEY = "mystuff_mobile_access_token";
let cachedAuthToken: string | null | undefined;

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

async function getAuthToken(): Promise<string | null> {
  if (cachedAuthToken !== undefined) return cachedAuthToken;
  if (Platform.OS === "web") {
    cachedAuthToken = null;
    return cachedAuthToken;
  }
  const SecureStore = await import("expo-secure-store");
  cachedAuthToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return cachedAuthToken;
}

async function saveAuthToken(token: string): Promise<void> {
  if (Platform.OS !== "web") {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  }
  cachedAuthToken = token;
}

async function clearAuthToken(): Promise<void> {
  if (Platform.OS !== "web") {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }
  cachedAuthToken = null;
}

async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = buildApiUrl(path);
  const authToken = await getAuthToken();
  const headers = new Headers(options.headers);

  if (options.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

async function throwApiError(response: Response): Promise<void> {
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
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await authenticatedFetch(path, options);
  await throwApiError(response);

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function apiFetchBytes(path: string): Promise<Uint8Array> {
  const response = await authenticatedFetch(path);
  await throwApiError(response);
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Starts the backend's Auth0 flow and returns to this app's deep link.
 */
export async function navigateToAuth(type: "login" | "logout" | "signup") {
  const returnUrl = Linking.createURL("/");

  const authUrl = buildApiUrl(
    `/auth/${type}?returnTo=${encodeURIComponent(returnUrl)}`,
  );

  const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
  if (result.type !== "success") return false;

  if (type === "logout") {
    await clearAuthToken();
    return true;
  }

  if (Platform.OS === "web") return true;
  if (!result.url) {
    throw new Error("Sign-in completed without returning an app URL.");
  }

  const callbackUrl = new URL(result.url);
  const expectedUrl = new URL(returnUrl);
  if (
    callbackUrl.protocol !== expectedUrl.protocol ||
    callbackUrl.host !== expectedUrl.host ||
    callbackUrl.pathname !== expectedUrl.pathname
  ) {
    throw new Error("Sign-in returned to an unexpected app URL.");
  }

  const code = callbackUrl.searchParams.get("authCode");
  if (!code) throw new Error("Sign-in returned without an exchange code.");

  const tokenResult = await apiFetch<{ token: string }>(
    "/auth/mobile/exchange",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
  );
  if (!tokenResult.token) throw new Error("Sign-in did not return an app token.");
  await saveAuthToken(tokenResult.token);
  return true;
}

// --- API Service Objects ---

export const authApi = {
  getMe: () => apiFetch<Auth0Profile>("/me"),
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
      method: "PATCH",
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
      method: "PATCH",
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
      method: "PATCH",
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
      method: "PATCH",
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
      method: "PATCH",
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

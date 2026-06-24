const API_BASE = "/api";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  cameras: {
    list: () => request<unknown[]>("/cameras"),
    get: (id: string) => request<unknown>(`/cameras/${id}`),
    create: (data: unknown) =>
      request<unknown>("/cameras", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/cameras/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/cameras/${id}`, { method: "DELETE" }),
    statusCount: () => request<unknown>("/cameras/status-count"),
  },
  events: {
    list: (params?: string) =>
      request<unknown[]>(`/events${params ? `?${params}` : ""}`),
    count: () => request<number>("/events/count"),
    get: (id: string) => request<unknown>(`/events/${id}`),
  },
  alerts: {
    list: (params?: string) =>
      request<unknown[]>(`/alerts${params ? `?${params}` : ""}`),
    acknowledge: (id: string) =>
      request<unknown>(`/alerts/${id}/acknowledge`, { method: "PATCH" }),
  },
  users: {
    list: () => request<unknown[]>("/users"),
  },
};

import { ActivityType, EmissionFactor, FactorStatus } from "../types";

const API_BASE = "http://localhost:8000/api/v1/emission-factors";

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API request failed");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export interface EmissionFactorPayload {
  factor_code: string;
  name: string;
  activity_type: ActivityType;
  unit: string;
  co2e_per_unit: number;
  source?: string;
  effective_start: string;
}

export interface EmissionFactorUpdatePayload {
  name?: string;
  activity_type?: ActivityType;
  unit?: string;
  co2e_per_unit?: number;
  source?: string;
  effective_start?: string;
  effective_end?: string;
  status?: FactorStatus;
}

export const emissionFactorsApi = {
  list: (filters?: { activity_type?: ActivityType; status?: FactorStatus }) => {
    const params = new URLSearchParams();
    if (filters?.activity_type) params.set("activity_type", filters.activity_type);
    if (filters?.status) params.set("status", filters.status);
    const query = params.toString();
    return fetchApi<EmissionFactor[]>(query ? `?${query}` : "");
  },
  create: (payload: EmissionFactorPayload) =>
    fetchApi<EmissionFactor>("", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: EmissionFactorUpdatePayload) =>
    fetchApi<EmissionFactor>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deactivate: (id: number) =>
    fetchApi<EmissionFactor>(`/${id}/deactivate`, { method: "POST" }),
  reactivate: (id: number) =>
    fetchApi<EmissionFactor>(`/${id}/reactivate`, { method: "POST" }),
  remove: (id: number) => fetchApi<void>(`/${id}`, { method: "DELETE" }),
};

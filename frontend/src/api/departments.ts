import { Department } from "../types";

const API_BASE = "http://localhost:8000/api/v1/departments";

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
  return response.json();
}

export const departmentsApi = {
  list: () => fetchApi<Department[]>(""),
};

/**
 * Frontend API client for Carbon Analytics endpoints (issue #11).
 */

export interface MonthlyEmissionPoint {
  month: string;
  month_num: number;
  year: number;
  total_co2e: number;
  transaction_count: number;
}

export interface SourceBreakdownItem {
  source_type: string;
  total_co2e: number;
  transaction_count: number;
}

const API_BASE = "http://localhost:8000/api/v1/carbon-analytics";

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API request failed");
  }
  return response.json();
}

export const carbonAnalyticsApi = {
  emissionsTrend: (year?: number) => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    const query = params.toString();
    return fetchApi<MonthlyEmissionPoint[]>(
      `/emissions-trend${query ? `?${query}` : ""}`
    );
  },

  sourceBreakdown: (filters?: { year?: number; date_from?: string; date_to?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.set("year", String(filters.year));
    if (filters?.date_from) params.set("date_from", filters.date_from);
    if (filters?.date_to) params.set("date_to", filters.date_to);
    const query = params.toString();
    return fetchApi<SourceBreakdownItem[]>(
      `/source-breakdown${query ? `?${query}` : ""}`
    );
  },
};

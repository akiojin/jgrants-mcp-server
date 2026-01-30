import { API_BASE_URL } from "../config.js";
import type { SubsidiesResponse, SubsidyDetailResponse } from "./types.js";

export type SearchParams = {
  keyword?: string;
  sort?: "created_date" | "acceptance_start_datetime" | "acceptance_end_datetime";
  order?: "ASC" | "DESC";
  acceptance?: 0 | 1;
  use_purpose?: string;
  industry?: string;
  target_number_of_employees?: string;
  target_area_search?: string;
};

const DEFAULT_KEYWORD = "事業";
const DEFAULT_SORT = "created_date";
const DEFAULT_ORDER = "DESC";
const DEFAULT_ACCEPTANCE = 1;

export function normalizeKeyword(keyword?: string): string {
  if (!keyword) return DEFAULT_KEYWORD;
  const trimmed = keyword.trim();
  if (trimmed.length < 2) return DEFAULT_KEYWORD;
  return trimmed;
}

export function buildSubsidiesQuery(params: SearchParams): URLSearchParams {
  const query = new URLSearchParams();

  query.set("keyword", normalizeKeyword(params.keyword));
  query.set("sort", params.sort ?? DEFAULT_SORT);
  query.set("order", params.order ?? DEFAULT_ORDER);
  query.set("acceptance", String(params.acceptance ?? DEFAULT_ACCEPTANCE));

  if (params.use_purpose) query.set("use_purpose", params.use_purpose);
  if (params.industry) query.set("industry", params.industry);
  if (params.target_number_of_employees) {
    query.set("target_number_of_employees", params.target_number_of_employees);
  }
  if (params.target_area_search) {
    query.set("target_area_search", params.target_area_search);
  }

  return query;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`J-Grants API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export async function fetchSubsidies(
  params: SearchParams,
  baseUrl: string = API_BASE_URL
): Promise<SubsidiesResponse> {
  const query = buildSubsidiesQuery(params);
  const url = `${baseUrl}/subsidies?${query.toString()}`;
  return fetchJson<SubsidiesResponse>(url);
}

export async function fetchSubsidyDetail(
  id: string,
  baseUrl: string = API_BASE_URL
): Promise<SubsidyDetailResponse> {
  const encoded = encodeURIComponent(id);
  const url = `${baseUrl}/subsidies/id/${encoded}`;
  return fetchJson<SubsidyDetailResponse>(url);
}

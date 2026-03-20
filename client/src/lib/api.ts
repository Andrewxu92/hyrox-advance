/**
 * 统一前端 API 基址与错误文案（与 README / .env.example 中 VITE_API_URL 说明一致）。
 * 本地开发：通常留空，由 Vite proxy 把 /api 转到后端。
 */

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';
}

export function getFetchErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return '未知错误';
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

/** 约定响应 JSON 含 success；成功时常带 data */
export async function fetchApi<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, init);
    const json = (await res.json()) as { success?: boolean; error?: string; data?: T };
    if (!res.ok) {
      return { ok: false, error: json.error || `HTTP ${res.status}`, status: res.status };
    }
    if (json.success === false) {
      return { ok: false, error: json.error || '请求失败', status: res.status };
    }
    return { ok: true, data: json.data as T };
  } catch (e) {
    return { ok: false, error: getFetchErrorMessage(e) };
  }
}

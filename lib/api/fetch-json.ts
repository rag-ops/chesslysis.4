export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();
  let payload: unknown = null;
  if (text.trim()) {
    try { payload = JSON.parse(text); }
    catch {
      throw new ApiError(response.ok ? "Server returned an invalid response." : `Request failed (${response.status}).`, response.status);
    }
  }
  if (!response.ok) {
    const object = payload && typeof payload === "object" ? payload as { error?: unknown; message?: unknown; code?: unknown } : {};
    const message = typeof object.error === "string" ? object.error : typeof object.message === "string" ? object.message : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, typeof object.code === "string" ? object.code : undefined);
  }
  if (payload === null) throw new ApiError("Server returned an empty response.", response.status);
  return payload as T;
}

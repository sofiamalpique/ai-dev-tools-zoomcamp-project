const DEFAULT_API_BASE_URL = "http://localhost:8000";
const DEFAULT_MCP_BASE_URL = "http://localhost:8001";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
);
export const MCP_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_MCP_BASE_URL ?? DEFAULT_MCP_BASE_URL
);

type JsonValue = unknown;

const parseJson = async (response: Response): Promise<JsonValue> => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const buildUrl = (baseUrl: string, path: string) => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizeBaseUrl(baseUrl)}${safePath}`;
};

export const createJsonClient = (baseUrl: string) => {
  const request = async <T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetch(buildUrl(baseUrl, path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
    const data = await parseJson(response);

    if (!response.ok) {
      const detail =
        typeof data === "object" &&
          data !== null &&
          "detail" in data &&
          typeof (data as { detail?: unknown }).detail === "string"
          ? (data as { detail: string }).detail
          : null;
      const message =
        detail ||
        (typeof data === "string" ? data : null) ||
        response.statusText ||
        "Request failed. Please try again.";
      throw new Error(message);
    }

    return data as T;
  };

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
  };
};

export const backendClient = createJsonClient(API_BASE_URL);
export const mcpClient = createJsonClient(MCP_BASE_URL);

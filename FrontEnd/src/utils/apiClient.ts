import { API_URL } from "../config/api";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const REDIRECT_KEY = "auth_redirecting";

function isRedirecting(): boolean {
  return sessionStorage.getItem(REDIRECT_KEY) === "true";
}

function setRedirecting(value: boolean): void {
  if (value) {
    sessionStorage.setItem(REDIRECT_KEY, "true");
  } else {
    sessionStorage.removeItem(REDIRECT_KEY);
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  if (isRedirecting()) {
    return false;
  }

  if (window.location.pathname === "/login") {
    return false;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      console.log("🔄 Attempting to refresh token...");
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("✅ Token refresh successful");
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || "Token refresh failed";
        console.error("❌ Token refresh failed:", errorMessage);

        if (!isRedirecting() && window.location.pathname !== "/login") {
          setRedirecting(true);
          console.log("🔄 Redirecting to login page...");
          window.location.href = "/login";
        }
        return false;
      }
    } catch (error) {
      console.error("❌ Token refresh error:", error);
      if (!isRedirecting() && window.location.pathname !== "/login") {
        setRedirecting(true);
        console.log("🔄 Redirecting to login page due to error...");
        window.location.href = "/login";
      }
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const isAuthCheck =
    endpoint === "/protected" || endpoint.includes("/protected");

  if (isRedirecting() && !isAuthCheck) {
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  }

  if (window.location.pathname === "/login" && !isAuthCheck) {
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...options.headers,
  };

  if (
    !isFormData &&
    !(options.headers as Record<string, string>)?.["Content-Type"]
  ) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  let response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed && !isRedirecting()) {
      response = await fetch(url, {
        ...options,
        credentials: "include",
        headers,
      });

      if (
        response.status === 401 &&
        !isRedirecting() &&
        window.location.pathname !== "/login"
      ) {
        setRedirecting(true);
        window.location.href = "/login";
      }
    }
  }

  return response;
}

export function clearRedirectFlag(): void {
  setRedirecting(false);
}

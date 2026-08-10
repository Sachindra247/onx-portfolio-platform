import type { AuthUser, LoginResponse } from "../types/auth";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function buildUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(buildUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to sign in."));
  }

  return response.json() as Promise<LoginResponse>;
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  const response = await fetch(buildUrl("/api/auth/me"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Your session is no longer valid.");
  }

  return response.json() as Promise<AuthUser>;
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const result = (await response.json()) as {
      message?: string;
      title?: string;
    };

    return result.message ?? result.title ?? fallback;
  } catch {
    return fallback;
  }
}

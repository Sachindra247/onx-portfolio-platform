export const TOKEN_STORAGE_KEY = "onx-portfolio-access-token";

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

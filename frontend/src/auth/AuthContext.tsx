import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCurrentUser, login as loginRequest } from "../api/authApi";

import type { AuthUser } from "../types/auth";

import { TOKEN_STORAGE_KEY } from "./authStorage";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );

  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);

    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      if (!accessToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(accessToken);

        setUser(currentUser);
      } catch {
        logout();
      } finally {
        setIsInitializing(false);
      }
    }

    void restoreSession();
  }, [accessToken, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);

    localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);

    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isInitializing,
      login,
      logout,
    }),
    [user, accessToken, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

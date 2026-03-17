import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (currentPw: string, newPw: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "rk_auth_session";
const PW_STORAGE_KEY = "rk_admin_pw";
const DEFAULT_PASS = "royal2025";

function getPassword(): string {
  return localStorage.getItem(PW_STORAGE_KEY) || DEFAULT_PASS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });

  const login = useCallback((password: string): boolean => {
    if (password === getPassword()) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const changePassword = useCallback((currentPw: string, newPw: string): boolean => {
    if (currentPw !== getPassword()) return false;
    localStorage.setItem(PW_STORAGE_KEY, newPw);
    return true;
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

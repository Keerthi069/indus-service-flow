import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { db, type Role, type User } from "@/lib/mock/db";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  isHydrated: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, login: () => null, logout: () => {}, isHydrated: false });

const KEY = "isf_session_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user, isHydrated,
    login: (email, password) => {
      const u = db.all("users").find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.status === "active");
      if (u) {
        setUser(u);
        localStorage.setItem(KEY, JSON.stringify(u));
        db.insert("audit_logs", {
          id: `log_${Date.now()}`, organization_id: u.organization_id, user_id: u.id,
          user_name: u.name, action: "LOGIN", entity: "User", details: `${u.name} signed in`, created_at: new Date().toISOString(),
        });
        return u;
      }
      return null;
    },
    logout: () => {
      if (user) {
        db.insert("audit_logs", {
          id: `log_${Date.now()}`, organization_id: user.organization_id, user_id: user.id,
          user_name: user.name, action: "LOGOUT", entity: "User", details: `${user.name} signed out`, created_at: new Date().toISOString(),
        });
      }
      setUser(null);
      localStorage.removeItem(KEY);
    },
  }), [user, isHydrated]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }

export function rolePortalPath(role: Role): string {
  switch (role) {
    case "super_admin": return "/super-admin";
    case "org_admin": return "/org-admin";
    case "employee": return "/employee";
    case "customer": return "/customer";
  }
}

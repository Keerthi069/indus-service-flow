"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { db, findUserByIdentifier, type Role, type User } from "@/lib/mock/db";

interface AuthCtx {
  user: User | null;
  // `identifier` accepts either the account's email OR its username.
  login: (identifier: string, password: string) => User | null;
  logout: () => void;
  isHydrated: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, login: () => null, logout: () => {}, isHydrated: false });

const KEY = "isf_session_v1";

// Matches the display labels already used throughout seed.ts
// (ORG_ADMIN_ACTIONS_SEED uses "Org Admin", EMPLOYEE_ACTIONS_SEED uses
// "Employee") so a live login/logout entry looks identical to a seeded
// one for the same person, instead of silently falling back to
// "Employee" for everyone regardless of their real role.
function roleLabel(role: Role): string {
  switch (role) {
    case "super_admin": return "Super Admin";
    case "org_admin": return "Org Admin";
    case "employee": return "Employee";
  }
}

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
    login: (identifier, password) => {
      const candidate = findUserByIdentifier(identifier, db.all("users"));
      const u = candidate && candidate.password === password && candidate.status === "active" ? candidate : null;
      if (u) {
        setUser(u);
        localStorage.setItem(KEY, JSON.stringify(u));
        const details = `${u.name} signed in`;
        const createdAt = new Date().toISOString();
        db.insert("audit_logs", {
          id: `log_${Date.now()}`,
          organization_id: u.organization_id,
          user_id: u.id,
          user_name: u.name,
          role: roleLabel(u.role),
          action: "LOGIN",
          entity: "Session",
          module_name: "Session",
          details,
          description: details,
          created_at: createdAt,
          action_date: createdAt,
        });
        return u;
      }
      return null;
    },
    logout: () => {
      if (user) {
        const details = `${user.name} signed out`;
        const createdAt = new Date().toISOString();
        db.insert("audit_logs", {
          id: `log_${Date.now()}`,
          organization_id: user.organization_id,
          user_id: user.id,
          user_name: user.name,
          role: roleLabel(user.role),
          action: "LOGOUT",
          entity: "Session",
          module_name: "Session",
          details,
          description: details,
          created_at: createdAt,
          action_date: createdAt,
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
  }
}
// Mock multi-tenant database persisted in localStorage. Frontend-only.
import { CATEGORIES, ORG_SEED, EMPLOYEES_SEED, CUSTOMERS_SEED, SERVICES_SEED, APPOINTMENTS_SEED, FEEDBACK_SEED, AUDIT_SEED, REQUESTS_SEED, NOTIFICATIONS_SEED, CONTACT_SEED, USERS_SEED } from "./seed";

export type ID = string;
export type Role = "super_admin" | "org_admin" | "employee" ;
export type OrgStatus = "pending" | "approved" | "rejected" | "active" | "inactive";
export type AppointmentStatus = "confirmed" | "in_progress" | "completed" | "cancelled" | "rescheduled";
export type QueueStatus = "waiting" | "serving" | "done" | "skipped";

export interface User {
  id: ID; name: string; email: string; password: string; role: Role;
  mobile?: string; organization_id?: ID; status: "active" | "disabled";
  avatar?: string; created_at: string;
}
export interface Organization {
  id: ID; name: string; category: string; contact_person: string;
  email: string; mobile: string; address: string; city: string; state: string; country: string;
  logo?: string; status: OrgStatus; plan: "basic" | "professional" | "enterprise";
  created_at: string;
}
export interface OrgRequest extends Omit<Organization, "status"> { status: "pending" | "approved" | "rejected"; }
export interface Category { id: ID; name: string; slug: string; icon: string; description: string; }
export interface ServiceCategory { id: ID; organization_id: ID; name: string; description?: string; created_at: string; }
export interface Service {
  id: ID; organization_id: ID; category_id: ID; name: string;
  duration_min: number; fee: number; status: "active" | "inactive"; created_at: string;
}
export interface Employee {
  id: ID; organization_id: ID; name: string; designation: string;
  mobile: string; email: string; shift: string; status: "active" | "inactive";
  rating: number; created_at: string;
}
export interface Customer {
  id: ID; organization_id?: ID; name: string; mobile: string; email: string;
  gender: "male" | "female" | "other"; service?: string; status: "active" | "inactive";
  address?: string; avatar?: string; created_at: string;
}
export interface Appointment {
  id: ID; token: string; appointment_no: string; organization_id: ID;
  customer_id: ID; customer_name: string; customer_mobile: string; customer_email: string;
  service_id: ID; service_name: string; employee_id?: ID; employee_name?: string;
  date: string; time: string; status: AppointmentStatus; notes?: string;
  created_by?: ID; created_at: string; updated_at: string;
}
export interface QueueEntry {
  id: ID; organization_id: ID; appointment_id: ID; token: string;
  customer_name: string; service: string; position: number;
  status: QueueStatus; wait_minutes: number; created_at: string;
}
export interface Feedback {
  id: ID; organization_id: ID; appointment_id: ID; customer_id: ID;
  rating: number; service_quality: number; employee_behaviour: number;
  recommend: boolean; comments: string; created_at: string;
}
export interface AuditLog {
  id: ID; organization_id?: ID; user_id?: ID; user_name: string;
  action: string; entity: string; details: string; created_at: string;
}
export interface Notification {
  id: ID; user_id?: ID; role: Role; organization_id?: ID;
  title: string; message: string; read: boolean; created_at: string;
}
export interface ContactMessage {
  id: ID; name: string; email: string; subject: string;
  message: string; status: "new" | "replied"; created_at: string;
}

interface DB {
  users: User[]; organizations: Organization[]; org_requests: OrgRequest[];
  categories: Category[]; service_categories: ServiceCategory[]; services: Service[];
  employees: Employee[]; customers: Customer[]; appointments: Appointment[];
  queue: QueueEntry[]; feedback: Feedback[]; audit_logs: AuditLog[];
  notifications: Notification[]; contact_messages: ContactMessage[];
}

const KEY = "isf_db_v3";

const initial: DB = {
  users: USERS_SEED, organizations: ORG_SEED, org_requests: REQUESTS_SEED,
  categories: CATEGORIES, service_categories: [], services: SERVICES_SEED,
  employees: EMPLOYEES_SEED, customers: CUSTOMERS_SEED, appointments: APPOINTMENTS_SEED,
  queue: [], feedback: FEEDBACK_SEED, audit_logs: AUDIT_SEED,
  notifications: NOTIFICATIONS_SEED, contact_messages: CONTACT_SEED,
};

let cache: DB | null = null;
let version = 0;
const listeners = new Set<() => void>();

function read(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") { cache = initial; return cache; }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(initial));
      cache = initial;
    } else {
      cache = JSON.parse(raw);
    }
  } catch { cache = initial; }
  return cache!;
}
function write(next: DB) {
  cache = next;
  version++;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach(l => l());
}

export const db = {
  all<K extends keyof DB>(table: K): DB[K] { return read()[table]; },
  set<K extends keyof DB>(table: K, rows: DB[K]) {
    const cur = read(); write({ ...cur, [table]: rows } as DB);
  },
  insert<K extends keyof DB>(table: K, row: DB[K][number]) {
    const cur = read();
    write({ ...cur, [table]: [...(cur[table] as any[]), row] } as DB);
  },
  update<K extends keyof DB>(table: K, id: ID, patch: Partial<DB[K][number]>) {
    const cur = read();
    write({ ...cur, [table]: (cur[table] as any[]).map(r => r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r) } as DB);
  },
  remove<K extends keyof DB>(table: K, id: ID) {
    const cur = read();
    write({ ...cur, [table]: (cur[table] as any[]).filter(r => r.id !== id) } as DB);
  },
  reset() {
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
    cache = null; version++; listeners.forEach(l => l());
  },
  _version() { return version; },
};

export function uid(prefix = "id"): ID {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = () => { cache = null; version++; cb(); };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
};

export function useDb<T>(selector: () => T): T {
  const ref = useRef<{ v: number; value: T } | null>(null);
  const getSnapshot = () => {
    if (!ref.current || ref.current.v !== version) {
      ref.current = { v: version, value: selector() };
    }
    return ref.current.value;
  };
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// SSR-safe hydration helper
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;

  
}

// Mock multi-tenant database persisted in localStorage. Frontend-only.
import { CATEGORIES, ORG_SEED, EMPLOYEES_SEED, CUSTOMERS_SEED, SERVICES_SEED, SERVICE_CATEGORIES_SEED, APPOINTMENTS_SEED, QUEUE_SEED, QUEUE_STATS_SEED, FEEDBACK_SEED, AUDIT_SEED, REQUESTS_SEED, NOTIFICATIONS_SEED, CONTACT_SEED, USERS_SEED, DEFAULT_PASSWORD, generateUsername } from "./seed";

export type ID = string;
export type Role = "super_admin" | "org_admin" | "employee" ;
export type OrgStatus = "pending" | "approved" | "rejected" | "active" | "inactive";
export type AppointmentStatus = "confirmed" | "in_progress" | "completed" | "cancelled" | "rescheduled"| "left_queue" ;
export type QueueStatus = "waiting" | "serving" | "done" | "skipped";

export interface User {
  id: ID; name: string; email: string; password: string; role: Role;
  mobile?: string; organization_id?: ID; status: "active" | "disabled";
  avatar?: string; created_at: string;
  // Confirmed link to this user's own Employee record. Required for
  // employee-role accounts so pages like /employee/schedule and
  // /employee/queue can look up the correct row instead of falling back
  // to "first employee found in this org".
  employee_id?: ID;
  // Login-by-username support (email still works too — see
  // findUserByIdentifier below). Every account has one; generated
  // automatically for org_admin/employee accounts via generateUsername.
  username: string;
  // True until the person changes their auto-generated default password
  // via "Forgot Password" (resetPasswordByIdentifier below). A login page
  // can use this to prompt a mandatory password change on first sign-in.
  must_reset_password?: boolean;
}

// A single named shift's clock-hour range, e.g. what "cash_counter" means
// for a bank. Shift KEYS are now industry-specific (see
// CATEGORY_DEFAULT_SHIFTS below) rather than a generic
// morning/afternoon/evening/night set shared by every business type.
export interface OrgShiftDefinition {
  label: string;
  startMin: number;
  endMin: number;
  display: string;
}
// Keyed by shift key, which is scoped to the organization's category (e.g.
// bank shift keys are "general"/"cash_counter"/"customer_service"/
// "extended_banking" — see CATEGORY_DEFAULT_SHIFTS). Employee.shift stores
// one of these keys.
export type OrgShiftMap = Record<string, OrgShiftDefinition>;

export interface Organization {
  id: ID; name: string; category: string; contact_person: string;
  // `email` / `mobile` are the CONTACT PERSON's own email and mobile
  // number (e.g. the branch manager's personal number). `org_email` /
  // `org_mobile` are the organization's own official contact details
  // (e.g. a front-desk/helpline number and a general "contact@" inbox) —
  // deliberately separate fields since a business's public contact info
  // is rarely the same as the individual admin's.
  email: string; mobile: string;
  org_email: string; org_mobile: string;
  address: string; pincode: string; city: string; state: string; country: string;
  logo?: string; status: OrgStatus; plan: "basic" | "professional" | "enterprise";
  created_at: string;
  // Optional per-org override of shift clock-hours. If an org sets its own
  // working hours (e.g. this specific bank branch opens at 10am instead of
  // the bank-category default), put them here. If absent, shift
  // resolution falls back to CATEGORY_DEFAULT_SHIFTS for the org's
  // category, then to SHIFT_DEFINITIONS as a last resort.
  shift_hours?: OrgShiftMap;
}
export interface OrgRequest extends Omit<Organization, "status"> { status: "pending" | "approved" | "rejected"; }
export interface Category { id: ID; name: string; slug: string; icon: string; description: string; }
export interface ServiceCategory {
  id: ID; organization_id: ID; name: string; description?: string;
  service_count: number; status: "Active" | "Inactive"; created_at: string;
}
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
  id: ID;
  organization_id?: ID;
  name: string;
  mobile: string;
  email: string;
  gender: "male" | "female" | "other";
  service?: string;

  status: "waiting" | "in_service" | "served";

  address?: string;
  avatar?: string;
  created_at: string;
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
  // Which employee this queue entry belongs to. Optional for backward
  // compatibility with any queue rows created before employee assignment
  // existed, but every seeded entry now sets this so /employee/queue can
  // filter to "my queue" instead of showing the whole org's queue.
  employee_id?: ID; employee_name?: string;
}
// Per-org, per-hour aggregated queue snapshot for a given date. Powers the
// Org Admin Dashboard's "Queue Length Trend" and "Wait Time Trend" charts,
// which otherwise have no genuine hour-by-hour history to plot — the live
// `queue` table only ever holds today's current entries, not a time series
// of how the queue looked through the day. Regenerated fresh alongside
// appointments/queue whenever the cached "today" data goes stale (see the
// todayApptsStale check in read() below), so `hour`/`date` are always
// correctly aligned to the real current day.
export interface HourlyQueueStat {
  id: ID;
  organization_id: ID;
  date: string;
  hour: number; // 0-23, local clock hour
  queue_length: number; // customers waiting at a representative point in that hour
  avg_wait_minutes: number; // average wait time for customers queued in that hour
}
export interface Feedback {
  id: ID; organization_id: ID; appointment_id: ID; customer_id: ID;
  rating: number; service_quality: number; employee_behaviour: number;
  recommend: boolean; comments: string; created_at: string;
}
export interface AuditLog {
  id: ID; organization_id?: ID; user_id?: ID; user_name: string;
  action: string; entity: string; details: string; created_at: string;
  // Optional display-schema aliases used by the Audit Logs page for
  // org-admin/employee-generated entries (see ORG_ADMIN_AUDIT_SEED /
  // EMPLOYEE_AUDIT_SEED in seed.ts).
  role?: string; module_name?: string; description?: string; action_date?: string;
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
  queue: QueueEntry[]; queue_stats: HourlyQueueStat[]; feedback: Feedback[]; audit_logs: AuditLog[];
  notifications: Notification[]; contact_messages: ContactMessage[];
}

// Global last-resort fallback for shift clock-hours — used only when an org
// has no shift_hours override AND its category has no entry in
// CATEGORY_DEFAULT_SHIFTS below (e.g. an unrecognized/custom category).
export const SHIFT_DEFINITIONS: OrgShiftMap = {
  morning: { label: "Morning", startMin: 9 * 60, endMin: 17 * 60, display: "9:00 AM - 5:00 PM" },
};

// Per-CATEGORY named shift definitions, used whenever an individual org
// hasn't set its own `shift_hours`. Shift KEYS and hours are industry
// specific — a bank never has a "Night" shift and a hospital's "Morning"
// covers different hours than a clinic's — matching how each business
// type actually operates:
//
// | Industry          | Shifts                                                                 |
// | ------------------ | ----------------------------------------------------------------------|
// | Hospital           | Morning (6AM-2PM), Evening (2PM-10PM), Night (10PM-6AM),              |
// |                     | General (9AM-5PM), Emergency (24x7 Rotational)                        |
// | Clinic              | Morning (8AM-1PM), Afternoon (1PM-6PM), Evening (6PM-9PM),            |
// |                     | Full Day (9AM-6PM)                                                    |
// | Bank                | General Shift (9AM-5PM), Cash Counter (8:30AM-4:30PM),                |
// |                     | Customer Service (9:30AM-5:30PM), Extended Banking (11AM-7PM)         |
// | Retail              | Opening (8AM-4PM), Mid (11AM-7PM), Closing (2PM-10PM),                |
// |                     | Weekend Shift, Holiday Shift                                          |
// | Customer Support    | Morning (6AM-2PM), Afternoon (2PM-10PM), Night (10PM-6AM),            |
// |                     | Rotational Shift, Split Shift (9AM-1PM & 5PM-9PM)                     |
//
// Keyed PLURAL, same convention as CATEGORY_LABELS/CATEGORY_META below —
// always look up via normalizeCategoryKey(), never with org.category
// directly (it's stored singular: "hospital", "bank", etc).
export const CATEGORY_DEFAULT_SHIFTS: Record<string, OrgShiftMap> = {
  hospitals: {
    morning: { label: "Morning", startMin: 6 * 60, endMin: 14 * 60, display: "6:00 AM - 2:00 PM" },
    evening: { label: "Evening", startMin: 14 * 60, endMin: 22 * 60, display: "2:00 PM - 10:00 PM" },
    night: { label: "Night", startMin: 22 * 60, endMin: 24 * 60 + 6 * 60, display: "10:00 PM - 6:00 AM" },
    general: { label: "General", startMin: 9 * 60, endMin: 17 * 60, display: "9:00 AM - 5:00 PM" },
    emergency: { label: "Emergency", startMin: 0, endMin: 24 * 60, display: "24×7 Rotational" },
  },
  clinics: {
    morning: { label: "Morning", startMin: 8 * 60, endMin: 13 * 60, display: "8:00 AM - 1:00 PM" },
    afternoon: { label: "Afternoon", startMin: 13 * 60, endMin: 18 * 60, display: "1:00 PM - 6:00 PM" },
    evening: { label: "Evening", startMin: 18 * 60, endMin: 21 * 60, display: "6:00 PM - 9:00 PM" },
    full_day: { label: "Full Day", startMin: 9 * 60, endMin: 18 * 60, display: "9:00 AM - 6:00 PM" },
  },
  banks: {
    general: { label: "General Shift", startMin: 9 * 60, endMin: 17 * 60, display: "9:00 AM - 5:00 PM" },
    cash_counter: { label: "Cash Counter", startMin: 8 * 60 + 30, endMin: 16 * 60 + 30, display: "8:30 AM - 4:30 PM" },
    customer_service: { label: "Customer Service", startMin: 9 * 60 + 30, endMin: 17 * 60 + 30, display: "9:30 AM - 5:30 PM" },
    extended_banking: { label: "Extended Banking", startMin: 11 * 60, endMin: 19 * 60, display: "11:00 AM - 7:00 PM" },
  },
  retail: {
    opening: { label: "Opening Shift", startMin: 8 * 60, endMin: 16 * 60, display: "8:00 AM - 4:00 PM" },
    mid: { label: "Mid Shift", startMin: 11 * 60, endMin: 19 * 60, display: "11:00 AM - 7:00 PM" },
    closing: { label: "Closing Shift", startMin: 14 * 60, endMin: 22 * 60, display: "2:00 PM - 10:00 PM" },
    // Weekend/Holiday shifts don't have a fixed industry-standard clock
    // range (they're defined by WHICH day they fall on, not what hour),
    // so they reuse standard store hours for scheduling math while the
    // label/display makes clear what actually distinguishes them.
    weekend: { label: "Weekend Shift", startMin: 9 * 60, endMin: 21 * 60, display: "Weekend, 9:00 AM - 9:00 PM" },
    holiday: { label: "Holiday Shift", startMin: 9 * 60, endMin: 21 * 60, display: "Holiday, 9:00 AM - 9:00 PM" },
  },
  support: {
    morning: { label: "Morning", startMin: 6 * 60, endMin: 14 * 60, display: "6:00 AM - 2:00 PM" },
    afternoon: { label: "Afternoon", startMin: 14 * 60, endMin: 22 * 60, display: "2:00 PM - 10:00 PM" },
    night: { label: "Night", startMin: 22 * 60, endMin: 24 * 60 + 6 * 60, display: "10:00 PM - 6:00 AM" },
    rotational: { label: "Rotational Shift", startMin: 0, endMin: 24 * 60, display: "24×7 Rotational" },
    // A true split shift has two disjoint work blocks (9AM-1PM and
    // 5PM-9PM) with an unpaid gap between them. The single-range
    // {startMin,endMin} model used everywhere else in this app can't
    // represent a gap, so this stores the OUTER bounds (9AM-9PM) for any
    // "is this appointment inside the shift" checks, while `display`
    // spells out the real two-block schedule for anything user-facing.
    split: { label: "Split Shift", startMin: 9 * 60, endMin: 21 * 60, display: "9:00 AM - 1:00 PM & 5:00 PM - 9:00 PM" },
  },
};

// =========================================================================
// EMPLOYEE-PORTAL SHARED HELPERS
// =========================================================================
// Single source of truth for two things every employee-portal page needs
// (dashboard, queue, schedule), so they can't silently diverge:
//   1. Resolving the logged-in User -> their Employee record.
//   2. Turning an Employee.shift value into a concrete {startMin, endMin}
//      range (scoped to the employee's own org's shift hours), and
//      formatting/labelling that range.
//   3. Mapping Organization.category (singular: "hospital","clinic","bank",
//      "retail","support") to the plural keys used by display-config
//      lookups (CATEGORY_LABELS below, and the Dashboard page's own
//      CATEGORY_META) — so those lookups can't silently miss and fall back
//      to "default".
// =========================================================================

export interface ResolvedEmployee {
  employee?: Employee;
  // true if we could not find a confirmed match via user.employee_id and
  // fell back to "first employee found in this org" — callers should show
  // a warning banner when this is true.
  matchedByFallback: boolean;
}

export function resolveEmployeeForUser(
  user: Pick<User, "employee_id" | "organization_id"> | null | undefined,
  employees: Employee[]
): ResolvedEmployee {
  let employee: Employee | undefined;
  let matchedByFallback = false;

  if (user?.employee_id) {
    employee = employees.find((e) => e.id === user.employee_id);
  }
  if (!employee && user?.organization_id) {
    employee = employees.find((e) => e.organization_id === user.organization_id);
    matchedByFallback = !!employee;
  }

  return { employee, matchedByFallback };
}

// Parse shift strings in 12-hour OR 24-hour format.
// Accepts: "09:00 - 17:00", "9:00 AM - 5:00 PM", "6:00 PM - 2:00 AM",
//          "9:00AM-5:00PM", "09:00-17:00", etc.
export function parseShift(shift: string): { startMin: number; endMin: number } | null {
  const cleaned = shift.trim();

  const match = cleaned.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/
  );
  if (!match) return null;

  const [, sh, sm, sap, eh, em, eap] = match;

  const to24 = (h: string, ap?: string) => {
    let hour = Number(h);
    if (ap) {
      const upper = ap.toUpperCase();
      if (upper === "PM" && hour !== 12) hour += 12;
      if (upper === "AM" && hour === 12) hour = 0;
    }
    return hour;
  };

  const startMin = to24(sh, sap) * 60 + Number(sm);
  let endMin = to24(eh, eap) * 60 + Number(em);

  // Handle overnight shifts (e.g. 8:00 PM - 4:00 AM)
  if (endMin <= startMin) endMin += 24 * 60;

  return { startMin, endMin };
}

// Resolves which OrgShiftMap applies for a given org: the org's own
// `shift_hours` override if it set one, else its category's defaults
// (CATEGORY_DEFAULT_SHIFTS), else the global SHIFT_DEFINITIONS fallback.
// Safe to call with no org at all (falls straight through to global).
export function resolveOrgShiftMap(
  org?: Pick<Organization, "category" | "shift_hours"> | null
): OrgShiftMap {
  if (org?.shift_hours && Object.keys(org.shift_hours).length > 0) return org.shift_hours;
  const categoryKey = normalizeCategoryKey(org?.category);
  return CATEGORY_DEFAULT_SHIFTS[categoryKey] ?? SHIFT_DEFINITIONS;
}

// Every valid shift KEY for a given org (its own override, else its
// category's named shifts, else the global fallback). Use this anywhere
// that needs to populate a shift dropdown or validate a stored shift value
// — e.g. the Employees page's shift `<select>` should be built from this
// instead of a hardcoded morning/afternoon/evening/night list, since valid
// keys are now industry-specific.
export function shiftKeysForOrg(
  org?: Pick<Organization, "category" | "shift_hours"> | null
): string[] {
  return Object.keys(resolveOrgShiftMap(org));
}

// Resolves an employee's shift value into a {startMin, endMin} range,
// scoped to their organization's own shift-hour definitions (org override
// -> category default -> global fallback, via resolveOrgShiftMap above).
// Named keys ("cash_counter") are checked first since that's the format
// used in the seed data / Employees page dropdown; raw "HH:MM - HH:MM"
// strings still work via parseShift regardless of org.
export function resolveShift(
  shift: string,
  org?: Pick<Organization, "category" | "shift_hours"> | null
): { startMin: number; endMin: number } | null {
  const key = shift.trim().toLowerCase();
  const orgShiftMap = resolveOrgShiftMap(org);
  if (orgShiftMap[key]) return orgShiftMap[key];
  return parseShift(shift);
}

// Looks up the full display definition (label + human-readable range) for
// an employee's shift within their org's shift map. Falls back to
// SHIFT_DEFINITIONS if the shift key isn't recognized anywhere.
export function resolveShiftDisplay(
  shift: string,
  org?: Pick<Organization, "category" | "shift_hours"> | null
): OrgShiftDefinition | null {
  const key = shift.trim().toLowerCase();
  const orgShiftMap = resolveOrgShiftMap(org);
  if (orgShiftMap[key]) return orgShiftMap[key];
  if (SHIFT_DEFINITIONS[key]) return SHIFT_DEFINITIONS[key];
  return null;
}

// Format minutes-since-midnight as 12-hour "h:mm AM/PM"
export function fmt12(minTotal: number) {
  const min = ((minTotal % (24 * 60)) + 24 * 60) % (24 * 60); // wrap into 0–1439
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function shiftLabel(startMin: number) {
  const h = Math.floor(startMin / 60);
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

// Does an "HH:MM" appointment time fall within an employee's shift range?
// Handles overnight shifts (e.g. night shift startMin=1320 endMin=1800,
// i.e. 10:00 PM - 6:00 AM next day) by wrapping times before startMin
// forward by 24h before comparing.
export function isTimeInShiftRange(
  time: string,
  range: { startMin: number; endMin: number }
): boolean {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  let mins = h * 60 + m;
  if (mins < range.startMin) mins += 24 * 60;
  return mins >= range.startMin && mins <= range.endMin;
}

// Organization.category is stored SINGULAR in seed data ("hospital",
// "clinic", "bank", "retail", "support" — see ORG_SEED in seed.ts), but
// display-config lookups keyed by category (CATEGORY_LABELS below, the
// Dashboard page's own CATEGORY_META, and CATEGORY_DEFAULT_SHIFTS above)
// use PLURAL keys ("hospitals", "clinics", "banks"). Looking up a singular
// key against a plural map misses silently and falls back to "default".
//
// Every category-keyed lookup across the employee portal should go
// through this instead of using `org.category` directly.
const CATEGORY_KEY_MAP: Record<string, string> = {
  hospital: "hospitals",
  clinic: "clinics",
  bank: "banks",
  retail: "retail",
  support: "support",
};

export function normalizeCategoryKey(category?: string | null): string {
  if (!category) return "default";
  return CATEGORY_KEY_MAP[category] ?? category;
}

// Per-category wording, keyed the same way as Organization.category on the
// Super Admin "Organization Categories" page (hospitals, clinics, banks,
// retail, support). Used by both the employee queue and dashboard pages so
// a hospital never says "Customer" and a bank never says "Patient".
// NOTE: keys here are plural — always look up via normalizeCategoryKey(),
// never with org.category directly.
export const CATEGORY_LABELS: Record<string, { entity: string; entityPlural: string; queueName: string }> = {
  hospitals: { entity: "Patient", entityPlural: "Patients", queueName: "OPD Queue" },
  clinics: { entity: "Patient", entityPlural: "Patients", queueName: "Walk-in Queue" },
  banks: { entity: "Customer", entityPlural: "Customers", queueName: "Teller Queue" },
  retail: { entity: "Customer", entityPlural: "Customers", queueName: "Checkout Queue" },
  support: { entity: "Caller", entityPlural: "Callers", queueName: "Support Queue" },
  default: { entity: "Customer", entityPlural: "Customers", queueName: "Queue" },
};

// =========================================================================
// ORG-ADMIN DASHBOARD SHARED HELPERS
// =========================================================================
// Single source of truth for utilization math, so the dashboard's KPI card
// (org-wide average) and its per-employee chart can never silently diverge
// by using two different formulas.
// =========================================================================

// Utilization = minutes spent on completed/in-progress appointments today,
// divided by the employee's own shift length (scoped to their org's shift
// hours via resolveShift), clamped to 100%. Returns null if the employee
// has no resolvable shift (so callers can decide how to display "N/A"
// rather than silently showing 0%).
export function computeEmployeeUtilizationPct(
  employee: Pick<Employee, "shift">,
  todaysAppointmentsForEmployee: Pick<Appointment, "service_id" | "status">[],
  services: Pick<Service, "id" | "duration_min">[],
  org?: Pick<Organization, "category" | "shift_hours"> | null
): number | null {
  const shiftRange = resolveShift(employee.shift, org);
  if (!shiftRange) return null;

  const shiftMinutes = shiftRange.endMin - shiftRange.startMin;
  if (shiftMinutes <= 0) return null;

  const busyMinutes = todaysAppointmentsForEmployee
    .filter((a) => a.status === "completed" || a.status === "in_progress")
    .reduce((sum, a) => {
      const svc = services.find((s) => s.id === a.service_id);
      return sum + (svc?.duration_min ?? 0);
    }, 0);

  return Math.min(100, Math.round((busyMinutes / shiftMinutes) * 100));
}

// =========================================================================
// LOGIN / ACCOUNT-CREATION HELPERS
// =========================================================================
// Re-exported so callers only need to import from "./db", not reach into
// "./seed" directly for the shared default password.
export { DEFAULT_PASSWORD };

// Looks a user up by EITHER their email or their username, case-insensitive.
// Used by the login screen (see auth-context.tsx) so people can sign in
// with whichever one they remember.
export function findUserByIdentifier(identifier: string, users: User[]): User | undefined {
  const id = identifier.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === id || u.username?.toLowerCase() === id);
}

// Builds (does not insert) a new org_admin login for a freshly approved /
// manually created Organization. Call this wherever an org gets created —
// e.g. the super-admin "Approve Request" and "Add Organization" actions —
// then db.insert("users", account) alongside creating the Organization
// itself, so the org can log in immediately with a generated username and
// the shared default password.
export function createOrgAdminAccount(
  org: Pick<Organization, "id" | "contact_person" | "email" | "mobile">
): User {
  const existingUsernames = db.all("users").map((u) => u.username).filter(Boolean) as string[];
  return {
    id: uid("user_org_admin"),
    name: org.contact_person,
    email: org.email,
    username: generateUsername(org.contact_person, existingUsernames),
    password: DEFAULT_PASSWORD,
    must_reset_password: true,
    role: "org_admin",
    organization_id: org.id,
    mobile: org.mobile,
    status: "active",
    created_at: new Date().toISOString(),
  };
}

// Same idea for a newly added Employee. Call from the "Add Employee" flow
// (org_admin or super_admin) alongside db.insert("employees", employee),
// then db.insert("users", account) so the employee can log in immediately.
export function createEmployeeAccount(
  employee: Pick<Employee, "id" | "organization_id" | "name" | "email" | "mobile">
): User {
  const existingUsernames = db.all("users").map((u) => u.username).filter(Boolean) as string[];
  return {
    id: uid("user_employee"),
    name: employee.name,
    email: employee.email,
    username: generateUsername(employee.name, existingUsernames),
    password: DEFAULT_PASSWORD,
    must_reset_password: true,
    role: "employee",
    organization_id: employee.organization_id,
    employee_id: employee.id,
    mobile: employee.mobile,
    status: "active",
    created_at: new Date().toISOString(),
  };
}

// "Forgot password" for a frontend-only mock app with no real email/SMS
// delivery: identity is verified by matching the account's own registered
// mobile number, then the password is replaced and must_reset_password
// cleared. Returns a message a UI can show directly.
export function resetPasswordByIdentifier(
  identifier: string,
  mobile: string,
  newPassword: string
): { ok: boolean; message: string } {
  const user = findUserByIdentifier(identifier, db.all("users"));
  if (!user) return { ok: false, message: "No account found for that email or username." };
  if ((user.mobile || "").replace(/\s/g, "") !== mobile.replace(/\s/g, "")) {
    return { ok: false, message: "That mobile number doesn't match our records." };
  }
  if (newPassword.length < 8) {
    return { ok: false, message: "New password must be at least 8 characters." };
  }
  db.update("users", user.id, { password: newPassword, must_reset_password: false } as Partial<User>);
  return { ok: true, message: "Password updated. You can log in with your new password now." };
}

// Bumped from v6 -> v7. Shift KEYS changed from the generic
// morning/afternoon/evening/night set to industry-specific names (e.g.
// banks now use general/cash_counter/customer_service/extended_banking,
// retail uses opening/mid/closing/weekend/holiday). Any cached v6 blob has
// employees with shift values that no longer exist in the new
// CATEGORY_DEFAULT_SHIFTS maps for their category. Rather than trying to
// remap every old key to a sensible new one, bumping the storage key is
// the same clean fix used for the v5->v6 jump: localStorage has nothing
// under "isf_db_v7" yet, so read() below writes a completely fresh
// `initial` with correct, current shift keys and current-day dates.
const KEY = "isf_db_v7";

const initial: DB = {
  users: USERS_SEED, organizations: ORG_SEED, org_requests: REQUESTS_SEED,
  categories: CATEGORIES, service_categories: SERVICE_CATEGORIES_SEED, services: SERVICES_SEED,
  employees: EMPLOYEES_SEED, customers: CUSTOMERS_SEED, appointments: APPOINTMENTS_SEED,
  queue: QUEUE_SEED, queue_stats: QUEUE_STATS_SEED, feedback: FEEDBACK_SEED, audit_logs: AUDIT_SEED,
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

  // Migration: seed appointment dates are computed ONCE, the moment the
  // seed module first runs (see daysAgo/daysFromNow in seed.ts), then
  // frozen into localStorage. Any time the real current date has moved on
  // since that moment, every "today" appointment silently stops matching
  // `date === today` in the employee dashboard/schedule/queue pages, so
  // they render as empty even though real appointment data exists in the
  // underlying seed.
  //
  // Rather than trying to shift old dates forward, we detect staleness and
  // replace `appointments`/`queue` outright with the freshly-recomputed
  // `initial` seed, since `now = new Date()` in seed.ts runs fresh on
  // every page load.
  //
  // `queue_stats` is date-scoped the same way, so it gets refreshed here
  // too.
  if (cache) {
    const actualToday = new Date().toISOString().slice(0, 10);
    const referenceTodayAppt = (cache.appointments || []).find((a) => a.id.startsWith("apt_today_"));
    const todayApptsStale = !referenceTodayAppt || referenceTodayAppt.date !== actualToday;

    if (todayApptsStale) {
      cache = {
        ...cache,
        appointments: initial.appointments,
        queue: initial.queue,
        queue_stats: initial.queue_stats,
      };
      if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(cache));
    }
  }

  // Migration: caches saved before various seed fixes landed need a
  // one-time backfill so existing sessions pick up corrected data without
  // wiping everything else the user has already created. Each check below
  // is independent and only patches the specific slice it's responsible
  // for — never the whole table — except where noted.
  if (cache) {
    const noCategories = !cache.service_categories || cache.service_categories.length === 0;

    const categoryIds = new Set((cache.service_categories || []).map((c) => c.id));
    const staleServiceLinks =
      (cache.services || []).length > 0 &&
      (cache.services || []).every((s) => !categoryIds.has(s.category_id));

    // Migration: restore any organization's services that were fully wiped
    // out while the seed data says that org SHOULD have services. Only
    // ADDS BACK the missing org's own seed services.
    const seedOrgIdsWithServices = new Set(initial.services.map((s) => s.organization_id));
    const cacheOrgIdsWithServices = new Set((cache.services || []).map((s) => s.organization_id));
    const orgsMissingServices = [...seedOrgIdsWithServices].filter(
      (orgId) => !cacheOrgIdsWithServices.has(orgId)
    );
    const hasMissingOrgServices = !staleServiceLinks && orgsMissingServices.length > 0;

    // Shift keys are now industry-specific per org category (see
    // CATEGORY_DEFAULT_SHIFTS above), not a flat global set — so
    // "is this employee's shift stale" has to be checked against THEIR
    // org's own valid keys, not one hardcoded list.
    const orgById = new Map((cache.organizations || []).map((o) => [o.id, o]));
    const validShiftKeysForOrg = (orgId: ID): string[] => {
      const org = orgById.get(orgId);
      const catKey = normalizeCategoryKey(org?.category);
      return Object.keys(CATEGORY_DEFAULT_SHIFTS[catKey] ?? SHIFT_DEFINITIONS);
    };
    const hasStaleShift = (cache.employees || []).some(
      (e) => !validShiftKeysForOrg(e.organization_id).includes(e.shift)
    );

    // Detect employees pointing at an organization_id that no longer
    // exists in the current organizations table.
    const validOrgIds = new Set((cache.organizations || []).map((o) => o.id));
    const staleEmployeeOrgs =
      (cache.employees || []).length > 0 &&
      (cache.employees || []).some((e) => !validOrgIds.has(e.organization_id));

    // Migration: users seeded before `employee_id` existed need their known
    // seed employee_id backfilled.
    const seedEmployeeIdById: Record<string, string> = {};
    for (const u of initial.users) {
      if (u.employee_id) seedEmployeeIdById[u.id] = u.employee_id;
    }
    const usersNeedingEmployeeId = (cache.users || []).some(
      (u) => seedEmployeeIdById[u.id] && !u.employee_id
    );

    // Migration: users seeded/created before `username` existed need one
    // generated and backfilled, so login-by-username and the account
    // creation helpers above always have something to work with, even for
    // sessions cached before this feature shipped.
    const usersMissingUsername = (cache.users || []).some((u) => !u.username);

    // Migration: emp_26 (Nikhil Bhatt, the record user_emp2 links to) was
    // added after some sessions were already cached.
    const missingSeedEmployee = !(cache.employees || []).some((e) => e.id === "emp_26");

    // Migration: every active employee should have TODAY appointments (and
    // matching queue entries) inside their own shift.
    const employeeIdsPresent = new Set(
      (missingSeedEmployee ? initial.employees : cache.employees || []).map((e) => e.id)
    );
    const seedQueueEmployeeIds = new Set(
      (initial.queue || []).map((q) => q.employee_id).filter(Boolean) as string[]
    );
    const missingSeedQueueEntries =
      employeeIdsPresent.size > 0 &&
      !(cache.queue || []).some((q) => q.employee_id && seedQueueEmployeeIds.has(q.employee_id));

    // Migration: `queue_stats` is a brand new table — any cache saved
    // before this feature existed simply won't have the key at all.
    const missingQueueStats = !cache.queue_stats || cache.queue_stats.length === 0;

    // Migration: organizations/org_requests saved before org_email /
    // org_mobile / pincode existed need those fields backfilled from the
    // fresh seed record with the same id, so old carts of cached data
    // don't show blank contact/pincode fields forever.
    const orgsMissingNewFields = (cache.organizations || []).some(
      (o) => !("org_email" in o) || !("org_mobile" in o) || !("pincode" in o)
    );
    const requestsMissingNewFields = (cache.org_requests || []).some(
      (r) => !("org_email" in r) || !("org_mobile" in r) || !("pincode" in r)
    );

    if (
      noCategories ||
      staleServiceLinks ||
      hasMissingOrgServices ||
      hasStaleShift ||
      staleEmployeeOrgs ||
      usersNeedingEmployeeId ||
      usersMissingUsername ||
      missingSeedEmployee ||
      missingSeedQueueEntries ||
      missingQueueStats ||
      orgsMissingNewFields ||
      requestsMissingNewFields
    ) {
      const patchedEmployees = staleEmployeeOrgs
        ? initial.employees
        : hasStaleShift
        ? (cache.employees || []).map((e, i) => {
            if (validShiftKeysForOrg(e.organization_id).includes(e.shift)) return e;
            const validKeys = validShiftKeysForOrg(e.organization_id);
            return { ...e, shift: validKeys[i % validKeys.length] };
          })
        : cache.employees;

      const employeesWithSeedEntry =
        !staleEmployeeOrgs && missingSeedEmployee
          ? [...patchedEmployees, initial.employees.find((e) => e.id === "emp_26")!]
          : patchedEmployees;

      const patchedServices = staleServiceLinks
        ? initial.services
        : hasMissingOrgServices
        ? [
            ...(cache.services || []),
            ...initial.services.filter((s) => orgsMissingServices.includes(s.organization_id)),
          ]
        : cache.services;

      const patchedOrganizations = orgsMissingNewFields
        ? (cache.organizations || []).map((o) => {
            const org = o as Partial<Organization> & Pick<Organization, "id" | "email" | "mobile">;
            if ("org_email" in org && "org_mobile" in org && "pincode" in org) return org as Organization;
            const seedOrg = initial.organizations.find((s) => s.id === org.id);
            return {
              ...org,
              org_email: org.org_email ?? seedOrg?.org_email ?? org.email,
              org_mobile: org.org_mobile ?? seedOrg?.org_mobile ?? "",
              pincode: org.pincode ?? seedOrg?.pincode ?? "",
            } as Organization;
          })
        : cache.organizations;

      const patchedOrgRequests = requestsMissingNewFields
        ? (cache.org_requests || []).map((r) => {
            const req = r as Partial<OrgRequest> & Pick<OrgRequest, "id">;
            if (req.org_email !== undefined && req.org_mobile !== undefined && req.pincode !== undefined) {
              return req as OrgRequest;
            }
            const seedReq = initial.org_requests.find((sr) => sr.id === req.id);
            return {
              ...req,
              org_email: req.org_email ?? seedReq?.org_email ?? req.email,
              org_mobile: req.org_mobile ?? seedReq?.org_mobile ?? "",
              pincode: req.pincode ?? seedReq?.pincode ?? "",
              status: req.status ?? seedReq?.status ?? "pending",
            } as OrgRequest;
          })
        : cache.org_requests;

      // Backfill missing usernames deterministically: reuse the seed's own
      // generated username where the user id matches a seeded account,
      // otherwise generate a fresh one against everyone else's usernames
      // so nothing collides.
      const usersWithUsername = usersMissingUsername
        ? (() => {
            const seedUsernameById = new Map(initial.users.map((u) => [u.id, u.username]));
            const taken = new Set(
              (cache!.users || [])
                .map((u) => u.username)
                .filter(Boolean)
                .map((u) => u!.toLowerCase())
            );
            return (cache!.users || []).map((u) => {
              if (u.username) return u;
              const fromSeed = seedUsernameById.get(u.id);
              const username = fromSeed && !taken.has(fromSeed.toLowerCase())
                ? fromSeed
                : generateUsername(u.name, taken);
              taken.add(username.toLowerCase());
              return { ...u, username };
            });
          })()
        : cache.users;

      cache = {
        ...cache,
        service_categories: noCategories || staleServiceLinks ? initial.service_categories : cache.service_categories,
        services: patchedServices,
        employees: employeesWithSeedEntry,
        organizations: patchedOrganizations,
        org_requests: patchedOrgRequests,
        users: usersNeedingEmployeeId
          ? usersWithUsername.map((u) =>
              seedEmployeeIdById[u.id] && !u.employee_id ? { ...u, employee_id: seedEmployeeIdById[u.id] } : u
            )
          : usersWithUsername,
        appointments: missingSeedQueueEntries ? initial.appointments : cache.appointments,
        queue: missingSeedQueueEntries ? initial.queue : cache.queue,
        queue_stats: missingQueueStats ? initial.queue_stats : cache.queue_stats,
      };
      if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(cache));
    }
  }

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
  const ref = useRef<{ v: number; selector: () => T; value: T } | null>(null);
  const getSnapshot = () => {
    if (!ref.current || ref.current.v !== version || ref.current.selector !== selector) {
      ref.current = { v: version, selector, value: selector() };
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
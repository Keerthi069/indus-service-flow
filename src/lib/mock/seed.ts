// Realistic Indian seed data for Indus Service Flow
import type { Category, Organization, OrgRequest, User, Employee, Customer, Service, ServiceCategory, Appointment, QueueEntry, HourlyQueueStat, Feedback, AuditLog, Notification, ContactMessage } from "./db";
type SeedEmployee = Employee & { service_ids: string[] };

const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return iso(d); };
const daysFromNow = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export const CATEGORIES: Category[] = [
  { id: "cat_hospital", name: "Hospitals", slug: "hospital", icon: "Hospital", description: "Multi-specialty hospitals and medical centers" },
  { id: "cat_clinic", name: "Clinics", slug: "clinic", icon: "Stethoscope", description: "Outpatient clinics and diagnostic centers" },
  { id: "cat_bank", name: "Banks", slug: "bank", icon: "Landmark", description: "Bank branches and financial services" },
  { id: "cat_retail", name: "Retail Stores", slug: "retail", icon: "Store", description: "Retail outlets and showrooms" },
  { id: "cat_support", name: "Customer Support Centers", slug: "support", icon: "Headphones", description: "Customer service and support centers" },
];

// NOTE on email/mobile vs org_email/org_mobile below: `email`/`mobile` are
// the CONTACT PERSON's own personal line (the branch manager/admin's
// individual number). `org_email`/`org_mobile` are the organization's own
// official line — a general front-desk/helpline number and a role-based
// inbox (info@/contact@/helpdesk@) — deliberately DIFFERENT values from
// the contact person's, matching the distinction already documented on the
// Organization interface in db.ts. Landline numbers use the real STD code
// for each org's city (044 Chennai, 011 Delhi, 080 Bengaluru, 079
// Ahmedabad, 022 Mumbai, 0120 Noida, 020 Pune, 040 Hyderabad, 033 Kolkata).
export const ORG_SEED: Organization[] = [
  { id: "org_1", name: "Apollo Hospitals Chennai", category: "hospital", contact_person: "Dr. Ramesh Iyer", email: "ramesh.iyer@apollochennai.in", mobile: "+91 98400 12345", org_email: "info@apollochennai.in", org_mobile: "044 2829 3333", pincode: "600006", address: "21, Greams Lane", city: "Chennai", state: "Tamil Nadu", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(120) },
  { id: "org_2", name: "Fortis Escorts Hospital", category: "hospital", contact_person: "Anjali Mehra", email: "anjali.mehra@fortisokhla.in", mobile: "+91 98101 22334", org_email: "info@fortisokhla.in", org_mobile: "011 4713 5000", pincode: "110025", address: "Okhla Road", city: "New Delhi", state: "Delhi", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(98) },
  { id: "org_3", name: "Sunrise Family Clinic", category: "clinic", contact_person: "Dr. Priya Nair", email: "priya.nair@sunriseclinic.in", mobile: "+91 99020 56781", org_email: "contact@sunriseclinic.in", org_mobile: "080 4112 2233", pincode: "560001", address: "MG Road", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(80) },
  { id: "org_4", name: "Wellness Diagnostics", category: "clinic", contact_person: "Dr. Karan Shah", email: "karan.shah@wellnessdiag.in", mobile: "+91 97720 99001", org_email: "contact@wellnessdiag.in", org_mobile: "079 4011 5566", pincode: "380054", address: "SG Highway", city: "Ahmedabad", state: "Gujarat", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(65) },
  { id: "org_5", name: "HDFC Bank Andheri Branch", category: "bank", contact_person: "Suresh Pillai", email: "suresh.pillai@hdfc.in", mobile: "+91 98202 11122", org_email: "andheri.branch.helpdesk@hdfc.in", org_mobile: "022 6160 6161", pincode: "400053", address: "Andheri West", city: "Mumbai", state: "Maharashtra", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(180) },
  { id: "org_6", name: "ICICI Bank Sector 18", category: "bank", contact_person: "Neha Verma", email: "neha.verma@icici.in", mobile: "+91 98712 33445", org_email: "sec18.helpdesk@icici.in", org_mobile: "0120 439 6285", pincode: "201301", address: "Sector 18", city: "Noida", state: "Uttar Pradesh", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(150) },
  { id: "org_7", name: "Croma Phoenix Mall", category: "retail", contact_person: "Rohit Sinha", email: "rohit.sinha@croma.in", mobile: "+91 98330 77889", org_email: "phoenix.store@croma.in", org_mobile: "020 6741 2200", pincode: "411013", address: "Phoenix Marketcity", city: "Pune", state: "Maharashtra", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(55) },
  { id: "org_8", name: "Reliance Digital Forum Mall", category: "retail", contact_person: "Meera Krishnan", email: "meera.krishnan@reliancedigital.in", mobile: "+91 98860 44556", org_email: "forum.store@reliancedigital.in", org_mobile: "080 4718 9900", pincode: "560034", address: "Forum Mall, Koramangala", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", status: "approved", plan: "basic", created_at: daysAgo(40) },
  { id: "org_9", name: "Jio Customer Care Hyderabad", category: "support", contact_person: "Vikram Reddy", email: "vikram.reddy@jio.in", mobile: "+91 96660 11223", org_email: "hyd.care.helpdesk@jio.in", org_mobile: "040 4033 5500", pincode: "500081", address: "HITEC City", city: "Hyderabad", state: "Telangana", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(200) },
  { id: "org_10", name: "Airtel Customer Hub Kolkata", category: "support", contact_person: "Tanvi Banerjee", email: "tanvi.banerjee@airtel.in", mobile: "+91 98301 66778", org_email: "kol.hub.helpdesk@airtel.in", org_mobile: "033 4011 7788", pincode: "700091", address: "Salt Lake Sector V", city: "Kolkata", state: "West Bengal", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(75) },
];

export const REQUESTS_SEED: OrgRequest[] = [
  { id: "req_1", name: "Manipal Hospital Whitefield", category: "hospital", contact_person: "Dr. Aditi Rao", email: "aditi.rao@manipalwf.in", mobile: "+91 98452 99887", org_email: "info@manipalwf.in", org_mobile: "080 4669 0500", pincode: "560066", address: "Whitefield", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", plan: "enterprise", status: "pending", created_at: daysAgo(3) },
  { id: "req_2", name: "Axis Bank Connaught Place", category: "bank", contact_person: "Rajeev Khanna", email: "rajeev.khanna@axis.in", mobile: "+91 98101 55667", org_email: "cp.helpdesk@axis.in", org_mobile: "011 4368 2000", pincode: "110001", address: "Connaught Place", city: "New Delhi", state: "Delhi", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(2) },
  { id: "req_3", name: "Sankara Eye Clinic", category: "clinic", contact_person: "Dr. Lakshmi Subramanian", email: "lakshmi.subramanian@sankaraeye.in", mobile: "+91 96770 88990", org_email: "contact@sankaraeye.in", org_mobile: "044 4224 3900", pincode: "600020", address: "Adyar", city: "Chennai", state: "Tamil Nadu", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(5) },
  { id: "req_4", name: "Vijay Sales Borivali", category: "retail", contact_person: "Hemant Joshi", email: "hemant.joshi@vijaysales.in", mobile: "+91 99670 11445", org_email: "borivali.store@vijaysales.in", org_mobile: "022 2892 4400", pincode: "400092", address: "Borivali West", city: "Mumbai", state: "Maharashtra", country: "India", logo: "", plan: "basic", status: "pending", created_at: daysAgo(1) },
  { id: "req_5", name: "BSNL Service Center Pune", category: "support", contact_person: "Prakash Deshmukh", email: "prakash.deshmukh@bsnl.in", mobile: "+91 98221 33445", org_email: "pune.sc.helpdesk@bsnl.in", org_mobile: "020 2551 6600", pincode: "411005", address: "Shivajinagar", city: "Pune", state: "Maharashtra", country: "India", logo: "", plan: "basic", status: "pending", created_at: daysAgo(6) },
  { id: "req_6", name: "Cloudnine Hospital JP Nagar", category: "hospital", contact_person: "Dr. Sneha Pai", email: "sneha.pai@cloudnine.in", mobile: "+91 98860 22113", org_email: "jpn.info@cloudnine.in", org_mobile: "080 6712 3300", pincode: "560078", address: "JP Nagar", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", plan: "enterprise", status: "pending", created_at: daysAgo(7) },
  { id: "req_7", name: "Kotak Mahindra Bandra", category: "bank", contact_person: "Shilpa Iyer", email: "shilpa.iyer@kotak.in", mobile: "+91 98203 77881", org_email: "bandra.helpdesk@kotak.in", org_mobile: "022 6600 6022", pincode: "400050", address: "Bandra West", city: "Mumbai", state: "Maharashtra", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(4) },
  { id: "req_8", name: "Lenskart Sarath City Mall", category: "retail", contact_person: "Aakash Patil", email: "aakash.patil@lenskart.in", mobile: "+91 97053 22119", org_email: "scm.store@lenskart.in", org_mobile: "040 4855 7700", pincode: "500035", address: "Sarath City Mall", city: "Hyderabad", state: "Telangana", country: "India", logo: "", plan: "basic", status: "pending", created_at: daysAgo(8) },
  { id: "req_9", name: "Tata Sky Service Center", category: "support", contact_person: "Rahul Saxena", email: "rahul.saxena@tatasky.in", mobile: "+91 98185 33667", org_email: "delhi.sc.helpdesk@tatasky.in", org_mobile: "011 4141 9200", pincode: "110005", address: "Karol Bagh", city: "New Delhi", state: "Delhi", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(2) },
  { id: "req_10", name: "Max Super Speciality Saket", category: "hospital", contact_person: "Dr. Arvind Malhotra", email: "arvind.malhotra@maxhealth.in", mobile: "+91 98106 22115", org_email: "saket.info@maxhealth.in", org_mobile: "011 2651 5050", pincode: "110017", address: "Saket", city: "New Delhi", state: "Delhi", country: "India", logo: "", plan: "enterprise", status: "pending", created_at: daysAgo(9) },
];

// =========================================================================
// LOGIN CREDENTIAL HELPERS (username + default password)
// =========================================================================
export const DEFAULT_PASSWORD = "Welcome@123";

// "Dr. Ramesh Iyer" -> "ramesh.iyer". Strips honorifics/punctuation, then
// disambiguates against already-taken usernames with a numeric suffix
// ("ramesh.iyer2", "ramesh.iyer3", ...) so two contact people who share a
// first+last name never collide.
export function generateUsername(name: string, existingUsernames: Iterable<string>): string {
  const taken = new Set(Array.from(existingUsernames, (u) => u.toLowerCase()));
  const base =
    name
      .toLowerCase()
      .replace(/\b(dr|mr|mrs|ms|prof)\.?\b/g, "")
      .replace(/[^a-z\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(".") || "user";

  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}${suffix}`)) suffix++;
  return `${base}${suffix}`;
}

// =========================================================================
// SERVICE CATEGORIES & SERVICES — built early (right after orgs), because
// employee generation below now needs to know each org's real services in
// order to assign every employee a realistic set of `service_ids`
// (see DESIGNATION_SERVICE_CATEGORIES / computeServiceIdsForOrgEmployee).
// =========================================================================

// Org-scoped service categories, grouped by each organization's business
// type. Each service below belongs to exactly one of these categories, and
// Service.category_id references ServiceCategory.id (not the global
// Category table) — that's what the Services and Service Categories pages
// both look up against.
//
// Exported because this is also the single source of truth for the Super
// Admin "Default Categories" page (see
// src/routes/super-admin/default-categories.tsx) — the platform-wide
// starter-kit templates shown there are built directly from these same
// per-business-type name/description pairs, so the two can never drift
// apart the way a separately maintained seed table could.
export const SERVICE_CATEGORY_DEFS: Record<string, Array<{ name: string; description: string }>> = {
  hospital: [
    { name: "General Consultation", description: "Regular doctor consultations and health checkups" },
    { name: "Diagnostics", description: "Blood tests, scans and laboratory services" },
    { name: "Cardiology", description: "Heart specialist consultations and procedures" },
    { name: "Orthopedics", description: "Bone, joint and muscle treatment services" },
  ],
  clinic: [
    { name: "Family Consultation", description: "General family doctor visits" },
    { name: "Pediatrics", description: "Healthcare services for children" },
    { name: "Eye Care", description: "Vision and eye checkups" },
  ],
  bank: [
    { name: "Account Services", description: "Account opening, closure and updates" },
    { name: "Loans", description: "Loan counselling and processing" },
    { name: "Locker Services", description: "Safe deposit locker management" },
  ],
  retail: [
    { name: "Product Demos", description: "In-store product demonstrations" },
    { name: "Installation & Setup", description: "Installation booking for purchased products" },
    { name: "Exchange & Returns", description: "Product exchange and return handling" },
  ],
  support: [
    { name: "Billing Support", description: "Billing queries and payment issues" },
    { name: "Technical Support", description: "Device and connectivity troubleshooting" },
    { name: "Plan Management", description: "Plan upgrades and changes" },
  ],
};

// Services grouped under the specific category name they belong to (must
// match a name in SERVICE_CATEGORY_DEFS for the same business type).
const SERVICE_DEFS_BY_CATEGORY: Record<string, Record<string, Array<{ name: string; duration: number; fee: number }>>> = {
  hospital: {
    "General Consultation": [{ name: "General Consultation", duration: 20, fee: 600 }],
    "Diagnostics": [
      { name: "Diagnostic Imaging", duration: 45, fee: 2500 },
      { name: "Lab Test Collection", duration: 15, fee: 400 },
    ],
    "Cardiology": [{ name: "Cardiology Consult", duration: 30, fee: 1200 }],
    "Orthopedics": [{ name: "Orthopedic Consultation", duration: 25, fee: 900 }],
  },
  clinic: {
    "Family Consultation": [{ name: "Family Doctor Visit", duration: 15, fee: 500 }],
    "Pediatrics": [{ name: "Pediatric Consult", duration: 20, fee: 700 }],
    "Eye Care": [{ name: "Eye Checkup", duration: 25, fee: 800 }],
  },
  bank: {
    "Account Services": [
      { name: "Account Opening", duration: 30, fee: 0 },
      { name: "Cash Deposit / Withdrawal", duration: 10, fee: 0 },
    ],
    "Loans": [{ name: "Loan Counselling", duration: 45, fee: 0 }],
    "Locker Services": [{ name: "Locker Service", duration: 20, fee: 0 }],
  },
  retail: {
    "Product Demos": [{ name: "Product Demo", duration: 20, fee: 0 }],
    "Installation & Setup": [{ name: "Installation Booking", duration: 15, fee: 0 }],
    "Exchange & Returns": [{ name: "Exchange / Return", duration: 25, fee: 0 }],
  },
  support: {
    "Billing Support": [{ name: "Billing Query", duration: 15, fee: 0 }],
    "Technical Support": [
      { name: "Tech Support", duration: 25, fee: 0 },
      { name: "SIM / Device Replacement", duration: 20, fee: 0 },
    ],
    "Plan Management": [{ name: "Plan Upgrade", duration: 10, fee: 0 }],
  },
};

// Categories are built first so their ids exist before services reference
// them. service_count is patched in afterwards once SERVICES_SEED exists.
const _categoryShells: Array<Omit<ServiceCategory, "service_count"> & { _bizType: string }> = (() => {
  const out: Array<Omit<ServiceCategory, "service_count"> & { _bizType: string }> = [];
  let idx = 0;
  for (const org of ORG_SEED) {
    const defs = SERVICE_CATEGORY_DEFS[org.category] || [];
    defs.forEach((d, i) => {
      out.push({
        id: `svccat_${++idx}`,
        organization_id: org.id,
        name: d.name,
        description: d.description,
        status: i === defs.length - 1 ? "Inactive" : "Active",
        created_at: daysAgo(60 - i),
        _bizType: org.category,
      });
    });
  }
  return out;
})();

export const SERVICES_SEED: Service[] = (() => {
  const out: Service[] = [];
  let idx = 0;
  for (const org of ORG_SEED) {
    const orgCategories = _categoryShells.filter((c) => c.organization_id === org.id);
    for (const category of orgCategories) {
      const defs = SERVICE_DEFS_BY_CATEGORY[org.category]?.[category.name] || [];
      for (const d of defs) {
        out.push({
          id: `svc_${++idx}`,
          organization_id: org.id,
          category_id: category.id,
          name: d.name,
          duration_min: d.duration,
          fee: d.fee,
          status: "active",
          created_at: daysAgo(60),
        });
      }
    }
  }
  return out;
})();

export const SERVICE_CATEGORIES_SEED: ServiceCategory[] = _categoryShells.map(({ _bizType, ...category }) => ({
  ...category,
  service_count: SERVICES_SEED.filter((s) => s.category_id === category.id).length,
}));

// Designation pools per organization category, so an employee's title
// actually matches the kind of business they work at (a bank branch should
// never show a "Doctor" on its Employees page, etc).
const DESIGNATIONS_BY_CATEGORY: Record<string, string[]> = {
  hospital: ["Doctor", "Nurse", "Specialist", "Lab Technician", "Receptionist"],
  clinic: ["Doctor", "Nurse", "Receptionist", "Lab Technician"],
  bank: ["Branch Manager", "Loan Officer", "Cashier", "Customer Officer", "Teller"],
  retail: ["Floor Manager", "Sales Executive", "Cashier", "Store Associate"],
  support: ["Team Lead", "Customer Support Executive", "Technical Support Specialist", "Floor Manager"],
};
const DEFAULT_DESIGNATIONS = ["Customer Officer", "Floor Manager", "Specialist"];

// =========================================================================
// SHIFT KEYS — kept in sync with db.ts's CATEGORY_DEFAULT_SHIFTS
// =========================================================================
export const SHIFT_KEYS = ["morning", "evening", "afternoon", "night", "general", "full_day", "opening", "mid", "closing"];

// Minute ranges for every shift key actually assigned in this file, mirrored
// exactly from db.ts's CATEGORY_DEFAULT_SHIFTS values (so an appointment
// generated "within" an employee's shift lines up with what that shift
// actually means in db.ts). Ranges are in minutes since midnight (not whole
// hours), and overnight shifts (night) extend past 24*60 so downstream
// modulo-arithmetic wraps correctly.
const SHIFT_MINUTE_RANGES: Record<string, { startMinutes: number; endMinutes: number }> = {
  morning: { startMinutes: 6 * 60, endMinutes: 14 * 60 },        // 6:00 AM – 2:00 PM
  evening: { startMinutes: 14 * 60, endMinutes: 22 * 60 },       // 2:00 PM – 10:00 PM
  afternoon: { startMinutes: 14 * 60, endMinutes: 22 * 60 },     // 2:00 PM – 10:00 PM
  night: { startMinutes: 22 * 60, endMinutes: 30 * 60 },         // 10:00 PM – 6:00 AM
  general: { startMinutes: 9 * 60, endMinutes: 17 * 60 },        // 9:00 AM – 5:00 PM
  full_day: { startMinutes: 9 * 60, endMinutes: 18 * 60 },       // 9:00 AM – 6:00 PM
  opening: { startMinutes: 8 * 60, endMinutes: 16 * 60 },        // 8:00 AM – 4:00 PM
  mid: { startMinutes: 11 * 60, endMinutes: 19 * 60 },           // 11:00 AM – 7:00 PM
  closing: { startMinutes: 14 * 60, endMinutes: 22 * 60 },       // 2:00 PM – 10:00 PM
};

export const SHIFT_LABELS: Record<string, string> = {
  morning: "6:00 AM – 2:00 PM",
  evening: "2:00 PM – 10:00 PM",
  afternoon: "2:00 PM – 10:00 PM",
  night: "10:00 PM – 6:00 AM",
  general: "9:00 AM – 5:00 PM",
  full_day: "9:00 AM – 6:00 PM",
  opening: "8:00 AM – 4:00 PM",
  mid: "11:00 AM – 7:00 PM",
  closing: "2:00 PM – 10:00 PM",
};

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10) % 24;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${mStr} ${period}`;
}

// Which shift KEYS are realistic for each organization category.
// Which shift KEYS are realistic for each organization category.
// Exported so pages like org-admin/employees.tsx can scope their Shift
// dropdown to only the shifts valid for the logged-in org's category
// (e.g. a bank should only ever offer "General").
export const CATEGORY_SHIFTS: Record<string, string[]> = {
  hospital: ["morning", "evening", "night"],
  support: ["morning", "afternoon", "night"],
  bank: ["general"],
  clinic: ["full_day"],
  retail: ["opening", "mid", "closing"],
};
export const DEFAULT_SHIFTS = ["morning"];

// Picks a deterministic-but-varied hour+minute inside an employee's shift,
// so appointments actually happen during the hours that employee works
// instead of a flat 9am-5pm window regardless of shift.
function timeWithinShift(shift: string, seed: number): { hour: number; minute: number } {
  const range = SHIFT_MINUTE_RANGES[shift] ?? SHIFT_MINUTE_RANGES.morning;
  const span = range.endMinutes - range.startMinutes;
  const steps = Math.max(1, span / 15);
  const offsetMinutes = (seed % steps) * 15;
  const totalMinutes = (range.startMinutes + offsetMinutes) % (24 * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return { hour, minute };
}

// Deterministic pseudo-random in [-spread, +spread].
function seededNoise(seed: number, spread: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * 2 * spread;
}

// =========================================================================
// EMPLOYEE <-> SERVICE CAPABILITY MAPPING
// =========================================================================
// Which service CATEGORY NAMES (from SERVICE_CATEGORY_DEFS above) each
// designation is qualified to handle, per business type. Used to compute
// every employee's `service_ids` below, so an employee's assigned
// appointments/queue entries always show a service they could plausibly
// perform — a bank Teller should never end up assigned a "Loans"
// appointment, and a hospital Nurse shouldn't get booked for "Cardiology".
const DESIGNATION_SERVICE_CATEGORIES: Record<string, Record<string, string[]>> = {
  hospital: {
    "Doctor": ["General Consultation", "Cardiology", "Orthopedics"],
    "Nurse": ["General Consultation"],
    "Specialist": ["Cardiology", "Orthopedics"],
    "Lab Technician": ["Diagnostics"],
    "Receptionist": ["General Consultation"],
  },
  clinic: {
    "Doctor": ["Family Consultation", "Pediatrics", "Eye Care"],
    "Nurse": ["Family Consultation"],
    "Receptionist": ["Family Consultation"],
    "Lab Technician": ["Family Consultation"],
  },
  bank: {
    "Branch Manager": ["Account Services", "Loans", "Locker Services"],
    "Loan Officer": ["Loans"],
    "Cashier": ["Account Services"],
    "Customer Officer": ["Account Services", "Locker Services"],
    "Teller": ["Account Services"],
  },
  retail: {
    "Floor Manager": ["Product Demos", "Installation & Setup", "Exchange & Returns"],
    "Sales Executive": ["Product Demos"],
    "Cashier": ["Exchange & Returns"],
    "Store Associate": ["Installation & Setup", "Exchange & Returns"],
  },
  support: {
    "Team Lead": ["Billing Support", "Technical Support", "Plan Management"],
    "Customer Support Executive": ["Billing Support", "Plan Management"],
    "Technical Support Specialist": ["Technical Support"],
    "Floor Manager": ["Billing Support", "Technical Support", "Plan Management"],
  },
};

// Resolves an employee's `service_ids`: every Service in their own org that
// belongs to one of the ServiceCategory names their designation is mapped
// to above. Falls back to "every service this org offers" only if the
// mapping produced nothing (so no employee is ever left completely unable
// to serve anyone).
function computeServiceIdsForOrgEmployee(organizationId: string, bizCategory: string, designation: string): string[] {
  const wantedNames = DESIGNATION_SERVICE_CATEGORIES[bizCategory]?.[designation] || [];
  const categoryIds = new Set(
    SERVICE_CATEGORIES_SEED.filter((c) => c.organization_id === organizationId && wantedNames.includes(c.name)).map((c) => c.id)
  );
  const ids = SERVICES_SEED.filter((s) => s.organization_id === organizationId && categoryIds.has(s.category_id)).map((s) => s.id);
  if (ids.length) return ids;
  return SERVICES_SEED.filter((s) => s.organization_id === organizationId).map((s) => s.id);
}

const empNames = ["Aishwarya Menon", "Vikram Singh", "Pooja Reddy", "Arjun Kapoor", "Sneha Iyer", "Rahul Joshi", "Divya Pillai", "Kunal Mehta", "Rina Nair", "Manish Bhat", "Sakshi Verma", "Aditya Rao", "Nidhi Agarwal", "Sahil Kapoor", "Tara Krishnan", "Yash Patel", "Isha Banerjee", "Karthik Murthy", "Lavanya Suresh", "Pranav Kulkarni", "Riya Saxena", "Suraj Pandey", "Anjali Deshpande", "Harsh Vora", "Megha Sinha"];

// Employees are assigned round-robin to orgs (ORG_SEED[i % ORG_SEED.length]),
// so an employee's position *within their own org's* roster is how many
// full cycles through ORG_SEED have happened before this index. Every
// employee now also gets `service_ids` — the actual Services in their org
// that their designation is qualified to perform (see
// DESIGNATION_SERVICE_CATEGORIES / computeServiceIdsForOrgEmployee above).
const GENERATED_EMPLOYEES: SeedEmployee[] = empNames.map((n, i) => {
  const org = ORG_SEED[i % ORG_SEED.length];
  const posWithinOrg = Math.floor(i / ORG_SEED.length);
  const pool = DESIGNATIONS_BY_CATEGORY[org.category] || DEFAULT_DESIGNATIONS;
  const shiftPool = CATEGORY_SHIFTS[org.category] || DEFAULT_SHIFTS;
  const designation = pool[posWithinOrg % pool.length];

  return {
    id: `emp_${i + 1}`,
    organization_id: org.id,
    name: n,
    designation,
    mobile: `+91 9${(8000000000 + i * 12345).toString().slice(1, 10)}`,
    email: n.toLowerCase().replace(/\s/g, ".") + "@indusflow.in",
    shift: shiftPool[posWithinOrg % shiftPool.length],
    status: i % 9 === 0 ? "inactive" : "active",
    rating: 3.5 + (i % 15) / 10,
    service_ids: computeServiceIdsForOrgEmployee(org.id, org.category, designation),
    created_at: daysAgo(60 + i),
  };
});

// Explicit record for the "user_emp2" login account (Nikhil Bhatt, org_5 /
// HDFC Bank Andheri Branch). shift is "general" (banks.general in db.ts).
const NIKHIL_BHATT: SeedEmployee = {
  id: "emp_26",
  organization_id: "org_5",
  name: "Nikhil Bhatt",
  designation: "Customer Officer",
  mobile: "+91 98203 99887",
  email: "nikhil@hdfc.in",
  shift: "general",
  status: "active",
  rating: 4.2,
  service_ids: computeServiceIdsForOrgEmployee("org_5", "bank", "Customer Officer"),
  created_at: daysAgo(140),
};

// Two additional employees for org_1 (Apollo Hospitals Chennai), so org_1
// has more active staff than the round-robin alone would produce.
const ANANYA_KRISHNAN: SeedEmployee = {
  id: "emp_27",
  organization_id: "org_1",
  name: "Ananya Krishnan",
  designation: "Nurse",
  mobile: "+91 98401 55667",
  email: "ananya.krishnan@indusflow.in",
  shift: "evening",
  status: "active",
  rating: 4.3,
  service_ids: computeServiceIdsForOrgEmployee("org_1", "hospital", "Nurse"),
  created_at: daysAgo(90),
};

const DEEPAK_RAO: SeedEmployee = {
  id: "emp_28",
  organization_id: "org_1",
  name: "Deepak Rao",
  designation: "Specialist",
  mobile: "+91 98401 66778",
  email: "deepak.rao@indusflow.in",
  shift: "night",
  status: "active",
  rating: 4.0,
  service_ids: computeServiceIdsForOrgEmployee("org_1", "hospital", "Specialist"),
  created_at: daysAgo(75),
};

// Base roster (before the "force active for any login" patch applied to
// EMPLOYEES_SEED further down, once USERS_SEED — which needs to pick a
// real active employee per org — has been built from this list).
const EMPLOYEES_SEED_BASE: SeedEmployee[] = [...GENERATED_EMPLOYEES, NIKHIL_BHATT, ANANYA_KRISHNAN, DEEPAK_RAO];

// USERS_SEED is built inside an IIFE (rather than a flat array literal)
// because usernames must be generated in-order and checked against every
// username generated so far, to guarantee uniqueness across the whole
// seeded set.
export const USERS_SEED: User[] = (() => {
  const usedUsernames = new Set<string>();
  const takeUsername = (name: string) => {
    const u = generateUsername(name, usedUsernames);
    usedUsernames.add(u.toLowerCase());
    return u;
  };

  const superAdmin: User = {
    id: "user_root",
    name: "Indus Platform Admin",
    email: "superadmin@indusflow.in",
    username: takeUsername("Indus Platform Admin"),
    password: "Super@123",
    role: "super_admin",
    mobile: "+91 99999 00000",
    status: "active",
    created_at: daysAgo(365),
  };

  // One org_admin login per organization, built from that org's own
  // contact_person/email/mobile.
  const orgAdmins: User[] = ORG_SEED.map((org, i) => ({
    id: `user_org_admin_${org.id}`,
    name: org.contact_person,
    email: org.email,
    username: takeUsername(org.contact_person),
    password: DEFAULT_PASSWORD,
    must_reset_password: true,
    role: "org_admin" as const,
    organization_id: org.id,
    mobile: org.mobile,
    status: "active" as const,
    created_at: daysAgo(120 - i * 5),
  }));

  // Hand-picked accounts for org_1 / org_5, kept at these exact ids/emails
  // for backward compatibility (e.g. the login page's demo-credentials
  // panel shows aishwarya@apollochennai.in).
  const emp1: User = {
    id: "user_emp1",
    name: "Dr. Aishwarya Menon",
    email: "aishwarya@apollochennai.in",
    username: takeUsername("Dr. Aishwarya Menon"),
    password: DEFAULT_PASSWORD,
    must_reset_password: true,
    role: "employee",
    organization_id: "org_1",
    employee_id: "emp_1",
    mobile: "+91 98401 11122",
    status: "active",
    created_at: daysAgo(100),
  };
  const emp2: User = {
    id: "user_emp2",
    name: "Nikhil Bhatt",
    email: "nikhil@hdfc.in",
    username: takeUsername("Nikhil Bhatt"),
    password: DEFAULT_PASSWORD,
    must_reset_password: true,
    role: "employee",
    organization_id: "org_5",
    employee_id: "emp_26",
    mobile: "+91 98203 99887",
    status: "active",
    created_at: daysAgo(140),
  };

  // One employee login for every OTHER organization, so no org is left
  // without at least one staff account that can actually sign in and see
  // real schedule/queue/performance data. Picks the first ACTIVE employee
  // already seeded for that org from EMPLOYEES_SEED_BASE, rather than
  // inventing a brand-new employee row — falls back to any employee in
  // that org if every one of them happened to land "inactive".
  const coveredOrgIds = new Set(["org_1", "org_5"]);
  const otherOrgEmployeeLogins: User[] = ORG_SEED.filter((org) => !coveredOrgIds.has(org.id))
    .map((org, i): User | null => {
      const emp =
        EMPLOYEES_SEED_BASE.find((e) => e.organization_id === org.id && e.status === "active") ||
        EMPLOYEES_SEED_BASE.find((e) => e.organization_id === org.id);
      if (!emp) return null;
      return {
        id: `user_emp_${org.id}`,
        name: emp.name,
        email: emp.email,
        username: takeUsername(emp.name),
        password: DEFAULT_PASSWORD,
        must_reset_password: true,
        role: "employee" as const,
        organization_id: org.id,
        employee_id: emp.id,
        mobile: emp.mobile,
        status: "active" as const,
        created_at: daysAgo(90 - i * 3),
      };
    })
    .filter((u): u is User => u !== null);

  // Note: there is no customer portal or customer login in this app —
  // customers only ever book appointments, tracked in CUSTOMERS_SEED below.
  // No "customer" role accounts belong in USERS_SEED.
  return [superAdmin, ...orgAdmins, emp1, emp2, ...otherOrgEmployeeLogins];
})();

// Final employee roster. Any employee a login account resolves to (via
// employee_id) is forced active — a login whose own employee record landed
// "inactive" from the deterministic i % 9 === 0 pattern above would
// silently see an empty dashboard/queue/schedule everywhere, which is
// worse than bending that pattern for this one row.
const loginEmployeeIds = new Set(
  USERS_SEED.filter((u) => u.role === "employee" && u.employee_id).map((u) => u.employee_id!)
);
export const EMPLOYEES_SEED: Employee[] = EMPLOYEES_SEED_BASE.map((e) =>
  loginEmployeeIds.has(e.id) ? { ...e, status: "active" as const } : e
);

const custNames = ["Ananya Sharma", "Rohan Gupta", "Priya Desai", "Aman Khanna", "Neha Saxena", "Ravi Kumar", "Pooja Iyer", "Saurabh Tiwari", "Kavya Reddy", "Ishaan Malhotra", "Tanya Bhatt", "Manav Joshi", "Ritika Sen", "Aditya Nair", "Bhavna Mehta", "Yashika Rao", "Akshay Pillai", "Smita Patil", "Varun Chopra", "Avni Kapoor", "Devansh Rana", "Trisha Banerjee", "Karan Wadhwa", "Sneha Pandey", "Jay Solanki", "Rhea Datta", "Mohit Sinha", "Aarav Mishra", "Anika Vyas", "Parth Goyal", "Ritu Aggarwal", "Sahil Verma", "Ira Bhattacharya", "Naveen Reddy", "Pallavi Joshi", "Rahul Khanna", "Saanvi Shah", "Tejas Murthy", "Uma Krishnan", "Vivaan Kapoor", "Aanya Singh", "Reyansh Patel", "Myra Nair", "Atharv Jain", "Sara Iyer", "Kabir Sethi", "Diya Bose", "Aarush Pillai", "Tara Subramanian", "Mira Hegde"];

export const CUSTOMERS_SEED: Customer[] = custNames.map((n, i) => ({
  id: `cust_${i + 1}`,
  organization_id: ORG_SEED[i % ORG_SEED.length].id,
  name: n,
  mobile: `+91 9${(7000000000 + i * 9871).toString().slice(1, 10)}`,
  email: n.toLowerCase().replace(/\s/g, ".") + "@gmail.com",
  gender: (["male", "female", "other"] as const)[i % 3],
  service: ["General Consultation", "Account Opening", "Product Demo", "Tech Support", "Billing Query"][i % 5],
  status: (["waiting", "in_service", "served"] as const)[i % 3],
  address: ["Indiranagar", "Banjara Hills", "Salt Lake", "Andheri East", "Sector 62"][i % 5],
  created_at: daysAgo(i),
}));

// Employees grouped by their own organization, built from the FINAL
// EMPLOYEES_SEED (so NIKHIL_BHATT/ANANYA_KRISHNAN/DEEPAK_RAO and the
// forced-active login patch are all naturally included — no separate
// special-casing needed).
const EMPLOYEES_BY_ORG: Record<string, Employee[]> = (() => {
  const map: Record<string, Employee[]> = {};
  for (const emp of EMPLOYEES_SEED) {
    if (!map[emp.organization_id]) map[emp.organization_id] = [];
    map[emp.organization_id].push(emp);
  }
  return map;
})();

// Narrows a list of an org's services down to the ones a given employee is
// actually qualified to perform (via their `service_ids`), so every
// appointment/queue entry assigned to that employee shows a service they
// could plausibly deliver. Falls back to the full org service list only if
// the employee has no service_ids at all (shouldn't happen for seeded
// data, but keeps this safe for any employee added later without one).
function capableServicesForEmployee(emp: Employee, orgServices: Service[]): Service[] {
  // Some Employee shapes in tests/mocks may not include `service_ids` in
  // the static type — guard at runtime instead of relying on the TS type.
  const svcIds = (emp as any).service_ids as string[] | undefined;
  if (Array.isArray(svcIds) && svcIds.length) {
    const capable = orgServices.filter((s) => svcIds.includes(s.id));
    if (capable.length) return capable;
  }
  return orgServices;
}

// Ensures every active employee has a handful of TODAY appointments inside
// their own shift window, each using a service that employee is actually
// qualified to perform (see capableServicesForEmployee above) — so no
// employee's queue ever shows a service mismatched to their own
// designation.
function buildTodayAppointmentsForEmployees(employees: Employee[]): Appointment[] {
  const out: Appointment[] = [];
  const statusCycle: Appointment["status"][] = ["completed", "in_progress", "confirmed", "confirmed"];

  employees
    .filter((e) => e.status === "active")
    .forEach((emp, empIdx) => {
      const org = ORG_SEED.find((o) => o.id === emp.organization_id);
      if (!org) return;
      const orgServices = SERVICES_SEED.filter((s) => s.organization_id === org.id);
      if (!orgServices.length) return;
      const capableServices = capableServicesForEmployee(emp, orgServices);

      const countForThisEmployee = 3 + (empIdx % 4); // 3-6 appointments today

      for (let j = 0; j < countForThisEmployee; j++) {
        const seed = empIdx * 7 + j;
        const cust = CUSTOMERS_SEED[seed % CUSTOMERS_SEED.length];
        const svc = capableServices[seed % capableServices.length];
        const { hour, minute } = timeWithinShift(emp.shift, seed);

        out.push({
          id: `apt_today_${emp.id}_${j}`,
          token: `T-D${empIdx}${j}`,
          appointment_no: `ISF-D${(300000 + seed).toString()}`,
          organization_id: org.id,
          customer_id: cust.id,
          customer_name: cust.name,
          customer_mobile: cust.mobile,
          customer_email: cust.email,
          service_id: svc.id,
          service_name: svc.name,
          employee_id: emp.id,
          employee_name: emp.name,
          date: daysFromNow(0),
          time: `${(hour % 24).toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          status: statusCycle[j % statusCycle.length],
          notes: "",
          created_at: daysAgo(0),
          updated_at: daysAgo(0),
        });
      }
    });

  return out;
}

const GENERATED_APPOINTMENTS: Appointment[] = (() => {
  const out: Appointment[] = [];
  const statuses: Appointment["status"][] = ["confirmed", "in_progress", "completed", "completed", "completed", "cancelled", "rescheduled"];

  // Tracks how many appointments have been generated per org so far, so
  // each org's employees are cycled through round-robin.
  const orgAppointmentCounter: Record<string, number> = {};

  for (let i = 0; i < 100; i++) {
    const org = ORG_SEED[i % ORG_SEED.length];
    const orgServices = SERVICES_SEED.filter(s => s.organization_id === org.id);
    const cust = CUSTOMERS_SEED[i % CUSTOMERS_SEED.length];

    const orgEmployees = EMPLOYEES_BY_ORG[org.id] || [];
    const orgIndex = orgAppointmentCounter[org.id] ?? 0;
    orgAppointmentCounter[org.id] = orgIndex + 1;
    const emp = orgEmployees.length ? orgEmployees[orgIndex % orgEmployees.length] : undefined;

    // Service is picked from the ASSIGNED employee's own capable services
    // (not independently of them), so the two can never mismatch the way
    // they used to when service and employee were chosen separately.
    const capableServices = emp ? capableServicesForEmployee(emp, orgServices) : orgServices;
    const svc = capableServices[i % Math.max(capableServices.length, 1)];

    const dayOffset = (i % 14) - 7;
    const date = daysFromNow(dayOffset);
    const { hour, minute } = emp
      ? timeWithinShift(emp.shift, i)
      : { hour: 9 + (i % 8), minute: (i % 4) * 15 };

    out.push({
      id: `apt_${i + 1}`,
      token: `T-${1000 + i}`,
      appointment_no: `ISF-${(100000 + i).toString()}`,
      organization_id: org.id,
      customer_id: cust.id, customer_name: cust.name, customer_mobile: cust.mobile, customer_email: cust.email,
      service_id: svc?.id || "svc_1", service_name: svc?.name || "Consultation",
      employee_id: emp?.id, employee_name: emp?.name,
      date, time: `${(hour % 24).toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      status: statuses[i % statuses.length],
      notes: "",
      created_at: daysAgo(20 - (i % 20)),
      updated_at: daysAgo(15 - (i % 15)),
    });
  }
  return out;
})();

// TODAY appointments for every active employee — covers all of
// EMPLOYEES_SEED, including Nikhil Bhatt (emp_26), Ananya Krishnan
// (emp_27), Deepak Rao (emp_28), and every org's newly added login
// employee, so no employee's dashboard/queue is empty and every service
// shown matches that employee's own capability.
const TODAY_APPOINTMENTS: Appointment[] = buildTodayAppointmentsForEmployees(EMPLOYEES_SEED);

export const APPOINTMENTS_SEED: Appointment[] = [...GENERATED_APPOINTMENTS, ...TODAY_APPOINTMENTS];

// Live queue seeded for every active employee, built generically from
// their own TODAY appointments — so it automatically inherits the
// employee/service matching fixed above with no separate logic needed.
export const QUEUE_SEED: QueueEntry[] = (() => {
  const out: QueueEntry[] = [];

  EMPLOYEES_SEED.filter((e) => e.status === "active").forEach((emp) => {
    const empAppts = APPOINTMENTS_SEED
      .filter((a) => a.employee_id === emp.id && a.date === daysFromNow(0))
      .sort((a, b) => a.time.localeCompare(b.time));

    empAppts.forEach((a, i) => {
      out.push({
        id: `q_${emp.id}_${i + 1}`,
        organization_id: a.organization_id,
        appointment_id: a.id,
        employee_id: emp.id,
        employee_name: emp.name,
        token: a.token,
        customer_name: a.customer_name,
        service: a.service_name,
        position: i + 1,
        status:
          a.status === "completed" ? "done" : a.status === "in_progress" ? "serving" : "waiting",
        wait_minutes: i * 6,
        created_at: daysAgo(0),
      });
    });
  });

  return out;
})();

// Operating hours used to build each org's hourly queue-history line.
const DASHBOARD_TREND_HOURS = Array.from({ length: 12 }, (_, i) => 9 + i); // 9..20

// Hourly queue-length and average-wait-time history per organization, for
// today — powers the Org Admin Dashboard's trend charts.
export const QUEUE_STATS_SEED: HourlyQueueStat[] = (() => {
  const out: HourlyQueueStat[] = [];
  let idx = 0;
  const today = daysFromNow(0);

  ORG_SEED.forEach((org, orgIdx) => {
    DASHBOARD_TREND_HOURS.forEach((hour) => {
      const midday = 13;
      const queueNoise = seededNoise(orgIdx * 31 + hour, 2);
      const queueLength = Math.max(0, Math.round(9 - Math.pow(hour - midday, 2) * 0.32 + queueNoise));

      const waitNoise = seededNoise(orgIdx * 53 + hour + 7, 2.5);
      const avgWaitMinutes = Math.max(2, Math.round(20 - (hour - 9) * 1.3 + waitNoise));

      out.push({
        id: `qstat_${++idx}`,
        organization_id: org.id,
        date: today,
        hour,
        queue_length: queueLength,
        avg_wait_minutes: avgWaitMinutes,
      });
    });
  });

  return out;
})();

export const FEEDBACK_SEED: Feedback[] = (() => {
  const completed = APPOINTMENTS_SEED.filter(a => a.status === "completed").slice(0, 40);
  return completed.map((a, i) => ({
    id: `fb_${i + 1}`,
    organization_id: a.organization_id,
    appointment_id: a.id,
    customer_id: a.customer_id,
    rating: 3 + (i % 3),
    service_quality: 3 + ((i + 1) % 3),
    employee_behaviour: 4 + (i % 2),
    recommend: i % 4 !== 0,
    comments: [
      "Smooth experience and minimal wait.",
      "Staff was courteous and professional.",
      "Process could be faster during peak hours.",
      "Overall satisfied with the service.",
      "Excellent coordination and follow-up.",
    ][i % 5],
    created_at: daysAgo(10 - (i % 10)),
  }));
})();

/**
 * =========================
 * AUDIT LOG ACTION/ENTITY DEFINITIONS
 * =========================
 * Hierarchy:
 *  - Employees have NO audit log of their own — there is no standalone
 *    employee-facing audit page in this app.
 *  - Org Admin audit log -> Employees' actions in their org PLUS the Org
 *    Admin's own actions, merged into one time-sorted feed. This is the
 *    only place employee activity is ever visible.
 *  - Super Admin audit log -> Org Admins' actions across EVERY
 *    organization (a platform-wide oversight view of what org admins are
 *    doing — approvals, staff assignment, logins, etc).
 */
const AUTH_ACTIONS = ["LOGIN", "LOGOUT"];
const DATA_ACTIONS = ["CREATE", "UPDATE", "DELETE", "EXPORT", "STATUS_CHANGE", "ASSIGN", "APPROVE", "REJECT"];

const ENTITIES = [
  "Appointment",
  "Customer",
  "Employee",
  "Service",
  "Organization",
  "User",
  "Queue",
  "Feedback",
];

function pickActionEntity(i: number): { action: string; entity: string } {
  const isAuth = i % 5 === 0;
  if (isAuth) {
    return { action: AUTH_ACTIONS[i % AUTH_ACTIONS.length], entity: "Session" };
  }
  return {
    action: DATA_ACTIONS[i % DATA_ACTIONS.length],
    entity: ENTITIES[i % ENTITIES.length],
  };
}

// Data actions/entities an EMPLOYEE could plausibly generate. Kept
// narrower than the Org Admin's ENTITIES/DATA_ACTIONS above (an employee
// doesn't manage Organization/User records) but deliberately broadened
// beyond the original 4 entities to include Service (e.g. a Doctor or
// Lab Technician marking a service's status) — so an org's audit log
// reflects the full breadth of day-to-day floor activity, not just a
// thin slice of it.
const EMPLOYEE_DATA_ACTIONS = ["CREATE", "UPDATE", "STATUS_CHANGE", "ASSIGN"];
const EMPLOYEE_ENTITIES = ["Appointment", "Queue", "Customer", "Feedback", "Service"];

// Only 1 in 5 entries is a LOGIN/LOGOUT (Session) event — the remaining
// 80% are real data actions across the entity list above. This ratio was
// already correct; the actual reason org audit logs looked
// login/logout-heavy was that EMPLOYEE_ACTIONS_SEED only ever drew from
// the ~10 employees who happen to have login accounts (see note on
// EMPLOYEE_ACTIONS_SEED below) — with such a small, repeating sample,
// the 20% auth rate dominated what was visible. Fixed there, not here.
function pickEmployeeActionEntity(i: number): { action: string; entity: string } {
  const isAuth = i % 5 === 0;
  if (isAuth) {
    return { action: AUTH_ACTIONS[i % AUTH_ACTIONS.length], entity: "Session" };
  }
  return {
    action: EMPLOYEE_DATA_ACTIONS[i % EMPLOYEE_DATA_ACTIONS.length],
    entity: EMPLOYEE_ENTITIES[i % EMPLOYEE_ENTITIES.length],
  };
}

const USERS_POOL = USERS_SEED;

// ---------------------------------------------------------------------
// Employees' raw action history. NOT exported — there is no standalone
// employee audit log page in this app. This feed exists solely to be
// folded into ORG_ADMIN_AUDIT_SEED below, so an org admin can see what
// their own staff did even though employees never see it themselves.
//
// IMPORTANT FIX: this used to be built from
// `USERS_SEED.filter(u => u.role === "employee")`, which is only the
// handful of employees who happen to have a login account (one per org
// — ~10 people total across all 10 orgs). Every other employee on the
// real roster (EMPLOYEES_SEED, 28 people) never appeared in any org's
// audit log at all, and with such a small repeating sample the 20% auth
// (LOGIN/LOGOUT) rate in pickEmployeeActionEntity ended up dominating
// what an org admin actually saw.
//
// Now built from EMPLOYEES_SEED directly (every ACTIVE employee at every
// org, login account or not), round-robinned across a log count that
// scales with roster size — so every staff member shows up, and the mix
// of modules/entities (Appointment, Queue, Customer, Feedback, Service,
// Session) is what an org admin actually sees, not just a thin
// login/logout trickle from one person.
// ---------------------------------------------------------------------
const ACTIVE_EMPLOYEES_FOR_AUDIT = EMPLOYEES_SEED.filter((e) => e.status === "active");

// ~6 logs per active employee (was ~9 logs spread across only 10
// employees total; now spread across the full active roster so
// per-employee volume doesn't collapse as the roster grows, and every
// org with more than one employee actually shows more than one person).
const EMPLOYEE_LOG_COUNT = ACTIVE_EMPLOYEES_FOR_AUDIT.length * 6;

const EMPLOYEE_ACTIONS_SEED: AuditLog[] = Array.from({ length: EMPLOYEE_LOG_COUNT }).map((_, i) => {
  const { action, entity } = pickEmployeeActionEntity(i);

  // Round-robin across every ACTIVE employee at every org — not just the
  // one (if any) who happens to have a login account.
  const emp = ACTIVE_EMPLOYEES_FOR_AUDIT[i % ACTIVE_EMPLOYEES_FOR_AUDIT.length];
  const org = ORG_SEED.find((o) => o.id === emp.organization_id)!;

  const entityId = `${entity.slice(0, 3).toUpperCase()}-${3000 + i}`;

  let details = "";
  switch (action) {
    case "LOGIN":
      details = `${emp.name} logged into the system`;
      break;
    case "LOGOUT":
      details = `${emp.name} logged out of the system`;
      break;
    case "STATUS_CHANGE":
      details = `${emp.name} updated status of ${entity} #${entityId}`;
      break;
    case "ASSIGN":
      details = `${emp.name} assigned ${entity} #${entityId}`;
      break;
    default:
      details = `${emp.name} performed ${action} on ${entity} #${entityId}`;
  }

  // NOTE: modulus must NOT share a factor with the i % 5 === 0 check
  // above (the one that picks LOGIN/LOGOUT) — 30 is a multiple of 5,
  // which made every Login/Logout entry land on i % 30 === 0 (the most
  // recent day) and pushed every other action type off the first page
  // once sorted most-recent-first. 31 is coprime with 5, so auth entries
  // spread across 31 distinct days instead of clustering on one.
  const createdAt = daysAgo(i % 31);

  return {
    // emp.id (an Employee id), not a User id — most employees in this
    // feed have no login account at all, so there's no User row to
    // point user_id at. Both audit pages filter by organization_id, not
    // by resolving user_id against USERS_SEED, so this is safe.
    id: `emp_log_${i + 1}`,
    organization_id: org.id,
    user_id: emp.id,
    user_name: emp.name,
    action,
    entity,
    details,
    created_at: createdAt,
    role: "Employee",
    module_name: entity,
    description: details,
    action_date: createdAt,
  };
});

// ---------------------------------------------------------------------
// Org Admins' OWN actions (login/logout + org-level admin actions like
// approving requests, assigning staff, etc). Reused two ways below:
//   1. As-is, across ALL orgs -> what the Super Admin sees
//   2. Scoped to one org + merged with that org's employee actions ->
//      what an Org Admin sees for their own org
// ---------------------------------------------------------------------
const ORG_ADMIN_ACTIONS_SEED: AuditLog[] = Array.from({ length: 120 }).map((_, i) => {
  const { action, entity } = pickActionEntity(i);

  const orgAdmins = USERS_SEED.filter(u => u.role === "org_admin");
  const user = orgAdmins[i % orgAdmins.length];

  const org = ORG_SEED.find(o => o.id === user.organization_id)!;

  const entityId = `${entity.slice(0, 3).toUpperCase()}-${1000 + i}`;

  let details = "";

  switch (action) {
    case "LOGIN":
      details = `${user.name} logged into the system`;
      break;
    case "LOGOUT":
      details = `${user.name} logged out of the system`;
      break;
    case "STATUS_CHANGE":
      details = `${user.name} updated status of ${entity} #${entityId}`;
      break;
    case "ASSIGN":
      details = `${user.name} assigned ${entity} #${entityId}`;
      break;
    case "APPROVE":
      details = `${user.name} approved ${entity} #${entityId}`;
      break;
    case "REJECT":
      details = `${user.name} rejected ${entity} #${entityId}`;
      break;
    default:
      details = `${user.name} performed ${action} on ${entity} #${entityId}`;
  }

  // Same fix as EMPLOYEE_ACTIONS_SEED above: 31 (not 30) keeps the date
  // spread independent of the i % 5 === 0 Login/Logout check, so both
  // this feed and SUPER_ADMIN_AUDIT_SEED (derived from it) show a mix of
  // action types on the most recent day instead of only logins.
  const createdAt = daysAgo(i % 31);

  return {
    id: `admin_log_${i + 1}`,
    organization_id: org.id,
    user_id: user.id,
    user_name: user.name,

    action,
    entity,
    details,
    created_at: createdAt,

    role: "Org Admin",
    module_name: entity,
    description: details,
    action_date: createdAt,
  };
});

// ---------------------------------------------------------------------
// SUPER ADMIN AUDIT LOG
// What the platform Super Admin sees: Org Admins' activity, across every
// organization (oversight of who's approving/assigning/logging in, etc.
// at the org-admin level, platform-wide).
// ---------------------------------------------------------------------
export const SUPER_ADMIN_AUDIT_SEED: AuditLog[] = ORG_ADMIN_ACTIONS_SEED.map((log, i) => ({
  ...log,
  id: `sa_log_${i + 1}`,
}));

// ---------------------------------------------------------------------
// ORG ADMIN AUDIT LOG
// What a single Org Admin sees for their own org: their Employees'
// actions PLUS their own actions, merged and sorted most-recent-first —
// so nothing that happened in their org is missing from their own view.
// This is the ONLY place employee activity is ever exposed; there is no
// separate employee-facing audit log. With the EMPLOYEE_ACTIONS_SEED fix
// above, this now includes every active employee in the org (not just
// the one with a login account) across every module they can plausibly
// touch (Appointment, Queue, Customer, Feedback, Service, Session) —
// matching the breadth of ENTITIES the Super Admin's feed already had.
// ---------------------------------------------------------------------
export const ORG_ADMIN_AUDIT_SEED: AuditLog[] = [...ORG_ADMIN_ACTIONS_SEED, ...EMPLOYEE_ACTIONS_SEED].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

// Master list across both real audit sources (org-admin actions +
// employee actions). There is no separate "employee audit" bucket — use
// ORG_ADMIN_AUDIT_SEED filtered by organization_id if you need one org's
// combined feed, or AUDIT_SEED for everything platform-wide.
export const AUDIT_SEED: AuditLog[] = [
  ...ORG_ADMIN_ACTIONS_SEED,
  ...EMPLOYEE_ACTIONS_SEED,
];

export const NOTIFICATIONS_SEED: Notification[] = [
  { id: "n_1", role: "super_admin", title: "New organization request", message: "Manipal Hospital Whitefield submitted a registration request.", read: false, created_at: daysAgo(0) },
  { id: "n_2", role: "super_admin", title: "Contact message", message: "New contact form submission from Anjali Verma.", read: false, created_at: daysAgo(1) },
  { id: "n_3", role: "super_admin", title: "Org approved", message: "You approved Cloudnine Hospital JP Nagar.", read: true, created_at: daysAgo(3) },
  { id: "n_4", role: "org_admin", organization_id: "org_1", title: "Appointment created", message: "New appointment ISF-100021 booked for Cardiology Consult.", read: false, created_at: daysAgo(0) },
  { id: "n_5", role: "org_admin", organization_id: "org_1", title: "Feedback received", message: "Ananya Sharma rated her visit 5/5.", read: false, created_at: daysAgo(1) },
  { id: "n_6", role: "org_admin", organization_id: "org_5", title: "Queue surge", message: "Counter wait time crossed 25 minutes.", read: true, created_at: daysAgo(0) },
  { id: "n_7", role: "employee", organization_id: "org_1", user_id: "user_emp1", title: "Appointment assigned", message: "You have been assigned ISF-100022.", read: false, created_at: daysAgo(0) },
  { id: "n_8", role: "employee", organization_id: "org_5", user_id: "user_emp2", title: "Queue assigned", message: "5 customers added to your queue.", read: true, created_at: daysAgo(1) },
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `n_a_${i}`, role: "org_admin" as const, organization_id: ORG_SEED[i % ORG_SEED.length].id,
    title: "Appointment update", message: `Status updated for appointment ISF-${100050 + i}.`, read: i % 2 === 0, created_at: daysAgo(i),
  })),
];

export const CONTACT_SEED: ContactMessage[] = [
  { id: "msg_1", name: "Anjali Verma", email: "anjali.v@example.com", subject: "Demo request", message: "We'd like a demo for a 4-branch dental chain in Pune.", status: "new", created_at: daysAgo(1) },
  { id: "msg_2", name: "Karthik Subramanian", email: "karthik.s@example.com", subject: "Pricing query", message: "Could you share enterprise pricing for hospitals?", status: "new", created_at: daysAgo(2) },
  { id: "msg_3", name: "Meera Iyer", email: "meera.i@example.com", subject: "Partnership", message: "Interested in integration partnership for clinics.", status: "replied", created_at: daysAgo(5) },
];
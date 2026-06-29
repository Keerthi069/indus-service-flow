// Realistic Indian seed data for Indus Service Flow
import type { Category, Organization, OrgRequest, User, Employee, Customer, Service, Appointment, Feedback, AuditLog, Notification, ContactMessage } from "./db";

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

export const ORG_SEED: Organization[] = [
  { id: "org_1", name: "Apollo Hospitals Chennai", category: "hospital", contact_person: "Dr. Ramesh Iyer", email: "admin@apollochennai.in", mobile: "+91 98400 12345", address: "21, Greams Lane", city: "Chennai", state: "Tamil Nadu", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(120) },
  { id: "org_2", name: "Fortis Escorts Hospital", category: "hospital", contact_person: "Anjali Mehra", email: "ops@fortisokhla.in", mobile: "+91 98101 22334", address: "Okhla Road", city: "New Delhi", state: "Delhi", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(98) },
  { id: "org_3", name: "Sunrise Family Clinic", category: "clinic", contact_person: "Dr. Priya Nair", email: "hello@sunriseclinic.in", mobile: "+91 99020 56781", address: "MG Road", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(80) },
  { id: "org_4", name: "Wellness Diagnostics", category: "clinic", contact_person: "Dr. Karan Shah", email: "info@wellnessdiag.in", mobile: "+91 97720 99001", address: "SG Highway", city: "Ahmedabad", state: "Gujarat", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(65) },
  { id: "org_5", name: "HDFC Bank Andheri Branch", category: "bank", contact_person: "Suresh Pillai", email: "andheri.branch@hdfc.in", mobile: "+91 98202 11122", address: "Andheri West", city: "Mumbai", state: "Maharashtra", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(180) },
  { id: "org_6", name: "ICICI Bank Sector 18", category: "bank", contact_person: "Neha Verma", email: "sec18@icici.in", mobile: "+91 98712 33445", address: "Sector 18", city: "Noida", state: "Uttar Pradesh", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(150) },
  { id: "org_7", name: "Croma Phoenix Mall", category: "retail", contact_person: "Rohit Sinha", email: "phoenix@croma.in", mobile: "+91 98330 77889", address: "Phoenix Marketcity", city: "Pune", state: "Maharashtra", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(55) },
  { id: "org_8", name: "Reliance Digital Forum Mall", category: "retail", contact_person: "Meera Krishnan", email: "forum@reliancedigital.in", mobile: "+91 98860 44556", address: "Forum Mall, Koramangala", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", status: "approved", plan: "basic", created_at: daysAgo(40) },
  { id: "org_9", name: "Jio Customer Care Hyderabad", category: "support", contact_person: "Vikram Reddy", email: "hyd.care@jio.in", mobile: "+91 96660 11223", address: "HITEC City", city: "Hyderabad", state: "Telangana", country: "India", logo: "", status: "approved", plan: "enterprise", created_at: daysAgo(200) },
  { id: "org_10", name: "Airtel Customer Hub Kolkata", category: "support", contact_person: "Tanvi Banerjee", email: "kol.hub@airtel.in", mobile: "+91 98301 66778", address: "Salt Lake Sector V", city: "Kolkata", state: "West Bengal", country: "India", logo: "", status: "approved", plan: "professional", created_at: daysAgo(75) },
];

export const REQUESTS_SEED: OrgRequest[] = [
  { id: "req_1", name: "Manipal Hospital Whitefield", category: "hospital", contact_person: "Dr. Aditi Rao", email: "ops@manipalwf.in", mobile: "+91 98452 99887", address: "Whitefield", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", plan: "enterprise", status: "pending", created_at: daysAgo(3) },
  { id: "req_2", name: "Axis Bank Connaught Place", category: "bank", contact_person: "Rajeev Khanna", email: "cp.branch@axis.in", mobile: "+91 98101 55667", address: "Connaught Place", city: "New Delhi", state: "Delhi", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(2) },
  { id: "req_3", name: "Sankara Eye Clinic", category: "clinic", contact_person: "Dr. Lakshmi Subramanian", email: "info@sankaraeye.in", mobile: "+91 96770 88990", address: "Adyar", city: "Chennai", state: "Tamil Nadu", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(5) },
  { id: "req_4", name: "Vijay Sales Borivali", category: "retail", contact_person: "Hemant Joshi", email: "borivali@vijaysales.in", mobile: "+91 99670 11445", address: "Borivali West", city: "Mumbai", state: "Maharashtra", country: "India", logo: "", plan: "basic", status: "pending", created_at: daysAgo(1) },
  { id: "req_5", name: "BSNL Service Center Pune", category: "support", contact_person: "Prakash Deshmukh", email: "pune.sc@bsnl.in", mobile: "+91 98221 33445", address: "Shivajinagar", city: "Pune", state: "Maharashtra", country: "India", logo: "", plan: "basic", status: "pending", created_at: daysAgo(6) },
  { id: "req_6", name: "Cloudnine Hospital JP Nagar", category: "hospital", contact_person: "Dr. Sneha Pai", email: "jpn@cloudnine.in", mobile: "+91 98860 22113", address: "JP Nagar", city: "Bengaluru", state: "Karnataka", country: "India", logo: "", plan: "enterprise", status: "pending", created_at: daysAgo(7) },
  { id: "req_7", name: "Kotak Mahindra Bandra", category: "bank", contact_person: "Shilpa Iyer", email: "bandra@kotak.in", mobile: "+91 98203 77881", address: "Bandra West", city: "Mumbai", state: "Maharashtra", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(4) },
  { id: "req_8", name: "Lenskart Sarath City Mall", category: "retail", contact_person: "Aakash Patil", email: "scm@lenskart.in", mobile: "+91 97053 22119", address: "Sarath City Mall", city: "Hyderabad", state: "Telangana", country: "India", logo: "", plan: "basic", status: "pending", created_at: daysAgo(8) },
  { id: "req_9", name: "Tata Sky Service Center", category: "support", contact_person: "Rahul Saxena", email: "delhi.sc@tatasky.in", mobile: "+91 98185 33667", address: "Karol Bagh", city: "New Delhi", state: "Delhi", country: "India", logo: "", plan: "professional", status: "pending", created_at: daysAgo(2) },
  { id: "req_10", name: "Max Super Speciality Saket", category: "hospital", contact_person: "Dr. Arvind Malhotra", email: "saket@maxhealth.in", mobile: "+91 98106 22115", address: "Saket", city: "New Delhi", state: "Delhi", country: "India", logo: "", plan: "enterprise", status: "pending", created_at: daysAgo(9) },
];

export const USERS_SEED: User[] = [
  { id: "user_root", name: "Indus Platform Admin", email: "superadmin@indusflow.in", password: "Super@123", role: "super_admin", mobile: "+91 99999 00000", status: "active", created_at: daysAgo(365) },
  { id: "user_org1", name: "Dr. Ramesh Iyer", email: "admin@apollochennai.in", password: "Org@1234", role: "org_admin", organization_id: "org_1", mobile: "+91 98400 12345", status: "active", created_at: daysAgo(120) },
  { id: "user_org5", name: "Suresh Pillai", email: "andheri.branch@hdfc.in", password: "Org@1234", role: "org_admin", organization_id: "org_5", mobile: "+91 98202 11122", status: "active", created_at: daysAgo(180) },
  { id: "user_org9", name: "Vikram Reddy", email: "hyd.care@jio.in", password: "Org@1234", role: "org_admin", organization_id: "org_9", mobile: "+91 96660 11223", status: "active", created_at: daysAgo(200) },
  { id: "user_emp1", name: "Dr. Aishwarya Menon", email: "aishwarya@apollochennai.in", password: "Emp@1234", role: "employee", organization_id: "org_1", mobile: "+91 98401 11122", status: "active", created_at: daysAgo(100) },
  { id: "user_emp2", name: "Nikhil Bhatt", email: "nikhil@hdfc.in", password: "Emp@1234", role: "employee", organization_id: "org_5", mobile: "+91 98203 99887", status: "active", created_at: daysAgo(140) },
  { id: "user_cust1", name: "Ananya Sharma", email: "ananya.sharma@gmail.com", password: "Cust@1234", role: "customer", mobile: "+91 99800 11223", status: "active", created_at: daysAgo(20) },
  { id: "user_cust2", name: "Rohan Gupta", email: "rohan.gupta@yahoo.in", password: "Cust@1234", role: "customer", mobile: "+91 98199 44556", status: "active", created_at: daysAgo(15) },
];

const designations = ["Doctor", "Nurse", "Cashier", "Customer Officer", "Sales Executive", "Floor Manager", "Specialist"];
const shifts = ["09:00 - 17:00", "10:00 - 18:00", "12:00 - 20:00", "08:00 - 16:00"];
const empNames = ["Aishwarya Menon", "Vikram Singh", "Pooja Reddy", "Arjun Kapoor", "Sneha Iyer", "Rahul Joshi", "Divya Pillai", "Kunal Mehta", "Rina Nair", "Manish Bhat", "Sakshi Verma", "Aditya Rao", "Nidhi Agarwal", "Sahil Kapoor", "Tara Krishnan", "Yash Patel", "Isha Banerjee", "Karthik Murthy", "Lavanya Suresh", "Pranav Kulkarni", "Riya Saxena", "Suraj Pandey", "Anjali Deshpande", "Harsh Vora", "Megha Sinha"];

export const EMPLOYEES_SEED: Employee[] = empNames.map((n, i) => ({
  id: `emp_${i + 1}`,
  organization_id: ORG_SEED[i % ORG_SEED.length].id,
  name: n,
  designation: designations[i % designations.length],
  mobile: `+91 9${(8000000000 + i * 12345).toString().slice(1, 10)}`,
  email: n.toLowerCase().replace(/\s/g, ".") + "@indusflow.in",
  shift: shifts[i % shifts.length],
  status: i % 9 === 0 ? "inactive" : "active",
  rating: 3.5 + (i % 15) / 10,
  created_at: daysAgo(60 + i),
}));

const custNames = ["Ananya Sharma", "Rohan Gupta", "Priya Desai", "Aman Khanna", "Neha Saxena", "Ravi Kumar", "Pooja Iyer", "Saurabh Tiwari", "Kavya Reddy", "Ishaan Malhotra", "Tanya Bhatt", "Manav Joshi", "Ritika Sen", "Aditya Nair", "Bhavna Mehta", "Yashika Rao", "Akshay Pillai", "Smita Patil", "Varun Chopra", "Avni Kapoor", "Devansh Rana", "Trisha Banerjee", "Karan Wadhwa", "Sneha Pandey", "Jay Solanki", "Rhea Datta", "Mohit Sinha", "Aarav Mishra", "Anika Vyas", "Parth Goyal", "Ritu Aggarwal", "Sahil Verma", "Ira Bhattacharya", "Naveen Reddy", "Pallavi Joshi", "Rahul Khanna", "Saanvi Shah", "Tejas Murthy", "Uma Krishnan", "Vivaan Kapoor", "Aanya Singh", "Reyansh Patel", "Myra Nair", "Atharv Jain", "Sara Iyer", "Kabir Sethi", "Diya Bose", "Aarush Pillai", "Tara Subramanian", "Mira Hegde"];

export const CUSTOMERS_SEED: Customer[] = custNames.map((n, i) => ({
  id: `cust_${i + 1}`,
  organization_id: ORG_SEED[i % ORG_SEED.length].id,
  name: n,
  mobile: `+91 9${(7000000000 + i * 9871).toString().slice(1, 10)}`,
  email: n.toLowerCase().replace(/\s/g, ".") + "@gmail.com",
  gender: (["male", "female", "other"] as const)[i % 3],
  service: ["General Consultation", "Account Opening", "Product Demo", "Tech Support", "Billing Query"][i % 5],
  status: "active",
  address: ["Indiranagar", "Banjara Hills", "Salt Lake", "Andheri East", "Sector 62"][i % 5],
  created_at: daysAgo(i),
}));

const SERVICE_DEFS: Record<string, Array<{ name: string; duration: number; fee: number }>> = {
  hospital: [
    { name: "General Consultation", duration: 20, fee: 600 },
    { name: "Cardiology Consult", duration: 30, fee: 1200 },
    { name: "Diagnostic Imaging", duration: 45, fee: 2500 },
    { name: "Lab Test Collection", duration: 15, fee: 400 },
  ],
  clinic: [
    { name: "Family Doctor Visit", duration: 15, fee: 500 },
    { name: "Pediatric Consult", duration: 20, fee: 700 },
    { name: "Eye Checkup", duration: 25, fee: 800 },
  ],
  bank: [
    { name: "Account Opening", duration: 30, fee: 0 },
    { name: "Loan Counselling", duration: 45, fee: 0 },
    { name: "Locker Service", duration: 20, fee: 0 },
    { name: "Cash Deposit / Withdrawal", duration: 10, fee: 0 },
  ],
  retail: [
    { name: "Product Demo", duration: 20, fee: 0 },
    { name: "Installation Booking", duration: 15, fee: 0 },
    { name: "Exchange / Return", duration: 25, fee: 0 },
  ],
  support: [
    { name: "Billing Query", duration: 15, fee: 0 },
    { name: "SIM / Device Replacement", duration: 20, fee: 0 },
    { name: "Tech Support", duration: 25, fee: 0 },
    { name: "Plan Upgrade", duration: 10, fee: 0 },
  ],
};

export const SERVICES_SEED: Service[] = (() => {
  const out: Service[] = [];
  let idx = 0;
  for (const org of ORG_SEED) {
    const defs = SERVICE_DEFS[org.category] || [];
    for (const d of defs) {
      out.push({
        id: `svc_${++idx}`, organization_id: org.id, category_id: `cat_${org.category}`,
        name: d.name, duration_min: d.duration, fee: d.fee, status: "active", created_at: daysAgo(60),
      });
    }
  }
  return out;
})();

export const APPOINTMENTS_SEED: Appointment[] = (() => {
  const out: Appointment[] = [];
  const statuses: Appointment["status"][] = ["confirmed", "in_progress", "completed", "completed", "completed", "cancelled", "rescheduled"];
  for (let i = 0; i < 100; i++) {
    const org = ORG_SEED[i % ORG_SEED.length];
    const orgServices = SERVICES_SEED.filter(s => s.organization_id === org.id);
    const svc = orgServices[i % Math.max(orgServices.length, 1)];
    const cust = CUSTOMERS_SEED[i % CUSTOMERS_SEED.length];
    const emp = EMPLOYEES_SEED.find(e => e.organization_id === org.id);
    const dayOffset = (i % 14) - 7;
    const date = daysFromNow(dayOffset);
    const hour = 9 + (i % 8);
    const minute = (i % 4) * 15;
    out.push({
      id: `apt_${i + 1}`,
      token: `T-${1000 + i}`,
      appointment_no: `ISF-${(100000 + i).toString()}`,
      organization_id: org.id,
      customer_id: cust.id, customer_name: cust.name, customer_mobile: cust.mobile, customer_email: cust.email,
      service_id: svc?.id || "svc_1", service_name: svc?.name || "Consultation",
      employee_id: emp?.id, employee_name: emp?.name,
      date, time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      status: statuses[i % statuses.length],
      notes: "",
      created_at: daysAgo(20 - (i % 20)),
      updated_at: daysAgo(15 - (i % 15)),
    });
  }
  return out;
})();

export const FEEDBACK_SEED: Feedback[] = (() => {
  const completed = APPOINTMENTS_SEED.filter(a => a.status === "completed").slice(0, 20);
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
const ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "EXPORT",
  "STATUS_CHANGE",
  "ASSIGN",
  "APPROVE",
  "REJECT",
];

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

const ACTION_DETAILS: Record<string, string> = {
  LOGIN: "User logged into the system",
  LOGOUT: "User logged out of the system",
  CREATE: "Created a new record",
  UPDATE: "Updated existing record",
  DELETE: "Deleted a record",
  EXPORT: "Exported data report",
  STATUS_CHANGE: "Changed status of record",
  ASSIGN: "Assigned task or appointment",
  APPROVE: "Approved request",
  REJECT: "Rejected request",
};

const USERS_POOL = USERS_SEED;

/**
 * =========================
 * SUPER ADMIN AUDIT LOGS
 * =========================
 * Platform-wide actions (all orgs)
 */
export const SUPER_ADMIN_AUDIT_SEED: AuditLog[] = Array.from({ length: 60 }).map((_, i) => {
  const action = ACTIONS[i % ACTIONS.length];
  const entity = ENTITIES[i % ENTITIES.length];
  const user = USERS_POOL[0]; // super admin always first user
  const org = ORG_SEED[i % ORG_SEED.length];

  const entityId = `${entity.slice(0, 3).toUpperCase()}-${2000 + i}`;

  return {
    id: `sa_log_${i + 1}`,
    organization_id: org.id, // still linked for visibility
    user_id: user.id,
    user_name: user.name,

    action,
    entity,

    details: `[SUPER ADMIN] ${user.name} performed ${action} on ${entity} #${entityId}`,

    created_at: daysAgo(i % 30),
  };
});

/**
 * =========================
 * ORG ADMIN AUDIT LOGS
 * =========================
 * Only inside their organization
 */
export const ORG_ADMIN_AUDIT_SEED: AuditLog[] = Array.from({ length: 120 }).map((_, i) => {
  const action = ACTIONS[i % ACTIONS.length];
  const entity = ENTITIES[i % ENTITIES.length];

  // pick org admin users only
  const orgAdmins = USERS_SEED.filter(u => u.role === "org_admin");
  const user = orgAdmins[i % orgAdmins.length];

  const org = ORG_SEED[i % ORG_SEED.length];

  const entityId = `${entity.slice(0, 3).toUpperCase()}-${1000 + i}`;

  let details = "";

  switch (action) {
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

  return {
    id: `org_log_${i + 1}`,
    organization_id: org.id,
    user_id: user.id,
    user_name: user.name,

    action,
    entity,
    details,

    created_at: daysAgo(i % 30),
  };
});

export const AUDIT_SEED: AuditLog[] = [
  ...SUPER_ADMIN_AUDIT_SEED,
  ...ORG_ADMIN_AUDIT_SEED,
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
  { id: "n_9", role: "customer", user_id: "user_cust1", title: "Appointment confirmed", message: "Your appointment ISF-100023 is confirmed for tomorrow 10:30.", read: false, created_at: daysAgo(0) },
  { id: "n_10", role: "customer", user_id: "user_cust1", title: "Queue update", message: "You are now position #3 in queue.", read: false, created_at: daysAgo(0) },
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


import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  Globe,
  Monitor,
  LogOut,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  RefreshCw,
  Trash2,
  } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/super-admin/profile")({
  component: SuperAdminProfilePage,
});

// ── Static data ───────────────────────────────────────────────────────────────

const ADMIN = {
  name:      "Arjun Mehta",
  email:     "arjun.mehta@platform.io",
  phone:     "+91 98765 43210",
  role:      "Super Admin",
  avatarInitials: "AM",
  timezone:  "Asia/Kolkata (IST, UTC+5:30)",
  language:  "English (India)",
  joined:    "12 Jan 2023",
  lastLogin: "Today at 09:41 AM",
  mfaEnabled: true,
};

const SESSIONS = [
  { id: 1, device: "Chrome · macOS", location: "Hyderabad, IN", ip: "103.21.58.14",  last: "Active now",          current: true  },
  { id: 2, device: "Safari · iPhone", location: "Hyderabad, IN", ip: "103.21.58.15", last: "2 hours ago",          current: false },
  { id: 3, device: "Chrome · Windows", location: "Mumbai, IN",   ip: "49.36.112.77", last: "Yesterday, 6:14 PM",  current: false },
];

type ActivityType = "security" | "action" | "warning" | "info";

const ACTIVITY: Array<{ icon: typeof Shield; label: string; time: string; type: ActivityType }> = [
  { icon: Shield,       label: "Password changed",                      time: "3 days ago",   type: "security" },
  { icon: CheckCircle,  label: "Approved Stellaris Corp onboarding",    time: "5 days ago",   type: "action"   },
  { icon: AlertTriangle,label: "Flagged Quantum Labs subscription",      time: "1 week ago",   type: "warning"  },
  { icon: User,         label: "Updated profile email",                  time: "2 weeks ago",  type: "info"     },
  { icon: LogOut,       label: "Revoked session from Mumbai device",     time: "1 month ago",  type: "security" },
];

const TIMEZONES = [
  "Asia/Kolkata (IST, UTC+5:30)",
  "Asia/Dubai (GST, UTC+4:00)",
  "Europe/London (GMT, UTC+0:00)",
  "America/New_York (EST, UTC-5:00)",
  "America/Los_Angeles (PST, UTC-8:00)",
];

const LANGUAGES = ["English (India)", "English (US)", "Hindi", "Tamil"];

const NOTIF_DEFAULTS = {
  tenantSignups:  true,
  subscriptionChanges: true,
  securityAlerts: true,
  weeklyDigest:   true,
  systemDowntime: true,
  apiUsageAlerts: false,
} as const;

type NotificationKey = keyof typeof NOTIF_DEFAULTS;

const NOTIFICATION_OPTIONS: Array<{ key: NotificationKey; label: string; sub: string }> = [
  { key: "tenantSignups",       label: "New tenant signups",       sub: "When a new org registers" },
  { key: "subscriptionChanges", label: "Subscription changes",     sub: "Upgrades, downgrades, cancellations" },
  { key: "securityAlerts",      label: "Security alerts",          sub: "Login anomalies, MFA events" },
  { key: "weeklyDigest",        label: "Weekly digest",            sub: "Platform summary every Monday" },
  { key: "systemDowntime",      label: "System downtime",          sub: "Incidents and maintenance windows" },
  { key: "apiUsageAlerts",      label: "API usage alerts",         sub: "When rate limits are approached" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ActivityDot({ type }: { type: "security" | "action" | "warning" | "info" }) {
  const map = {
    security: "bg-blue-500",
    action:   "bg-green-500",
    warning:  "bg-yellow-500",
    info:     "bg-muted-foreground",
  };
  return (
    <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${map[type] ?? map.info}`} />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </CardTitle>
  );
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-start gap-4">
      <Label className="pt-2 text-xs text-muted-foreground">{label}</Label>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SuperAdminProfilePage() {
  // Profile form
  const [name, setName]   = useState(ADMIN.name);
  const [email, setEmail] = useState(ADMIN.email);
  const [phone, setPhone] = useState(ADMIN.phone);
  const [tz, setTz]       = useState(ADMIN.timezone);
  const [lang, setLang]   = useState(ADMIN.language);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [currentPw, setCurrentPw]       = useState("");
  const [newPw, setNewPw]               = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [pwSaved, setPwSaved]           = useState(false);
  const [pwError, setPwError]           = useState("");

  // Notifications
  const [notifs, setNotifs] = useState<Record<NotificationKey, boolean>>(NOTIF_DEFAULTS);

  // Sessions
  const [sessions, setSessions] = useState(SESSIONS);

  // MFA
  const [mfaEnabled, setMfaEnabled] = useState(ADMIN.mfaEnabled);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function saveProfile() {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  function savePassword() {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  }

  function revokeSession(id: number) {
    setSessions((s) => s.filter((x) => x.id !== id));
  }

  function toggleNotif(key: NotificationKey) {
    setNotifs((n) => ({ ...n, [key]: !n[key] }));
  }

  // ── Password strength ────────────────────────────────────────────────────────
  const strength = !newPw ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^A-Za-z0-9]/.test(newPw) ? 4 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-400", "bg-green-500"][strength];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Profile"
          subtitle="Manage your super admin account and preferences."
        />
      </div>

      {/* ── Top: Avatar + identity card ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Identity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <SectionTitle>Personal information</SectionTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-5">

            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold select-none">
                {ADMIN.avatarInitials}
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{ADMIN.role}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Member since {ADMIN.joined}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto h-8 text-xs">
                Change photo
              </Button>
            </div>

            <div className="border-t" />

            {/* Fields */}
            <div className="space-y-4">
              <FieldRow label="Full name">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
              </FieldRow>
              <FieldRow label="Email address">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-sm" type="email" />
              </FieldRow>
              <FieldRow label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-sm" type="tel" />
              </FieldRow>
              <FieldRow label="Timezone">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-full justify-start text-xs font-normal text-foreground">
                      <Globe className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {tz}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    {TIMEZONES.map((t) => (
                      <DropdownMenuItem key={t} onClick={() => setTz(t)} className="text-xs">
                        {tz === t && <Check className="mr-2 h-3 w-3 text-primary" />}
                        {tz !== t && <span className="mr-5" />}
                        {t}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldRow>
              <FieldRow label="Language">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-full justify-start text-xs font-normal text-foreground">
                      {lang}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {LANGUAGES.map((l) => (
                      <DropdownMenuItem key={l} onClick={() => setLang(l)} className="text-xs">
                        {lang === l && <Check className="mr-2 h-3 w-3 text-primary" />}
                        {lang !== l && <span className="mr-5" />}
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldRow>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <Button size="sm" className="h-8 text-xs" onClick={saveProfile}>
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right col: role + last login + activity */}
        <div className="flex flex-col gap-4">

          {/* Role card */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Access level</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{ADMIN.role}</p>
                  <p className="text-xs text-muted-foreground">Full platform access</p>
                </div>
              </div>
              <div className="border-t pt-3 space-y-1.5">
                {[
                  "Manage all organizations",
                  "View platform reports",
                  "Manage subscriptions",
                  "Configure platform settings",
                  "Access audit logs",
                ].map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    {perm}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Last login */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Login info</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {[
                { Icon: Clock,   label: "Last login",   val: ADMIN.lastLogin   },
                { Icon: Mail,    label: "Email",        val: email             },
                { Icon: Monitor, label: "Device",       val: "Chrome · macOS" },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xs font-medium text-foreground truncate">{val}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Security row ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Change password */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <SectionTitle>Change password</SectionTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <FieldRow label="Current password">
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="h-8 text-sm pr-8"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </FieldRow>
            <FieldRow label="New password">
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="h-8 text-sm pr-8"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {/* Strength meter */}
              {newPw && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-colors ${strength >= s ? strengthColor : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${["","text-red-500","text-yellow-500","text-blue-400","text-green-500"][strength]}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </FieldRow>
            <FieldRow label="Confirm password">
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="h-8 text-sm pr-8"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </FieldRow>
            {pwError && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />{pwError}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 border-t pt-3">
              {pwSaved && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" /> Password updated
                </span>
              )}
              <Button size="sm" className="h-8 text-xs" onClick={savePassword}>
                Update password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* MFA */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Two-factor authentication</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${mfaEnabled ? "bg-green-50 dark:bg-green-950" : "bg-muted"}`}>
                    <Smartphone className={`h-4 w-4 ${mfaEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Authenticator app
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mfaEnabled
                        ? "MFA is active — your account is protected."
                        : "Add an extra layer of security to your account."}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  mfaEnabled
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {mfaEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant={mfaEnabled ? "outline" : "default"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setMfaEnabled((v) => !v)}
                >
                  {mfaEnabled ? "Disable MFA" : "Enable MFA"}
                </Button>
                {mfaEnabled && (
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <RefreshCw className="mr-1.5 h-3 w-3" />
                    Regenerate codes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Sessions + notifications + activity ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Active sessions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <SectionTitle>Active sessions</SectionTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {sessions.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-0">
            {sessions.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-start justify-between gap-3 py-3 ${i < sessions.length - 1 ? "border-b" : ""}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border bg-muted/40">
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{s.device}</p>
                      {s.current && (
                        <span className="flex-shrink-0 rounded-full bg-green-50 border border-green-200 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
                          current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.location} · {s.ip}</p>
                    <p className="text-xs text-muted-foreground">{s.last}</p>
                  </div>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-red-500"
                    onClick={() => revokeSession(s.id)}
                    title="Revoke session"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <div className="pt-3 border-t">
              <Button variant="outline" size="sm" className="h-8 w-full text-xs text-red-500 hover:text-red-600 hover:border-red-300">
                Revoke all other sessions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <SectionTitle>Notifications</SectionTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-0">
            {NOTIFICATION_OPTIONS.map(({ key, label, sub }, i, arr) => (
              <div
                key={key}
                className={`flex items-center justify-between gap-3 py-3 ${i < arr.length - 1 ? "border-b" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleNotif(key)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    notifs[key] ? "bg-primary" : "bg-muted"
                  }`}
                  role="switch"
                  aria-checked={notifs[key]}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                      notifs[key] ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <SectionTitle>Recent activity</SectionTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-0">
            {ACTIVITY.map(({ icon: Icon, label, time, type }, i) => (
              <div
                key={label}
                className={`flex items-start gap-2.5 py-3 ${i < ACTIVITY.length - 1 ? "border-b" : ""}`}
              >
                <ActivityDot type={type} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground leading-snug">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Danger zone ── */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader className="pb-2 pt-4 px-4">
          <SectionTitle>Danger zone</SectionTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Delete super admin account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete this account and remove all access. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-shrink-0 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

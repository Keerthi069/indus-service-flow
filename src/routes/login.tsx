import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, rolePortalPath } from "@/lib/auth";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  User,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login · Indus Service Flow" },
      {
        name: "description",
        content: "Sign in to your Indus Service Flow account.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, isHydrated } = useAuth();
  const nav = useNavigate();
  const search = useSearch({ from: "/login" });

  // Renamed from `email` to `identifier` — this field now accepts either
  // the account's email address OR its generated username (see
  // findUserByIdentifier in lib/mock/db.ts). The variable name changed but
  // the shape of the login() call itself hasn't.
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isHydrated || !user) return;

    const target = search.redirect || rolePortalPath(user.role);

    nav({
      to: target,
      replace: true,
    });
  }, [isHydrated, user, search.redirect, nav]);

  function submit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    setTimeout(() => {
      const u = login(identifier.trim(), password);

      setLoading(false);

      if (!u) {
        toast.error("Invalid email/username or password");
        return;
      }

      const target = search.redirect || rolePortalPath(u.role);

      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);

      // Nudge anyone still on their auto-generated default password to
      // change it, without blocking their sign-in.
      if (u.must_reset_password) {
        toast.message("For security, please reset your password.", {
          description: "You're currently using the default password assigned to your account.",
          action: {
            label: "Reset now",
            onClick: () => nav({ to: "/forgot-password" }),
          },
        });
      }

      nav({
        to: target,
        replace: true,
      });
    }, 400);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 flex items-center justify-center px-4 py-10">
      {/* Faint ambient rings, echoing the "flow" motif used across the
         product's teal accent — quiet, not decorative-for-its-own-sake. */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <svg viewBox="0 0 600 600" className="absolute -right-32 -top-32 h-[420px] w-[420px]">
          <circle cx="300" cy="300" r="120" fill="none" stroke="#0d9488" strokeWidth="1" />
          <circle cx="300" cy="300" r="200" fill="none" stroke="#0d9488" strokeWidth="1" />
        </svg>
        <svg viewBox="0 0 600 600" className="absolute -bottom-40 -left-32 h-[420px] w-[420px]">
          <circle cx="300" cy="300" r="140" fill="none" stroke="#0d9488" strokeWidth="1" />
          <circle cx="300" cy="300" r="220" fill="none" stroke="#0d9488" strokeWidth="1" />
        </svg>
      </div>

      <Card className="relative w-full max-w-lg rounded-3xl border-0 bg-white/90 shadow-2xl backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Link>
            </Button>

            <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">
              <Sparkles className="h-3 w-3" /> Indus Service Flow
            </span>
          </div>

          <CardTitle className="mt-3 text-3xl font-bold tracking-tight">Sign in</CardTitle>

          <CardDescription>Access your Indus Service Flow account.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-1.5">
              <Label htmlFor="identifier" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email or Username
              </Label>

              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or your.username"
                className="h-10 rounded-lg"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Password
                </Label>

                <Link to="/forgot-password" className="text-xs font-medium text-teal-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="pwd"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Remember me
            </label>

            <Button
              disabled={loading || !isHydrated}
              type="submit"
              className="mt-1 h-10 w-full rounded-lg bg-teal-600 hover:bg-teal-700"
            >
              {loading || !isHydrated ? "Signing in..." : "Login"}
            </Button>
          </form>

          {/* Demo credentials — restyled as small ID-badge-style rows
             (role icon + mono identifier + mono password chip) instead of
             a plain text dump, so they scan at a glance. */}
          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Demo accounts
            </p>

            <div className="mt-2.5 space-y-2">
              <DemoRow icon={ShieldCheck} role="Super Admin" identifier="superadmin@indusflow.in" pwd="Super@123" />
              <DemoRow icon={Building2} role="Org Admin" identifier="ramesh.iyer@apollochennai.in" pwd="Welcome@123" />
              <DemoRow icon={User} role="Employee" identifier="aishwarya@apollochennai.in" pwd="Welcome@123" />
            </div>

            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground/80">
              Org Admin and Employee accounts can also sign in with their generated username instead
              of email, and are prompted to set their own password via "Forgot password?" on first login.
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register-organization" className="font-medium text-teal-700 hover:underline">
              Register Organization
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoRow({
  icon: Icon,
  role,
  identifier,
  pwd,
}: {
  icon: typeof User;
  role: string;
  identifier: string;
  pwd: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-2.5 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 truncate">
          <span className="block text-[11px] font-semibold text-foreground">{role}</span>
          <span className="block truncate font-mono text-[10.5px] text-muted-foreground">{identifier}</span>
        </span>
      </span>
      <code className="shrink-0 rounded bg-teal-50 px-1.5 py-1 font-mono text-[10.5px] font-medium text-teal-700">
        {pwd}
      </code>
    </div>
  );
}
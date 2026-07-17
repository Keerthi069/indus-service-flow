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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg border rounded-2xl shadow-sm">
        <CardHeader>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2 w-fit"
          >
            <Link to="/">← Back to Home</Link>
          </Button>

          <CardTitle className="text-3xl font-bold">
            Sign In
          </CardTitle>

          <CardDescription>
            Access your Indus Service Flow account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={submit}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="identifier">
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
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd">
                  Password
                </Label>

                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Input
                id="pwd"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
              />
              Remember me
            </label>

            <Button
              disabled={loading || !isHydrated}
              type="submit"
              className="w-full"
            >
              {loading || !isHydrated
                ? "Signing in..."
                : "Login"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">
              Demo Accounts
            </div>

            <div className="mt-1 grid gap-0.5">
              <div>
                Super Admin ·{" "}
                <code>superadmin@indusflow.in</code> /{" "}
                <code>Super@123</code>
              </div>

              <div>
                Org Admin ·{" "}
                <code>ramesh.iyer@apollochennai.in</code> /{" "}
                <code>Welcome@123</code>
              </div>

              <div>
                Employee ·{" "}
                <code>aishwarya@apollochennai.in</code> /{" "}
                <code>Welcome@123</code>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-muted-foreground/80">
              Org Admin and Employee accounts can also sign in with their generated
              username instead of email, and are prompted to set their own password
              via "Forgot password?" on first login.
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register-organization"
              className="font-medium text-primary hover:underline"
            >
              Register Organization
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { resetPasswordByIdentifier } from "@/lib/mock/db";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password · Indus Service Flow" },
      {
        name: "description",
        content: "Reset the password for your Indus Service Flow account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [mobile, setMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (newPassword !== confirmPassword) {
      setResult({ ok: false, message: "Passwords do not match." });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const outcome = resetPasswordByIdentifier(identifier.trim(), mobile.trim(), newPassword);
      setResult(outcome);
      setLoading(false);

      if (outcome.ok) {
        toast.success(outcome.message);
        setIdentifier("");
        setMobile("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => nav({ to: "/login" }), 1200);
      } else {
        toast.error(outcome.message);
      }
    }, 300);
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
            <Link to="/login">← Back to Sign In</Link>
          </Button>

          <CardTitle className="text-3xl font-bold">
            Reset Password
          </CardTitle>

          <CardDescription>
            Enter your email or username and the mobile number registered on your account
            to set a new password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
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
              <Label htmlFor="mobile">
                Registered Mobile Number
              </Label>

              <Input
                id="mobile"
                type="tel"
                autoComplete="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="newPassword">
                New Password
              </Label>

              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">
                Confirm New Password
              </Label>

              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <Button
              disabled={loading}
              type="submit"
              className="w-full"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          {result && (
            <p
              className={`mt-4 text-sm ${
                result.ok ? "text-green-600" : "text-destructive"
              }`}
            >
              {result.message}
            </p>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
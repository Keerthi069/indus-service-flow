import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/mock/db";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password · Indus Service Flow" }, { name: "description", content: "Reset your Indus Service Flow account password." }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [generated, setGenerated] = useState("");
  const nav = useNavigate();

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    const u = db.all("users").find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!u) { toast.error("No account found for that email"); return; }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGenerated(code);
    toast.success(`OTP sent. (Demo OTP: ${code})`);
    setStep(2);
  }
  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (otp !== generated) { toast.error("Incorrect OTP"); return; }
    setStep(3);
  }
  function reset(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (pwd !== pwd2) { toast.error("Passwords do not match"); return; }
    const u = db.all("users").find(x => x.email.toLowerCase() === email.toLowerCase());
    if (u) db.update("users", u.id, { password: pwd } as never);
    toast.success("Password reset. Please sign in.");
    nav({ to: "/login", search: { redirect: undefined } });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Waves className="h-4 w-4" /></span>
            Indus Service Flow
          </Link>
          <CardTitle className="font-display text-2xl">Reset password</CardTitle>
          <CardDescription>Step {step} of 3 — {step === 1 ? "enter your email" : step === 2 ? "verify the code" : "set a new password"}.</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form className="grid gap-4" onSubmit={sendOtp}>
              <div className="grid gap-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <Button type="submit">Send OTP</Button>
            </form>
          )}
          {step === 2 && (
            <form className="grid gap-4" onSubmit={verify}>
              <div className="grid gap-1.5"><Label>6-digit OTP</Label><Input required value={otp} onChange={e => setOtp(e.target.value)} placeholder="••••••" /></div>
              <div className="flex gap-2"><Button type="submit" className="flex-1">Verify</Button><Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button></div>
            </form>
          )}
          {step === 3 && (
            <form className="grid gap-4" onSubmit={reset}>
              <div className="grid gap-1.5"><Label>New password</Label><Input type="password" required value={pwd} onChange={e => setPwd(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Confirm password</Label><Input type="password" required value={pwd2} onChange={e => setPwd2(e.target.value)} /></div>
              <Button type="submit">Reset password</Button>
            </form>
          )}
          <div className="mt-4 text-center text-xs text-muted-foreground"><Link to="/login" search={{ redirect: undefined }} className="hover:text-foreground">Back to login</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}

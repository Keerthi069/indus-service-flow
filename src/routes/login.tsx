import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, rolePortalPath } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Indus Service Flow" }, { name: "description", content: "Sign in to your Indus Service Flow account." }] }),
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const u = login(email.trim(), password);
      setLoading(false);
      if (!u) { toast.error("Invalid email or password"); return; }
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      nav({ to: search.redirect || rolePortalPath(u.role) });
    }, 400);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-foreground/10"><Waves className="h-5 w-5" /></span>
          Indus Service Flow
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight">Operate appointments and queues with calm precision.</h1>
          <p className="mt-3 max-w-md text-primary-foreground/80">One workspace for hospitals, clinics, banks, retail and customer support — purpose-built for India.</p>
        </div>
        <div className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} Indus Service Flow</div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 w-fit"><Link to="/">← Back to home</Link></Button>
            <CardTitle className="font-display text-2xl">Sign in</CardTitle>
            <CardDescription>Use your registered email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.in" /></div>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between"><Label htmlFor="pwd">Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link></div>
                <Input id="pwd" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={v => setRemember(!!v)} /> Remember me
              </label>
              <Button disabled={loading} type="submit" className="w-full">{loading ? "Signing in..." : "Login"}</Button>
            </form>
            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">Demo accounts</div>
              <div className="mt-1 grid gap-0.5">
                <div>Super Admin · <code>superadmin@indusflow.in</code> / <code>Super@123</code></div>
                <div>Org Admin · <code>admin@apollochennai.in</code> / <code>Org@1234</code></div>
                <div>Employee · <code>aishwarya@apollochennai.in</code> / <code>Emp@1234</code></div>
                <div>Customer · <code>ananya.sharma@gmail.com</code> / <code>Cust@1234</code></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/mock/db";
import { useState } from "react";

export const Route = createFileRoute("/customer/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", mobile: user?.mobile || "", address: "" });
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (user) db.update("users", user.id, { name: form.name, mobile: form.mobile } as never);
    toast.success("Profile updated");
  }
  return (
    <div>
      <PageHeader title="My profile" subtitle="Keep your contact details current." />
      <Card className="max-w-2xl"><CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={save}>
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary">{user?.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span>
              <Button type="button" variant="outline">Upload photo</Button>
            </div>
            <div className="grid gap-1.5"><Label>Full name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={form.email} disabled /></div>
            <div className="grid gap-1.5"><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Address</Label><Textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <Button type="submit" className="justify-self-start">Save changes</Button>
          </form>
        </CardContent></Card>
    </div>
  );
}

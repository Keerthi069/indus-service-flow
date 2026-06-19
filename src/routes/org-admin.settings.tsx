import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = useAuth();
  const org = useDb(() => db.all("organizations").find(o => o.id === user?.organization_id));
  if (!org) return null;
  return (
    <div>
      <PageHeader title="Organization settings" subtitle="Configure your branch profile and preferences." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Organization name" defaultValue={org.name} onSave={v => db.update("organizations", org.id, { name: v } as never)} />
            <Field label="Contact person" defaultValue={org.contact_person} onSave={v => db.update("organizations", org.id, { contact_person: v } as never)} />
            <Field label="Email" defaultValue={org.email} onSave={v => db.update("organizations", org.id, { email: v } as never)} />
            <Field label="Mobile" defaultValue={org.mobile} onSave={v => db.update("organizations", org.id, { mobile: v } as never)} />
          </CardContent></Card>
        <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <label className="flex items-center justify-between rounded-md border border-border p-3 text-sm"><span>New appointment</span><Switch defaultChecked /></label>
            <label className="flex items-center justify-between rounded-md border border-border p-3 text-sm"><span>Queue surge alerts</span><Switch defaultChecked /></label>
            <label className="flex items-center justify-between rounded-md border border-border p-3 text-sm"><span>Daily summary email</span><Switch /></label>
          </CardContent></Card>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, onSave }: { label: string; defaultValue: string; onSave: (v: string) => void }) {
  return (
    <form className="grid gap-1.5" onSubmit={e => { e.preventDefault(); const v = (e.target as HTMLFormElement).elements.namedItem("v") as HTMLInputElement; onSave(v.value); toast.success("Saved"); }}>
      <Label>{label}</Label>
      <div className="flex gap-2"><Input name="v" defaultValue={defaultValue} /><Button type="submit" variant="outline">Save</Button></div>
    </form>
  );
}

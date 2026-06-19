import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { db } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform-level configuration." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5"><Label>Platform Name</Label><Input defaultValue="Indus Service Flow" /></div>
            <div className="grid gap-1.5"><Label>Support Email</Label><Input defaultValue="support@indusflow.in" /></div>
            <div className="grid gap-1.5"><Label>Default Time Zone</Label><Input defaultValue="Asia/Kolkata" /></div>
            <Button className="justify-self-start" onClick={() => toast.success("Saved")}>Save</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5"><Label>Brand Primary Color</Label><Input defaultValue="#0F766E" /></div>
            <div className="grid gap-1.5"><Label>Brand Secondary Color</Label><Input defaultValue="#06B6D4" /></div>
            <Button className="justify-self-start" onClick={() => toast.success("Saved")}>Save</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Toggle label="Email notifications" defaultChecked />
            <Toggle label="SMS notifications" />
            <Toggle label="In-app notifications" defaultChecked />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Security</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Toggle label="Enforce two-factor authentication" />
            <Toggle label="Idle session timeout (30 min)" defaultChecked />
            <Toggle label="Audit-log every action" defaultChecked />
            <Button variant="destructive" className="justify-self-start" onClick={() => { db.reset(); toast.success("Demo data restored"); }}>Reset demo data</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return <label className="flex items-center justify-between rounded-md border border-border p-3 text-sm"><span>{label}</span><Switch defaultChecked={defaultChecked} /></label>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { db, uid, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/customer/feedback")({ component: FB });

function FB() {
  const { user } = useAuth();
  const completed = useDb(() => db.all("appointments").filter(a => a.customer_email === user?.email && a.status === "completed"));
  const feedback = useDb(() => db.all("feedback"));
  const eligible = completed.filter(c => !feedback.some(f => f.appointment_id === c.id));

  if (eligible.length === 0) return (
    <div><PageHeader title="Feedback" subtitle="Available after appointment completion." />
      <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No completed appointments awaiting feedback.</CardContent></Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Feedback" subtitle="Help us improve your next visit." />
      <div className="grid gap-4">
        {eligible.map(apt => <FeedbackForm key={apt.id} apt={apt} userId={user!.id} />)}
      </div>
    </div>
  );
}

function FeedbackForm({ apt, userId }: { apt: any; userId: string }) {
  const [r, setR] = useState(5);
  const [sq, setSq] = useState(5);
  const [eb, setEb] = useState(5);
  const [comments, setComments] = useState("");
  const [rec, setRec] = useState(true);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    db.insert("feedback", {
      id: uid("fb"), organization_id: apt.organization_id, appointment_id: apt.id,
      customer_id: userId, rating: r, service_quality: sq, employee_behaviour: eb,
      recommend: rec, comments, created_at: new Date().toISOString(),
    });
    toast.success("Thank you for your feedback!");
  }
  return (
    <Card><CardHeader><CardTitle className="text-base">{apt.service_name} · {apt.date}</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <Rating label="Overall rating" value={r} onChange={setR} />
          <Rating label="Service quality" value={sq} onChange={setSq} />
          <Rating label="Employee behaviour" value={eb} onChange={setEb} />
          <label className="flex items-center justify-between rounded-md border border-border p-3 text-sm"><span>Would you recommend this service?</span><Switch checked={rec} onCheckedChange={setRec} /></label>
          <Textarea rows={3} placeholder="Comments..." value={comments} onChange={e => setComments(e.target.value)} />
          <Button type="submit" className="justify-self-start">Submit feedback</Button>
        </form>
      </CardContent></Card>
  );
}

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} star`}>
            <Star className={`h-6 w-6 ${n <= value ? "fill-warning text-warning" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

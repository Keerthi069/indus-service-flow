
import React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/register-organization")({
  component: RegisterOrganization,
});

function RegisterOrganization() {
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    toast.success("Organization registered successfully");

    setTimeout(() => {
      navigate({ to: "/login" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="bg-white border rounded-2xl shadow-sm p-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            ← Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Register Organization
            </h1>

            <p className="mt-2 text-muted-foreground">
              Create your organization account to start managing
              appointments, queues, employees and customer flow.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="grid md:grid-cols-2 gap-5"
          >
            <Field label="Organization Name" full>
              <Input
                placeholder="ABC Hospital"
                className="h-10"
                required
              />
            </Field>

            <Field label="Category">
              <Select>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="retail">Retail Store</SelectItem>
                  <SelectItem value="support">
                    Customer Support Center
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Contact Person">
              <Input
                placeholder="Rahul Mehta"
                className="h-10"
                required
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                placeholder="admin@example.com"
                className="h-10"
                required
              />
            </Field>

            <Field label="Mobile">
              <Input
                placeholder="+91 9876543210"
                className="h-10"
                required
              />
            </Field>

 <Field label="Address">
  <Input
    placeholder="Street, Area, Landmark"
    className="h-10"
  />
</Field>

<Field label="City">
  <Input
    placeholder="Mumbai"
    className="h-10"
  />
</Field>

<Field label="State">
  <Input
    placeholder="Maharashtra"
    className="h-10"
  />
</Field>

<Field label="Pincode">
  <Input
    placeholder="400001"
    className="h-10"
  />
</Field>
            <div className="md:col-span-2 pt-2">
              <Button
                type="submit"
                className="w-full h-11"
              >
                Register Organization
              </Button>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-2 ${full ? "md:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

import React, { useState } from "react";
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

  const [category, setCategory] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    toast.success("Organization registered successfully");

    setTimeout(() => {
      navigate({ to: "/login", search: {} });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl rounded-xl border bg-background p-8 shadow-sm">
        <Link
          to="/"
          search={{}}
          className="inline-flex items-center text-sm text-primary hover:underline mb-6"
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
            <Select value={category} onValueChange={setCategory}>
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
              type="tel"
              placeholder="+91 9876543210"
              className="h-10"
              required
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              placeholder="Enter password"
              className="h-10"
              required
            />
          </Field>

          <Field label="Address" full>
            <Input
              placeholder="Enter organization address"
              className="h-10"
              required
            />
          </Field>

          <div className="md:col-span-2 space-y-4">
            <Button
              type="submit"
              className="w-full h-10"
            >
              Register Organization
            </Button>

            <p className="text-center text-sm text-muted-foreground">
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
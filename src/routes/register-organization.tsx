import React, { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  Landmark,
  Globe,
  Hash,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/register-organization")({
  component: RegisterOrganization,
});

const CATEGORIES = [
  "Hospital",
  "Clinic",
  "Bank",
  "Retail Store",
  "Customer Support Center",
];

// India's current 28 states (Jammu & Kashmir moved to a union territory in 2019,
// which is why the historical "29 states" figure is now 28).
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

function RegisterOrganization() {
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [category, setCategory] = useState("");
  // Organisation's OWN contact details — a general helpline/front-desk
  // number and a role-based inbox (info@/contact@/helpdesk@), distinct
  // from the individual contact person's personal mobile/email below.
  // Maps to Organization.org_mobile / Organization.org_email in db.ts.
  const [orgMobile, setOrgMobile] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast.error("Enter the organisation name");
      return;
    }
    if (!category) {
      toast.error("Select an organisation category");
      return;
    }
    if (!orgMobile.trim()) {
      toast.error("Enter the organisation's mobile number");
      return;
    }
    if (!orgEmail.trim()) {
      toast.error("Enter the organisation's email address");
      return;
    }
    if (!contactPerson.trim()) {
      toast.error("Enter the contact person's name");
      return;
    }
    if (!mobile.trim()) {
      toast.error("Enter a mobile number");
      return;
    }
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    if (!address.trim()) {
      toast.error("Enter the organisation address");
      return;
    }
    if (!city.trim()) {
      toast.error("Enter a city");
      return;
    }
    if (!pincode.trim()) {
      toast.error("Enter a pincode");
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    if (!state) {
      toast.error("Select a state");
      return;
    }

    toast.success("Organisation registered");

    setTimeout(() => {
      navigate({ to: "/login", search: { redirect: undefined } });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="px-8 pt-8 pb-2 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Register your organisation
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up queues, appointments, and staff in one place.
            </p>
          </div>

          <form onSubmit={submit} className="px-8 pb-8 pt-6 space-y-8">
            {/* Section: organisation */}
            <FormSection label="Organisation">
              <IconInput
                icon={Building2}
                placeholder="Organisation name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <IconSelect
                icon={Briefcase}
                value={category}
                onValueChange={setCategory}
                placeholder="Organisation category"
              >
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </IconSelect>
            </FormSection>

            {/* Section: organisation's own contact details (helpline /
                general inbox — separate from the individual contact
                person's personal mobile/email in the section below) */}
            <FormSection label="Organisation contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IconInput
                  icon={Phone}
                  type="tel"
                  placeholder="Organisation mobile / helpline"
                  value={orgMobile}
                  onChange={(e) => setOrgMobile(e.target.value)}
                  required
                />
                <IconInput
                  icon={Mail}
                  type="email"
                  placeholder="Organisation email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  required
                />
              </div>
            </FormSection>

            {/* Section: contact */}
            <FormSection label="Contact person">
              <IconInput
                icon={User}
                placeholder="Contact person name"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IconInput
                  icon={Phone}
                  type="tel"
                  placeholder="Mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
                <IconInput
                  icon={Mail}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </FormSection>

            {/* Section: location */}
            <FormSection label="Location">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="Address"
                  className="min-h-[72px] pl-9 pt-2.5 resize-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IconInput
                  icon={Landmark}
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <IconInput
                  icon={Hash}
                  placeholder="Pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IconSelect
                  icon={MapPin}
                  value={state}
                  onValueChange={setState}
                  placeholder="State"
                >
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </IconSelect>

                {/* Country — fixed to India, no dropdown */}
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value="India"
                    readOnly
                    disabled
                    className="h-10 pl-9 disabled:opacity-100 disabled:cursor-default bg-muted/40"
                  />
                </div>
              </div>
            </FormSection>

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              Register organisation
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already registered?{" "}
          <Link to="/login" search={{ redirect: undefined }} className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function IconInput({
  icon: Icon,
  ...props
}: React.ComponentProps<typeof Input> & { icon: React.ElementType }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="h-10 pl-9" {...props} />
    </div>
  );
}

function IconSelect({
  icon: Icon,
  value,
  onValueChange,
  placeholder,
  children,
}: {
  icon: React.ElementType;
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 pl-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
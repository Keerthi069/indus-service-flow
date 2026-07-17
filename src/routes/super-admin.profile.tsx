import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Clock,
  Calendar,
  Upload,
  Laptop,
  Pencil,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/super-admin/profile")({
  component: SuperAdminProfilePage,
});

// Fields that stay editable vs. system-assigned fields (role, admin ID,
// org, join date, last login) that are shown for reference but never
// change from this screen.
const INITIAL_ADMIN = {
  name: "Arjun Mehta",
  email: "arjun.mehta@platform.io",
  phone: "+91 98765 43210",
  role: "Super Admin",
  avatarInitials: "AM",
  department: "Platform Operations",
  timezone: "Asia/Kolkata (IST, UTC+5:30)",
  joined: "12 January 2023",
  lastLogin: "Today at 09:41 AM · Chrome, macOS",
  adminId: "ADM-0001",
  org: "Platform.io",
};

type EditableFields = Pick<
  typeof INITIAL_ADMIN,
  "name" | "email" | "phone" | "department" | "timezone"
>;

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function SuperAdminProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>("");

  const [admin, setAdmin] = useState(INITIAL_ADMIN);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>(INITIAL_ADMIN);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
      } else {
        setProfileImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  function startEditing() {
    setForm({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      department: admin.department,
      timezone: admin.timezone,
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  function update<Field extends keyof EditableFields>(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function saveChanges() {
    if (!form.name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email can't be empty");
      return;
    }

    setAdmin((prev) => ({
      ...prev,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
      timezone: form.timezone.trim(),
      avatarInitials: initials(form.name),
    }));
    setIsEditing(false);
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-6">

      {/* Profile Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative mx-auto sm:mx-0 shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={admin.name}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border object-cover"
                />
              ) : (
                <div className="grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-full border bg-primary/10 text-3xl sm:text-4xl font-bold text-primary">
                  {admin.avatarInitials}
                </div>
              )}

              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              {isEditing ? (
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Full name"
                  className="mx-auto sm:mx-0 max-w-sm text-xl font-bold sm:text-2xl h-11"
                />
              ) : (
                <h1 className="text-2xl font-bold sm:text-3xl truncate">{admin.name}</h1>
              )}
              <p className="mt-1 text-muted-foreground">{admin.role}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge>{admin.adminId}</Badge>
                <Badge variant="secondary">Active</Badge>
                <Badge variant="outline">{admin.org}</Badge>
              </div>
            </div>

            {/* Edit / Save / Cancel — wraps under the header content on small screens */}
            <div className="flex justify-center gap-2 sm:justify-end sm:self-start">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveChanges} className="gap-1.5">
                    Save changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Professional information</h2>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Role</div>
                <div>{admin.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted-foreground">Department</div>
                {isEditing ? (
                  <div className="mt-1 max-w-xs">
                    <Label className="sr-only" htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div className="truncate">{admin.department}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted-foreground">Timezone</div>
                {isEditing ? (
                  <div className="mt-1 max-w-xs">
                    <Label className="sr-only" htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={form.timezone}
                      onChange={(e) => update("timezone", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div className="truncate">{admin.timezone}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Member since</div>
                <div>{admin.joined}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Contact information</h2>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted-foreground">Email</div>
                {isEditing ? (
                  <div className="mt-1 max-w-xs">
                    <Label className="sr-only" htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div className="truncate">{admin.email}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted-foreground">Phone</div>
                {isEditing ? (
                  <div className="mt-1 max-w-xs">
                    <Label className="sr-only" htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div className="truncate">{admin.phone}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Admin ID</div>
                <div>{admin.adminId}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Laptop className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Last login</div>
                <div className="truncate">{admin.lastLogin}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
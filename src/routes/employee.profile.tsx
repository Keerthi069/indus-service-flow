import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Upload,
  Pencil,
  Check,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { db, type Employee, type Organization } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/profile")({
  component: EmployeeProfilePage,
});

// ── Industry-based fallbacks ─────────────────────────────────────────────
// Same idea as the performance page: this app serves hospitals, clinics,
// banks, retail, and support orgs, so designation/department wording
// shouldn't be hardcoded to "Patient Care Coordinator" / "Patient Services".
// These are only used when the employee record doesn't specify its own
// designation — most seeded employees do, so this is mainly a safety net.

const DEFAULTS_BY_CATEGORY: Record<string, { designation: string; department: string }> = {
  hospital: { designation: "Patient Care Coordinator", department: "Patient Services" },
  clinic: { designation: "Clinic Coordinator", department: "Patient Services" },
  bank: { designation: "Customer Service Officer", department: "Retail Banking" },
  retail: { designation: "Sales Associate", department: "Store Operations" },
  support: { designation: "Support Executive", department: "Customer Support" },
};
const GENERIC_DEFAULT = { designation: "Employee", department: "Operations" };

function normalizeName(name: string) {
  return name.replace(/^dr\.?\s*/i, "").trim().toLowerCase();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Turns "emp_7" into a nicer "EMP-0007" style badge.
function formatEmployeeId(id: string) {
  const match = id.match(/(\d+)$/);
  if (!match) return id.toUpperCase();
  return `EMP-${match[1].padStart(4, "0")}`;
}

// Fields the user can edit from this page. Everything else (name, email,
// org, employee id) comes from auth/org records and isn't owned by this form.
type EditableFields = {
  designation: string;
  shift: string;
  mobile: string;
};

function EmployeeProfilePage() {
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState("");

  // Bumped after a successful save to force the `employee` memo below to
  // re-read from db.all("employees") instead of showing stale data.
  const [refreshKey, setRefreshKey] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditableFields>({
    designation: "",
    shift: "",
    mobile: "",
  });

  useEffect(() => {
    if (!user) return;
    const savedImage = localStorage.getItem(`profile-image-${user.id}`);
    if (savedImage) setProfileImage(savedImage);
  }, [user]);

  // Organization the logged-in employee belongs to.
  const organization = useMemo<Organization | undefined>(() => {
    if (!user?.organization_id) return undefined;
    return db.all("organizations").find((o) => o.id === user.organization_id);
  }, [user]);

  // Best-effort match to the employee record for this org (designation,
  // shift, joining date, etc). The seed data links employees to users by
  // name rather than a shared id — worth adding a `user_id` field on the
  // Employee record so this lookup is exact instead of best-effort.
  const employee = useMemo<Employee | undefined>(() => {
    if (!user?.organization_id) return undefined;
    return db
      .all("employees")
      .find(
        (e) =>
          e.organization_id === user.organization_id &&
          normalizeName(e.name) === normalizeName(user.name)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  if (!user) return null;

  const categoryDefaults = organization
    ? DEFAULTS_BY_CATEGORY[organization.category] ?? GENERIC_DEFAULT
    : GENERIC_DEFAULT;

  const designation = employee?.designation ?? categoryDefaults.designation;
  const department = categoryDefaults.department;
  const shift = employee?.shift ?? "Not set";
  const joinedIso = employee?.created_at ?? user.created_at;
  const phone = employee?.mobile ?? user.mobile ?? "Not provided";
  const employeeIdLabel = employee ? formatEmployeeId(employee.id) : formatEmployeeId(user.id);
  const orgName = organization?.name ?? "Unassigned organization";
  const statusLabel = (employee?.status ?? user.status) === "active" ? "Active" : "Inactive";

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      setProfileImage(imageData);
      localStorage.setItem(`profile-image-${user.id}`, imageData);
    };
    reader.readAsDataURL(file);
  };

  const startEditing = () => {
    setSaveError(null);
    setFormData({
      designation,
      shift: shift === "Not set" ? "" : shift,
      mobile: phone === "Not provided" ? "" : phone,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const patch: EditableFields = {
      designation: formData.designation.trim(),
      shift: formData.shift.trim(),
      mobile: formData.mobile.trim(),
    };

    try {
      if (employee) {
        // NOTE: assumes db exposes an `update(table, id, patch)` method
        // alongside `db.all`. Rename this call if the real mock db uses a
        // different method (e.g. db.save / db.patch).
        db.update("employees", employee.id, patch);
      } else if (user.organization_id) {
        // No employee record exists yet for this user — create one so the
        // edit isn't silently lost. Adjust required fields to match your
        // Employee type if this errors.
        db.insert("employees", {
          id: user.id,
          name: user.name,
          email: user.email,
          rating: 0,
          organization_id: user.organization_id,
          status: user.status === "active" ? "active" : "inactive",
          created_at: user.created_at,
          ...patch,
        });
      }

      setRefreshKey((k) => k + 1);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile changes", err);
      setSaveError("Couldn't save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const initial =
    user.name
      ?.replace(/^dr\.?\s*/i, "")
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user.name}
                  className="h-28 w-28 rounded-full border object-cover"
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-full border bg-primary/10 text-4xl font-bold text-primary">
                  {initial}
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

            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {user.name.replace(/^dr\.?\s*/i, "")}
              </h1>

              <p className="mt-1 text-muted-foreground">{designation}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{employeeIdLabel}</Badge>
                <Badge variant="secondary">{statusLabel}</Badge>
                <Badge variant="outline">{orgName}</Badge>
              </div>
            </div>

            <div>
              {!isEditing ? (
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Check className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {saveError && (
            <p className="mt-4 text-sm text-destructive">{saveError}</p>
          )}
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">Professional Information</h2>

            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Designation</div>
                {isEditing ? (
                  <Input
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, designation: e.target.value }))
                    }
                    placeholder="e.g. Patient Care Coordinator"
                  />
                ) : (
                  <div>{designation}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Department</div>
                <div>{department}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Shift</div>
                {isEditing ? (
                  <Input
                    value={formData.shift}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, shift: e.target.value }))
                    }
                    placeholder="e.g. Morning (9 AM - 5 PM)"
                  />
                ) : (
                  <div>{shift}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Joining Date</div>
                <div>{formatDate(joinedIso)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">Contact Information</h2>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Phone</div>
                {isEditing ? (
                  <Input
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, mobile: e.target.value }))
                    }
                    placeholder="e.g. +91 98765 43210"
                  />
                ) : (
                  <div>{phone}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Employee ID</div>
                <div>{employeeIdLabel}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Organization</div>
                <div>{orgName}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
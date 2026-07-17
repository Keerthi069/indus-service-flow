import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  BadgeCheck,
  Upload,
  Crown,
  Pencil,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/org-admin/profile")({
  component: OrgAdminProfilePage,
});

type EditableFields = {
  name: string;
  email: string;
  mobile: string;
};

function OrgAdminProfilePage() {
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileImage, setProfileImage] = useState<string>("");

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>({ name: "", email: "", mobile: "" });

  // Re-read this admin's own user row from the shared db so edits saved via
  // db.update (below) are reflected immediately, including anywhere else in
  // the app that reads the same "users" table — not just this page's local
  // state.
  const dbUser = useDb(() =>
    user ? db.all("users").find((u) => u.id === user.id) : undefined
  );

  const displayUser = dbUser ?? user;

  // Look up this admin's own organization — not a hardcoded one.
  const organization = useDb(() =>
    displayUser?.organization_id
      ? db.all("organizations").find((o) => o.id === displayUser.organization_id)
      : undefined
  );

  useEffect(() => {
    if (!user) return;
    const savedImage = localStorage.getItem(`profile-image-${user.id}`);
    setProfileImage(savedImage ?? "");
  }, [user]);

  if (!user || !displayUser) return null;

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result;
      if (typeof imageData === "string") {
        setProfileImage(imageData);
        localStorage.setItem(`profile-image-${user.id}`, imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  function startEditing() {
    if (!displayUser) return;

    setForm({
      name: displayUser.name ?? "",
      email: displayUser.email ?? "",
      mobile: displayUser.mobile ?? "",
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
    if (!displayUser) return;

    if (!form.name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email can't be empty");
      return;
    }

    // Persist to the shared mock db so this update shows up wherever this
    // user's record is read from — e.g. the super-admin Users table, org
    // member lists, etc. — not just here.
    db.update("users", displayUser.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
    });

    setIsEditing(false);
    toast.success("Profile updated");
  }

  const initial =
    displayUser.name
      ?.replace(/^dr\.?\s*/i, "")
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  const joiningDate = new Date(displayUser.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const statusLabel = displayUser.status === "active" ? "Active" : "Disabled";
  const location = organization
    ? [organization.city, organization.state].filter(Boolean).join(", ")
    : "—";

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
                  alt={displayUser.name}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border object-cover"
                />
              ) : (
                <div className="grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-full border bg-primary/10 text-3xl sm:text-4xl font-bold text-primary">
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

            <div className="flex-1 min-w-0 text-center sm:text-left">
              {isEditing ? (
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Full name"
                  className="mx-auto sm:mx-0 max-w-sm text-xl font-bold sm:text-2xl h-11"
                />
              ) : (
                <h1 className="text-2xl font-bold sm:text-3xl truncate">
                  {displayUser.name.replace(/^dr\.?\s*/i, "")}
                </h1>
              )}

              <p className="mt-1 text-muted-foreground">Org Admin</p>

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="outline">{displayUser.id}</Badge>
                <Badge variant={displayUser.status === "active" ? "secondary" : "destructive"}>
                  {statusLabel}
                </Badge>
                {organization && <Badge variant="outline">{organization.name}</Badge>}
              </div>
            </div>

            {/* Edit / Save / Cancel */}
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

      {/* Information Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Professional Information</h2>

            <div className="flex items-center gap-3">
              <Crown className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Role</div>
                <div>Org Admin</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Organisation</div>
                <div className="truncate">{organization?.name ?? "—"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BadgeCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="capitalize">{organization?.plan ?? "—"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="truncate">{location}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Joining Date</div>
                <div>{joiningDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Contact Information</h2>

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
                  <div className="truncate">{displayUser.email}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted-foreground">Phone</div>
                {isEditing ? (
                  <div className="mt-1 max-w-xs">
                    <Label className="sr-only" htmlFor="mobile">Phone</Label>
                    <Input
                      id="mobile"
                      value={form.mobile}
                      onChange={(e) => update("mobile", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div>{displayUser.mobile ?? "—"}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Admin ID</div>
                <div>{displayUser.id}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Organisation Email</div>
                <div className="truncate">{organization?.email ?? "—"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
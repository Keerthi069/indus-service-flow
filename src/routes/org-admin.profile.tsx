import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Upload,
  Crown,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/profile")({
  component: OrgAdminProfilePage,
});

function OrgAdminProfilePage() {
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileImage, setProfileImage] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const savedImage = localStorage.getItem(`profile-image-${user.id}`);
    if (savedImage) setProfileImage(savedImage);
  }, [user]);

  if (!user) return null;

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
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

              <p className="mt-1 text-muted-foreground">Org Admin</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>ADM-0042</Badge>
                <Badge variant="secondary">Active</Badge>
                <Badge variant="outline">Apollo Hospitals</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">Professional Information</h2>

            <div className="flex items-center gap-3">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div>Org Admin</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Department</div>
                <div>Operations</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Shift</div>
                <div>09:00 AM – 06:00 PM</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Joining Date</div>
                <div>15 March 2023</div>
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
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div>+91 98412 77301</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Admin ID</div>
                <div>ADM-0042</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Organisation</div>
                <div>Apollo Hospitals</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
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
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/super-admin/profile")({
  component: SuperAdminProfilePage,
});

const ADMIN = {
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

const MAX_FILE_SIZE_MB = 5;

function SuperAdminProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input value so selecting the same file again still fires onChange
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

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
                  alt={ADMIN.name}
                  className="h-28 w-28 rounded-full border object-cover"
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-full border bg-primary/10 text-4xl font-bold text-primary">
                  {ADMIN.avatarInitials}
                </div>
              )}

              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                type="button"
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
              <h1 className="text-3xl font-bold">{ADMIN.name}</h1>
              <p className="mt-1 text-muted-foreground">{ADMIN.role}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{ADMIN.adminId}</Badge>
                <Badge variant="secondary">Active</Badge>
                <Badge variant="outline">{ADMIN.org}</Badge>
              </div>
              {uploadError && (
                <p className="mt-2 text-sm text-destructive">{uploadError}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">Professional information</h2>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div>{ADMIN.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Department</div>
                <div>{ADMIN.department}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Timezone</div>
                <div>{ADMIN.timezone}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Member since</div>
                <div>{ADMIN.joined}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">Contact information</h2>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{ADMIN.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div>{ADMIN.phone}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Admin ID</div>
                <div>{ADMIN.adminId}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Laptop className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Last login</div>
                <div>{ADMIN.lastLogin}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Upload,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/employee/profile")({
  component: EmployeeProfilePage,
});

function EmployeeProfilePage() {
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    if (!user) return;

    const savedImage = localStorage.getItem(
      `profile-image-${user.id}`
    );

    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, [user]);

  if (!user) return null;

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const imageData = reader.result as string;

      setProfileImage(imageData);

      localStorage.setItem(
        `profile-image-${user.id}`,
        imageData
      );
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

              <p className="mt-1 text-muted-foreground">
                Patient Care Coordinator
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>EMP-1047</Badge>
                <Badge variant="secondary">Active</Badge>
                <Badge variant="outline">Apollo Hospital</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">
              Professional Information
            </h2>

            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Designation
                </div>
                <div>Patient Care Coordinator</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Department
                </div>
                <div>Patient Services</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Shift
                </div>
                <div>08:00 AM - 04:00 PM</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Joining Date
                </div>
                <div>15 March 2024</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">
              Contact Information
            </h2>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Email
                </div>
                <div>{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Phone
                </div>
                <div>+91 98765 43210</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Employee ID
                </div>
                <div>EMP-1047</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Organization
                </div>
                <div>Apollo Hospital</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
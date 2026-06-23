import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Filter, Download } from "lucide-react";

/* ---------------- DATA ---------------- */
type Org = {
  id: string;
  name: string;
  category: string;
  contact_person: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: "active" | "inactive";
};

const initialData: Org[] = [
  {
    id: "org-1",
    name: "ABC Hospital",
    category: "hospital",
    contact_person: "Rahul Mehta",
    email: "abc@gmail.com",
    mobile: "9876543210",
    address: "MG Road",
    city: "Mumbai",
    state: "MH",
    pincode: "400001",
    status: "active",
  },
];

export const Route = createFileRoute("/super-admin/organizations")({
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<Org[]>(initialData);

  const [filter, setFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [exportOpen, setExportOpen] = useState(false);
  const [open, setOpen] = useState(false);

  /* ---------------- FORM STATE ---------------- */
  const [form, setForm] = useState<Omit<Org, "id" | "status">>({
    name: "",
    category: "",
    contact_person: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  /* ---------------- FILTER ---------------- */
  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  /* ---------------- TOGGLE STATUS ---------------- */
  const toggleStatus = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status:
                r.status === "active" ? "inactive" : "active",
            }
          : r
      )
    );

    toast.success("Status updated");
  };

  /* ---------------- EXPORT ---------------- */
  const exportData = (type: string) => {
    const data = filtered
      .map(
        (r) =>
          `${r.id},${r.name},${r.category},${r.email},${r.status}`
      )
      .join("\n");

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `organizations.${type}`;
    a.click();

    toast.success(`Exported ${type.toUpperCase()}`);
  };

  /* ---------------- CREATE ORG ---------------- */
  const handleCreate = () => {
    if (!form.name || !form.email) {
      toast.error("Name and Email required");
      return;
    }

    setRows((prev) => [
      {
        id: `org-${prev.length + 1}`,
        ...form,
        status: "active",
      },
      ...prev,
    ]);

    toast.success("Organization created");

    setOpen(false);

    setForm({
      name: "",
      category: "",
      contact_person: "",
      email: "",
      mobile: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  return (
    <div>
      {/* HEADER */}
      <PageHeader
        title="Organizations"
        subtitle="Manage registered organizations"
        actions={
          <div className="flex gap-2 items-center">

            {/* FILTER */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>

              <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded-md shadow-md w-36 z-10">
                {["all", "active", "inactive"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className="w-full px-3 py-2 text-sm hover:bg-muted text-left capitalize"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* EXPORT */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>

              <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded-md shadow-md w-36 z-10">
                <button
                  onClick={() => exportData("csv")}
                  className="w-full px-3 py-2 text-sm hover:bg-muted text-left"
                >
                  CSV
                </button>

                <button
                  onClick={() => exportData("xls")}
                  className="w-full px-3 py-2 text-sm hover:bg-muted text-left"
                >
                  XLS
                </button>

                <button
                  onClick={() => exportData("pdf")}
                  className="w-full px-3 py-2 text-sm hover:bg-muted text-left"
                >
                  PDF
                </button>
              </div>
            </div>

            {/* NEW ORGANIZATION */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  New Organization
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Register Organization
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 mt-2">

                  <Input
                    placeholder="Organization Name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                  />
<Select
  value={form.category}
  onValueChange={(value) =>
    setForm({
      ...form,
      category: value,
    })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Select Category" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="hospital">Hospital</SelectItem>
    <SelectItem value="clinic">Clinic</SelectItem>
    <SelectItem value="bank">Bank</SelectItem>
    <SelectItem value="retail">Retail</SelectItem>
    <SelectItem value="customer-care">
      Customer Care
    </SelectItem>
  </SelectContent>
</Select>
                  <Input
                    placeholder="Contact Person"
                    value={form.contact_person}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_person: e.target.value,
                      })
                    }
                  />

                  <Input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />

                  <Input
                    placeholder="Mobile"
                    value={form.mobile}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mobile: e.target.value,
                      })
                    }
                  />

                  <Input
                    placeholder="Address"
                    value={form.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: e.target.value,
                      })
                    }
                  />

                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        city: e.target.value,
                      })
                    }
                  />

                  <Input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        state: e.target.value,
                      })
                    }
                  />

                  <Input
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pincode: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button onClick={handleCreate}>
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* TABLE */}
      <div className="mt-4 border rounded-lg overflow-hidden">

        <div className="grid grid-cols-6 p-3 text-xs font-semibold border-b">
          <div>Name</div>
          <div>Category</div>
          <div>Contact</div>
          <div>Email</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {filtered.map((o) => (
          <div
            key={o.id}
            className="grid grid-cols-6 p-3 border-b items-center"
          >
            <div>{o.name}</div>
            <div className="capitalize">{o.category}</div>
            <div>{o.contact_person}</div>
            <div>{o.email}</div>

            <Badge
  className="w-20 justify-center capitalize"
  variant={
    o.status === "active"
      ? "default"
      : "destructive"
  }
>
  {o.status}
</Badge>

            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleStatus(o.id)}
              >
                {o.status === "active"
                  ? "Deactivate"
                  : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
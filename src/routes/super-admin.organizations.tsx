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
                </div>
        }
      />

      {/* TABLE */}
      <div className="mt-4 border rounded-lg overflow-hidden">
<div className="grid grid-cols-5 p-3 text-xs font-semibold border-b">
  <div>Name</div>
  <div>Category</div>
  <div>Contact</div>
  <div>Email</div>
  <div>Status</div>
</div>

        {filtered.map((o) => (<div
  key={o.id}
  className="grid grid-cols-5 p-3 border-b items-center"
>
  <div>{o.name}</div>

  <div className="capitalize">
    {o.category}
  </div>

  <div>{o.contact_person}</div>

  <div>{o.email}</div>

  <div>
    <button
      onClick={() => toggleStatus(o.id)}
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
        o.status === "active"
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      }`}
    >
      {o.status}
    </button>
  </div>
</div>
        ))}
      </div>
    </div>
  );
}
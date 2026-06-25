import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FolderTree,
  Search,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  File,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute(
  "/org-admin/service-categories"
)({
  component: ServiceCategoriesPage,
});

type Category = {
  id: string;
  name: string;
  description: string;
  serviceCount: number;
  status: "Active" | "Inactive";
};

function ServiceCategoriesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");

  const [open, setOpen] = useState(false);

  const [rows, setRows] = useState<Category[]>([
    {
      id: "CAT001",
      name: "General Consultation",
      description:
        "Regular doctor consultations and health checkups",
      serviceCount: 8,
      status: "Active",
    },
    {
      id: "CAT002",
      name: "Diagnostics",
      description:
        "Blood tests, scans and laboratory services",
      serviceCount: 14,
      status: "Active",
    },
    {
      id: "CAT003",
      name: "Cardiology",
      description:
        "Heart specialist consultations and procedures",
      serviceCount: 6,
      status: "Active",
    },
    {
      id: "CAT004",
      name: "Orthopedics",
      description:
        "Bone, joint and muscle treatment services",
      serviceCount: 7,
      status: "Active",
    },
    {
      id: "CAT005",
      name: "Physiotherapy",
      description:
        "Physical rehabilitation and therapy sessions",
      serviceCount: 5,
      status: "Active",
    },
    {
      id: "CAT006",
      name: "Dental Care",
      description:
        "Dental consultations and treatment services",
      serviceCount: 4,
      status: "Inactive",
    },
    {
      id: "CAT007",
      name: "Pediatrics",
      description:
        "Healthcare services for children",
      serviceCount: 9,
      status: "Active",
    },
    {
      id: "CAT008",
      name: "Wellness Programs",
      description:
        "Preventive healthcare and wellness packages",
      serviceCount: 3,
      status: "Active",
    },
  ]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Active",
  });

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      const matchesSearch =
        item.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.description
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All"
          ? true
          : item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  function createCategory() {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    const newRow: Category = {
      id: `CAT${String(rows.length + 1).padStart(
        3,
        "0"
      )}`,
      name: form.name,
      description: form.description,
      serviceCount: 0,
      status:
        form.status as "Active" | "Inactive",
    };

    setRows((prev) => [newRow, ...prev]);

    setForm({
      name: "",
      description: "",
      status: "Active",
    });

    setOpen(false);

    toast.success("Category created successfully");
  }

  function toggleStatus(id: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              status:
                row.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : row
      )
    );

    toast.success("Status updated");
  }

 const exportCsv = () => {
  const csv = [
    ["ID", "Name", "Description", "Services", "Status"].join(","),
    ...filtered.map((r) =>
      [
        r.id,
        r.name,
        r.description,
        r.serviceCount,
        r.status,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "service-categories.csv";
  link.click();

  URL.revokeObjectURL(url);

  toast.success("CSV exported");
};

const exportExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(
    filtered.map((r) => ({
      ID: r.id,
      Name: r.name,
      Description: r.description,
      Services: r.serviceCount,
      Status: r.status,
    }))
  );

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Categories"
  );

  XLSX.writeFile(
    workbook,
    "service-categories.xlsx"
  );

  toast.success("Excel exported");
};

const exportPdf = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Service Categories", 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [
      [
        "ID",
        "Name",
        "Description",
        "Services",
        "Status",
      ],
    ],
    body: filtered.map((r) => [
      r.id,
      r.name,
      r.description,
      r.serviceCount.toString(),
      r.status,
    ]),
  });

  doc.save("service-categories.pdf");

  toast.success("PDF exported");
};

  return (
    <>
      <PageHeader
        title="Service Categories"
        subtitle="Organize services into logical business categories"
      />

      <div className="rounded-xl border bg-card p-5 space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    setFilter("All")
                  }
                >
                  All 
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    setFilter("Active")
                  }
                >
                  Active
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    setFilter("Inactive")
                  }
                >
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={exportCsv}
                >
                  <File className="mr-2 h-4 w-4" />
                  CSV
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={exportExcel}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={exportPdf}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <Card
              key={category.id}
              className="transition-all hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <FolderTree className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {category.name}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">
                      {category.serviceCount}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Services
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      toggleStatus(category.id)
                    }
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      category.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {category.status}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              New Category
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>

              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>

              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="Active">
                  Active
                </option>
                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>

            <Button
              className="w-full"
              onClick={createCategory}
            >
              Save Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
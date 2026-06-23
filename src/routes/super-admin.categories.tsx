import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/portal/PortalShell";

import {
  Building2,
  HeartPulse,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Headset,
  Plus,
  Download,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/super-admin/categories")({
  component: CategoriesPage,
});

type Item = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
};

type Category = {
  id: string;
  label: string;
  items: Item[];
};

function CategoriesPage() {
  const [tab, setTab] = useState("hospitals");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    categoryName: "",
  });

  const [categories, setCategories] = useState<Category[]>([
    {
      id: "hospitals",
      label: "Hospitals",
      items: [
        { id: "h1", name: "Apollo Hospitals", city: "Chennai", state: "TN", status: "Active" },
      ],
    },
    {
      id: "clinics",
      label: "Clinics",
      items: [
        { id: "c1", name: "Care Clinic", city: "Hyderabad", state: "TG", status: "Active" },
      ],
    },
    {
      id: "banks",
      label: "Banks",
      items: [
        { id: "b1", name: "State Bank of India", city: "Mumbai", state: "MH", status: "Active" },
      ],
    },
    {
      id: "retail",
      label: "Retail",
      items: [
        { id: "r1", name: "Reliance Retail", city: "Mumbai", state: "MH", status: "Active" },
      ],
    },
    {
      id: "support",
      label: "Customer Support",
      items: [
        { id: "s1", name: "Customer Care Center", city: "Bengaluru", state: "KA", status: "Active" },
      ],
    },
  ]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === tab),
    [categories, tab]
  );

  const filtered = useMemo(() => {
    return (activeCategory?.items || []).filter((x) =>
      `${x.name} ${x.city} ${x.state}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [activeCategory, search]);

  function addCategoryItem() {
    if (!form.name || !form.city) {
      toast.error("Name and city required");
      return;
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: form.name,
      city: form.city,
      state: form.state,
      status: "Active",
    };

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === tab
          ? { ...cat, items: [newItem, ...cat.items] }
          : cat
      )
    );

    toast.success("Added successfully");

    setForm({ name: "", city: "", state: "", categoryName: "" });
    setOpen(false);
  }

  function addNewCategory() {
    if (!form.categoryName) {
      toast.error("Category name required");
      return;
    }

    const id = form.categoryName.toLowerCase().replace(/\s+/g, "-");

    if (categories.find((c) => c.id === id)) {
      toast.error("Category already exists");
      return;
    }

    const newCat: Category = {
      id,
      label: form.categoryName,
      items: [],
    };

    setCategories((prev) => [...prev, newCat]);
    setTab(id);

    toast.success("Category added");

    setForm({ name: "", city: "", state: "", categoryName: "" });
    setOpen(false);
  }

  function downloadFile(content: string, fileName: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  }

  function exportData(type: "csv" | "xls" | "pdf") {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }

    if (type === "csv") {
      const csv =
        "Name,City,State,Status\n" +
        filtered.map((d) => `${d.name},${d.city},${d.state},${d.status}`).join("\n");

      downloadFile(csv, "data.csv", "text/csv");
    }

    if (type === "xls") {
      const csv =
        "Name\tCity\tState\tStatus\n" +
        filtered.map((d) => `${d.name}\t${d.city}\t${d.state}\t${d.status}`).join("\n");

      downloadFile(csv, "data.xls", "application/vnd.ms-excel");
    }

    if (type === "pdf") {
      const content = filtered
        .map((d) => `${d.name} | ${d.city} | ${d.state} | ${d.status}`)
        .join("\n");

      downloadFile(content, "data.pdf", "application/pdf");
    }

    toast.success(`Exported ${type.toUpperCase()}`);
  }

  return (
    <>
      <PageHeader
        title="Organization Categories"
        subtitle="Manage dynamic categories"
        actions={
          <div className="flex gap-2 relative">

            {/* EXPORT DROPDOWN */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setExportOpen((p) => !p)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>

              {exportOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-lg border bg-white shadow-md z-50">
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    onClick={() => {
                      exportData("csv");
                      setExportOpen(false);
                    }}
                  >
                    CSV
                  </button>

                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    onClick={() => {
                      exportData("xls");
                      setExportOpen(false);
                    }}
                  >
                    XLS
                  </button>

                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    onClick={() => {
                      exportData("pdf");
                      setExportOpen(false);
                    }}
                  >
                    PDF
                  </button>
                </div>
              )}
            </div>

            {/* NEW CATEGORY */}
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>
        }
      />

     <div className="flex gap-6 mt-4">

  {/* LEFT SIDEBAR */}
  <div className="w-[260px] shrink-0">
    <div className="border rounded-xl bg-card p-2 space-y-2">

      {categories.map((cat) => {
        const Icon =
          cat.id === "hospitals"
            ? HeartPulse
            : cat.id === "clinics"
            ? Stethoscope
            : cat.id === "banks"
            ? Landmark
            : cat.id === "retail"
            ? ShoppingBag
            : cat.id === "support"
            ? Headset
            : Building2;

        return (
          <button
            key={cat.id}
            onClick={() => setTab(cat.id)}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition ${
              tab === cat.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{cat.label}</span>
            </div>

            <span className="text-xs">
              {cat.items.length}
            </span>
          </button>
        );
      })}

    </div>
  </div>

  {/* RIGHT CONTENT */}
  <div className="flex-1">

    <div className="rounded-2xl border bg-card p-5">

      <div className="mb-5">
        <Input
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border p-4 hover:bg-muted/20 transition"
          >
            <div className="font-semibold">
              {item.name}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              {item.city}, {item.state}
            </div>

            <div className="mt-2 text-xs text-emerald-600">
              {item.status}
            </div>
          </div>
        ))}
      </div>

      {!filtered.length && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No results found
        </div>
      )}

    </div>

  </div>

</div>
      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category / Organization</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              placeholder="Category Name (optional if adding org)"
              value={form.categoryName}
              onChange={(e) =>
                setForm({ ...form, categoryName: e.target.value })
              }
            />

            <Input
              placeholder="Organization Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
            />

            <Input
              placeholder="State"
              value={form.state}
              onChange={(e) =>
                setForm({ ...form, state: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={() =>
                form.categoryName ? addNewCategory() : addCategoryItem()
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
// Generic CRUD page helper for org-scoped tables

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/portal/PortalShell";
import {
  DataTable,
  type Column,
} from "@/components/portal/DataTable";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { db, uid } from "@/lib/mock/db";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "select";
  options?: {
    label: string;
    value: string;
  }[];
}

export function CrudPage<
  T extends { id: string }
>({
  title,
  subtitle,
  table,
  data,
  columns,
  fields,
  orgId,
  defaults = {},
  exportName,
}: {
  title: string;
  subtitle?: string;

  table: any;

  data: T[];

  columns: Column<T>[];

  fields: FieldDef[];

  orgId?: string;

  defaults?: Record<string, any>;

  exportName: string;
}) {
  const [open, setOpen] = useState(false);

  const [edit, setEdit] =
    useState<T | null>(null);

  const [form, setForm] =
    useState<Record<string, any>>({});

  function openNew() {
    setEdit(null);
    setForm({ ...defaults });
    setOpen(true);
  }

  function openEdit(row: T) {
    setEdit(row);
    setForm({ ...row });
    setOpen(true);
  }

  function save() {
    for (const field of fields) {
      if (
        form[field.key] === undefined ||
        form[field.key] === ""
      ) {
        toast.error(
          `Please fill ${field.label}`
        );
        return;
      }
    }

    if (edit) {
      db.update(
        table,
        edit.id,
        form as never
      );

      toast.success(
        `${title} updated`
      );
    } else {
      const row = {
        id: uid(table),
        organization_id: orgId,
        ...defaults,
        ...form,
        created_at:
          new Date().toISOString(),
      };

      db.insert(
        table,
        row as never
      );

      toast.success(
        `${title} added`
      );
    }

    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        exportName={exportName}
        rowActions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                openEdit(row)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                db.remove(
                  table,
                  row.id
                );

                toast.success(
                  "Deleted"
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit
                ? `Edit ${title}`
                : `New ${title}`}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            {fields.map((field) => (
              <div
                key={field.key}
                className="grid gap-1.5"
              >
                <Label>
                  {field.label}
                </Label>

                {field.type ===
                "select" ? (
                  <Select
                    value={
                      form[field.key] ??
                      ""
                    }
                    onValueChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        [field.key]:
                          value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${field.label}`}
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {field.options?.map(
                        (option) => (
                          <SelectItem
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={
                      field.type ||
                      "text"
                    }
                    value={
                      form[field.key] ??
                      ""
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.key]:
                          field.type ===
                          "number"
                            ? Number(
                                e.target
                                  .value
                              )
                            : e.target
                                .value,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setOpen(false)
              }
            >
              Cancel
            </Button>

            <Button onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
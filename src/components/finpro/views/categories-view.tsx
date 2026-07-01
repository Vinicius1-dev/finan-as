"use client";

import { createElement, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Tags,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Category, CategoryType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFinProStore } from "@/store/finpro-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/finpro/shared/empty-state";
import { getCategoryIcon } from "@/components/finpro/shared/icons";

// ---------------- constants ----------------

const CATEGORY_TYPE_OPTIONS: {
  value: CategoryType;
  label: string;
  color: string;
}[] = [
  {
    value: "income",
    label: "Receita",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "expense",
    label: "Despesa",
    color: "text-rose-600 dark:text-rose-400",
  },
];

const COLOR_PRESETS = [
  "#10B981",
  "#8B5CF6",
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#14B8A6",
  "#6B7280",
];

const ICON_OPTIONS = [
  "Utensils",
  "Home",
  "Car",
  "Gamepad2",
  "HeartPulse",
  "GraduationCap",
  "ShoppingBag",
  "Repeat",
  "Banknote",
  "Laptop",
  "TrendingUp",
  "Circle",
];

const TYPE_LABEL: Record<CategoryType, string> = {
  income: "Receita",
  expense: "Despesa",
};

// ---------------- Section header ----------------

function SectionHeader({
  type,
  count,
  onAdd,
}: {
  type: CategoryType;
  count: number;
  onAdd: () => void;
}) {
  const isIncome = type === "income";
  const Icon = isIncome ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isIncome
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold">
          {isIncome ? "Receitas" : "Despesas"}
        </h2>
        <Badge
          variant="secondary"
          className="ml-1 px-1.5 py-0 text-xs font-medium"
        >
          {count}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        className="h-8 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </div>
  );
}

// ---------------- Category card ----------------

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <Card className="group relative overflow-hidden py-0 transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: category.color }}
          >
            {createElement(getCategoryIcon(category.icon), {
              className: "h-5 w-5",
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Ações da categoria"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">
            {category.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {TYPE_LABEL[category.type]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Skeleton grid ----------------

function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="py-0">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Form dialog ----------------

interface FormState {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Category | null;
  defaultType: CategoryType;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => {
    if (editing) {
      return {
        name: editing.name,
        type: editing.type,
        color: editing.color || COLOR_PRESETS[0],
        icon: editing.icon || "Circle",
      };
    }
    return {
      name: "",
      type: defaultType,
      color: COLOR_PRESETS[0],
      icon: "Circle",
    };
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) {
        throw new Error("Informe o nome da categoria.");
      }
      const body = {
        name: form.name.trim(),
        type: form.type,
        color: form.color,
        icon: form.icon,
      };
      const url = editing
        ? `/api/finpro/categories/${editing.id}`
        : "/api/finpro/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao salvar categoria.");
      }
      return data as Category;
    },
    onSuccess: () => {
      toast.success(
        editing ? "Categoria atualizada!" : "Categoria criada!"
      );
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      useFinProStore.getState().triggerRefresh();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados da categoria abaixo."
              : "Crie uma categoria para organizar suas transações."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              type="text"
              placeholder="Ex: Mercado, Salário, Aluguel..."
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <RadioGroup
              value={form.type}
              onValueChange={(v) => update("type", v as CategoryType)}
              className="grid grid-cols-2 gap-2"
            >
              {CATEGORY_TYPE_OPTIONS.map((opt) => {
                const active = form.type === opt.value;
                return (
                  <Label
                    key={opt.value}
                    htmlFor={`cat-type-${opt.value}`}
                    className={cn(
                      "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                      active && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem
                      id={`cat-type-${opt.value}`}
                      value={opt.value}
                      className="sr-only"
                    />
                    <span className={cn(active && opt.color)}>{opt.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Cor */}
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {COLOR_PRESETS.map((color) => {
                const active =
                  form.color.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => update("color", color)}
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-lg ring-offset-2 ring-offset-background transition-transform hover:scale-105",
                      active && "ring-2 ring-ring"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Selecionar cor ${color}`}
                    aria-pressed={active}
                  >
                    {active && <Check className="h-4 w-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ícone */}
          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const active = form.icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => update("icon", iconName)}
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-lg border border-input text-foreground transition-colors hover:bg-accent",
                      active && "border-primary bg-primary/5 text-primary"
                    )}
                    aria-label={`Selecionar ícone ${iconName}`}
                    aria-pressed={active}
                  >
                    {createElement(getCategoryIcon(iconName), {
                      className: "h-4 w-4",
                    })}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {editing ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Delete dialog ----------------

function DeleteDialog({
  category,
  open,
  onOpenChange,
}: {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Categoria inválida.");
      const res = await fetch(`/api/finpro/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao excluir categoria.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Categoria excluída!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      useFinProStore.getState().triggerRefresh();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
          <AlertDialogDescription>
            {category
              ? `Esta ação não pode ser desfeita. A categoria "${category.name}" será removida. As transações que a utilizam perderão a referência de categoria (ficarão sem categoria) e os orçamentos vinculados serão excluídos.`
              : "Esta ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60"
          >
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------- Category section ----------------

function CategorySection({
  type,
  categories,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
}: {
  type: CategoryType;
  categories: Category[];
  isLoading: boolean;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAdd: () => void;
}) {
  const list = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  return (
    <section className="space-y-3">
      <SectionHeader type={type} count={list.length} onAdd={onAdd} />
      {isLoading ? (
        <CategoryGridSkeleton />
      ) : list.length === 0 ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <EmptyState
              icon={Tags}
              title="Nenhuma categoria"
              description="Crie categorias para organizar suas transações."
              action={
                <Button variant="outline" size="sm" onClick={onAdd}>
                  <Plus className="h-4 w-4" />
                  Adicionar categoria
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------- Main view ----------------

export function CategoriesView() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  // formSession forces the dialog to remount on each open so form state
  // initializes cleanly for create/edit without stale data.
  const [formSession, setFormSession] = useState(0);
  const [defaultType, setDefaultType] = useState<CategoryType>("expense");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const res = await fetch("/api/finpro/categories");
      if (!res.ok) throw new Error("Erro ao carregar categorias.");
      return res.json();
    },
  });

  const openCreate = (type: CategoryType = "expense") => {
    setEditing(null);
    setDefaultType(type);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openDelete = (c: Category) => {
    setToDelete(c);
    setDeleteOpen(true);
  };

  const incomeCount = useMemo(
    () => categories.filter((c) => c.type === "income").length,
    [categories]
  );
  const expenseCount = useMemo(
    () => categories.filter((c) => c.type === "expense").length,
    [categories]
  );
  const total = categories.length;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "Nenhuma categoria cadastrada"
            : `${incomeCount} receitas • ${expenseCount} despesas`}
        </p>
        <Button
          onClick={() => openCreate("expense")}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {/* Sections */}
      <CategorySection
        type="income"
        categories={categories}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={openDelete}
        onAdd={() => openCreate("income")}
      />
      <CategorySection
        type="expense"
        categories={categories}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={openDelete}
        onAdd={() => openCreate("expense")}
      />

      {/* Form dialog — remounts on each open via formSession */}
      <CategoryFormDialog
        key={formSession}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        defaultType={defaultType}
      />

      {/* Delete dialog */}
      <DeleteDialog
        category={toDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

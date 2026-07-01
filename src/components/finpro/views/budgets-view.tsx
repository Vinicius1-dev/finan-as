"use client";

import { createElement, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Account, Budget, Category } from "@/lib/types";
import {
  MONTH_NAMES,
  formatCurrency,
  formatMonthYear,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFinProStore } from "@/store/finpro-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/finpro/shared/empty-state";
import { getCategoryIcon } from "@/components/finpro/shared/icons";

// ---------------- helpers ----------------

function useNowMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function yearOptions(): number[] {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2];
}

// ---------------- Summary cards ----------------

function SummaryCards({
  budgets,
  isLoading,
}: {
  budgets: Budget[];
  isLoading: boolean;
}) {
  const totals = useMemo(() => {
    let budgeted = 0;
    let spent = 0;
    for (const b of budgets) {
      budgeted += b.amount;
      spent += b.spent ?? 0;
    }
    return { budgeted, spent, remaining: budgeted - spent };
  }, [budgets]);

  const cards = [
    {
      label: "Orçado",
      value: totals.budgeted,
      color: "text-primary",
      bg: "bg-primary/10",
      Icon: Target,
    },
    {
      label: "Gasto",
      value: totals.spent,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      Icon: TrendingDown,
    },
    {
      label: "Restante",
      value: totals.remaining,
      color:
        totals.remaining >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
      bg:
        totals.remaining >= 0
          ? "bg-emerald-500/10"
          : "bg-rose-500/10",
      Icon: totals.remaining >= 0 ? TrendingUp : TrendingDown,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {cards.map(({ label, value, color, bg, Icon }) => (
        <Card key={label} className="py-0">
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                bg,
                color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {label}
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p
                  className={cn(
                    "truncate text-lg font-bold tabular-nums",
                    color
                  )}
                >
                  {formatCurrency(value)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Budget row ----------------

function getProgressState(pct: number): {
  color: string;
  alert: "ok" | "warn" | "danger";
} {
  if (pct > 100) return { color: "#EF4444", alert: "danger" };
  if (pct >= 80) return { color: "#F59E0B", alert: "warn" };
  return { color: "var(--primary)", alert: "ok" };
}

function BudgetRow({
  budget,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  onEdit: (b: Budget) => void;
  onDelete: (b: Budget) => void;
}) {
  const spent = budget.spent ?? 0;
  const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - spent;
  const state = getProgressState(pct);
  const cat = budget.category;
  const account = budget.account;

  return (
    <Card className="py-0 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center">
        {/* Left: icon + name */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {cat ? (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: cat.color }}
            >
              {createElement(getCategoryIcon(cat.icon), {
                className: "h-5 w-5",
              })}
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Target className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">
              {cat?.name ?? "Categoria"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {account?.name ?? "Conta"}
            </p>
          </div>
        </div>

        {/* Center: progress bar */}
        <div className="min-w-0 flex-1 md:max-w-xs">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {pct.toFixed(0)}% usado
            </span>
            {state.alert === "warn" && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Atenção
              </span>
            )}
            {state.alert === "danger" && (
              <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3 w-3" />
                Estourou
              </span>
            )}
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.min(pct, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: state.color,
              }}
            />
          </div>
        </div>

        {/* Right: amounts + actions */}
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              <span className="text-rose-600 dark:text-rose-400">
                {formatCurrency(spent)}
              </span>
              <span className="text-muted-foreground"> / {formatCurrency(budget.amount)}</span>
            </p>
            <p
              className={cn(
                "text-xs font-medium tabular-nums",
                remaining >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {remaining >= 0
                ? `Restante: ${formatCurrency(remaining)}`
                : `Excedeu em ${formatCurrency(Math.abs(remaining))}`}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Ações do orçamento"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(budget)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(budget)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Skeleton ----------------

function BudgetListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="py-0">
          <CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="hidden flex-1 space-y-2 md:block">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-24 ml-auto" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Form dialog ----------------

interface FormState {
  amount: string;
  month: number;
  year: number;
  categoryId: string;
  accountId: string;
}

function BudgetFormDialog({
  open,
  onOpenChange,
  editing,
  accounts,
  categories,
  existingBudgets,
  defaultMonth,
  defaultYear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Budget | null;
  accounts: Account[];
  categories: Category[];
  existingBudgets: Budget[];
  defaultMonth: number;
  defaultYear: number;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => {
    if (editing) {
      return {
        amount: String(editing.amount ?? ""),
        month: editing.month,
        year: editing.year,
        categoryId: editing.categoryId,
        accountId: editing.accountId,
      };
    }
    return {
      amount: "",
      month: defaultMonth,
      year: defaultYear,
      categoryId: categories.find((c) => c.type === "expense")?.id ?? "",
      accountId: accounts[0]?.id ?? "",
    };
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(form.amount);
      if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Informe um valor válido maior que zero.");
      }
      if (!form.categoryId) {
        throw new Error("Selecione uma categoria.");
      }
      if (!form.accountId) {
        throw new Error("Selecione uma conta.");
      }
      // Client-side duplicate check (matches @@unique([categoryId, month, year, accountId]))
      const dup = existingBudgets.some(
        (b) =>
          b.id !== editing?.id &&
          b.categoryId === form.categoryId &&
          b.month === form.month &&
          b.year === form.year &&
          b.accountId === form.accountId
      );
      if (dup) {
        throw new Error(
          "Já existe um orçamento para esta categoria, conta e período."
        );
      }
      const body = {
        amount: form.amount,
        month: form.month,
        year: form.year,
        categoryId: form.categoryId,
        accountId: form.accountId,
      };
      const url = editing
        ? `/api/finpro/budgets/${editing.id}`
        : "/api/finpro/budgets";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao salvar orçamento.");
      }
      return data as Budget;
    },
    onSuccess: () => {
      toast.success(editing ? "Orçamento atualizado!" : "Orçamento criado!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar orçamento" : "Novo orçamento"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados do orçamento abaixo."
              : "Defina um limite de gastos por categoria para o período."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoria */}
          <div className="space-y-1.5">
            <Label htmlFor="bud-category">Categoria</Label>
            <Select
              value={form.categoryId || undefined}
              onValueChange={(v) => update("categoryId", v)}
            >
              <SelectTrigger id="bud-category" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Nenhuma categoria disponível
                  </div>
                ) : (
                  categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Conta */}
          <div className="space-y-1.5">
            <Label htmlFor="bud-account">Conta</Label>
            <Select
              value={form.accountId || undefined}
              onValueChange={(v) => update("accountId", v)}
            >
              <SelectTrigger id="bud-account" className="w-full">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Nenhuma conta disponível
                  </div>
                ) : (
                  accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label htmlFor="bud-amount">Valor do orçamento</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                R$
              </span>
              <Input
                id="bud-amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Mês + Ano */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bud-month">Mês</Label>
              <Select
                value={String(form.month)}
                onValueChange={(v) => update("month", parseInt(v))}
              >
                <SelectTrigger id="bud-month" className="w-full">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bud-year">Ano</Label>
              <Select
                value={String(form.year)}
                onValueChange={(v) => update("year", parseInt(v))}
              >
                <SelectTrigger id="bud-year" className="w-full">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions().map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {editing ? "Salvar alterações" : "Criar orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Delete dialog ----------------

function DeleteDialog({
  budget,
  open,
  onOpenChange,
}: {
  budget: Budget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!budget) throw new Error("Orçamento inválido.");
      const res = await fetch(`/api/finpro/budgets/${budget.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao excluir orçamento.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Orçamento excluído!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
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
          <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
          <AlertDialogDescription>
            {budget
              ? `Esta ação não pode ser desfeita. O orçamento de "${budget.category?.name ?? "categoria"}" para ${formatMonthYear(
                  new Date(budget.year, budget.month - 1)
                )} será removido permanentemente.`
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

// ---------------- Month/Year selector ----------------

function PeriodSelector({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select
        value={String(month)}
        onValueChange={(v) => onMonthChange(parseInt(v))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(year)}
        onValueChange={(v) => onYearChange(parseInt(v))}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions().map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------- Main view ----------------

export function BudgetsView() {
  const now = useNowMonthYear();
  const [month, setMonth] = useState<number>(now.month);
  const [year, setYear] = useState<number>(now.year);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  // formSession forces the dialog to remount on each open so form state
  // initializes cleanly for create/edit without stale data.
  const [formSession, setFormSession] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Budget | null>(null);

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets", month, year],
    queryFn: async () => {
      const res = await fetch(
        `/api/finpro/budgets?month=${month}&year=${year}`
      );
      if (!res.ok) throw new Error("Erro ao carregar orçamentos.");
      return res.json();
    },
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/finpro/accounts");
      if (!res.ok) throw new Error("Erro ao carregar contas.");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories", "expense"],
    queryFn: async () => {
      const res = await fetch("/api/finpro/categories?type=expense");
      if (!res.ok) throw new Error("Erro ao carregar categorias.");
      return res.json();
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openDelete = (b: Budget) => {
    setToDelete(b);
    setDeleteOpen(true);
  };

  const count = budgets.length;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
          <p className="text-sm text-muted-foreground">
            {count === 0
              ? "Nenhum orçamento"
              : `${count} ${count === 1 ? "orçamento" : "orçamentos"}`}
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo orçamento
        </Button>
      </div>

      {/* Summary */}
      <SummaryCards budgets={budgets} isLoading={isLoading} />

      {/* List */}
      {isLoading ? (
        <BudgetListSkeleton />
      ) : budgets.length === 0 ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <EmptyState
              icon={Target}
              title="Nenhum orçamento neste mês"
              description="Defina limites de gastos por categoria para se manter no controle."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Criar orçamento
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="scrollbar-thin max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {budgets.map((b) => (
            <BudgetRow
              key={b.id}
              budget={b}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {/* Form dialog — remounts on each open via formSession */}
      <BudgetFormDialog
        key={formSession}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        accounts={accounts}
        categories={categories}
        existingBudgets={budgets}
        defaultMonth={month}
        defaultYear={year}
      />

      {/* Delete dialog */}
      <DeleteDialog
        budget={toDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

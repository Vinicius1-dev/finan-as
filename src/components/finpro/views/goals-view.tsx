"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import type { Goal } from "@/lib/types";
import {
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatPercent,
} from "@/lib/format";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/finpro/shared/empty-state";

// ---------------- constants ----------------

const COLOR_PRESETS = [
  "#10B981",
  "#06B6D4",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6B7280",
];

function isoDateToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function deadlineStatus(deadline: string, isCompleted: boolean): {
  label: string;
  tone: "default" | "danger";
} {
  if (isCompleted) return { label: "", tone: "default" };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return { label: "Vence hoje", tone: "danger" };
  if (diffDays < 0) return { label: "Vencida", tone: "danger" };
  return { label: "", tone: "default" };
}

// ---------------- Summary card ----------------

function SummaryCard({
  goals,
  isLoading,
}: {
  goals: Goal[];
  isLoading: boolean;
}) {
  const totals = useMemo(() => {
    let saved = 0;
    let target = 0;
    for (const g of goals) {
      saved += g.currentAmount;
      target += g.targetAmount;
    }
    return { saved, target, pct: target > 0 ? (saved / target) * 100 : 0 };
  }, [goals]);

  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Target className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Total poupado
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-44" />
          ) : (
            <p className="truncate text-xl font-bold tabular-nums">
              <span className="text-primary">
                {formatCurrency(totals.saved)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {formatCurrency(totals.target)}
              </span>
            </p>
          )}
          {!isLoading && totals.target > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(totals.pct, 100)}%` }}
              />
            </div>
          )}
        </div>
        {!isLoading && totals.target > 0 && (
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-muted-foreground">
              Progresso
            </p>
            <p className="text-lg font-bold tabular-nums text-primary">
              {formatPercent(totals.pct)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Circular progress ----------------

function CircularProgress({
  current,
  target,
  color,
}: {
  current: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg
        className="h-32 w-32 -rotate-90"
        viewBox="0 0 120 120"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums">
          {formatPercent(pct)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCurrencyShort(current)}
        </span>
      </div>
    </div>
  );
}

// ---------------- Goal card ----------------

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onContribute,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
  onContribute: (g: Goal) => void;
}) {
  const dStatus = deadlineStatus(goal.deadline, goal.isCompleted);
  const isCompleted = goal.isCompleted;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden py-0 transition-shadow hover:shadow-md",
        isCompleted && "opacity-80"
      )}
    >
      {/* colored accent strip */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: goal.color }}
      />
      <CardContent className="space-y-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">
              {goal.title}
            </p>
            <div className="mt-1.5">
              {isCompleted ? (
                <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Concluída
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">
                  Em andamento
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Ações da meta"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onContribute(goal)}>
                <Plus className="h-4 w-4" />
                Adicionar aporte
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(goal)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Circular progress */}
        <CircularProgress
          current={goal.currentAmount}
          target={goal.targetAmount}
          color={goal.color}
        />

        {/* Amounts */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Atual</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(goal.currentAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Alvo</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(goal.deadline)}
          </span>
          {dStatus.label && (
            <span
              className={cn(
                "font-medium",
                dStatus.tone === "danger"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {dStatus.label}
            </span>
          )}
        </div>

        {/* Contribute button */}
        <Button
          variant="ghost"
          className="w-full border border-dashed border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => onContribute(goal)}
          disabled={isCompleted}
        >
          <Plus className="h-4 w-4" />
          Adicionar aporte
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------- Skeleton ----------------

function GoalsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="py-0">
          <Skeleton className="h-1.5 w-full rounded-none" />
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Goal form dialog ----------------

interface FormState {
  title: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  color: string;
}

function GoalFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Goal | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => {
    if (editing) {
      return {
        title: editing.title,
        targetAmount: String(editing.targetAmount ?? ""),
        currentAmount: String(editing.currentAmount ?? ""),
        deadline: isoDateToLocalInput(editing.deadline),
        color: editing.color || COLOR_PRESETS[0],
      };
    }
    return {
      title: "",
      targetAmount: "",
      currentAmount: "0",
      deadline: todayISODate(),
      color: COLOR_PRESETS[0],
    };
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) {
        throw new Error("Informe o título da meta.");
      }
      const targetNum = parseFloat(form.targetAmount);
      if (!form.targetAmount || isNaN(targetNum) || targetNum <= 0) {
        throw new Error("Informe um valor alvo válido maior que zero.");
      }
      if (!form.deadline) {
        throw new Error("Informe o prazo da meta.");
      }
      const currentNum = parseFloat(form.currentAmount) || 0;
      const body = {
        title: form.title.trim(),
        targetAmount: form.targetAmount,
        currentAmount: String(currentNum),
        deadline: new Date(form.deadline).toISOString(),
        color: form.color,
      };
      const url = editing
        ? `/api/finpro/goals/${editing.id}`
        : "/api/finpro/goals";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao salvar meta.");
      }
      return data as Goal;
    },
    onSuccess: () => {
      toast.success(editing ? "Meta atualizada!" : "Meta criada!");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
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
            {editing ? "Editar meta" : "Nova meta"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados da meta abaixo."
              : "Defina um objetivo financeiro e acompanhe seu progresso."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Título</Label>
            <Input
              id="goal-title"
              type="text"
              placeholder="Ex: Reserva de emergência, Viagem..."
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              autoFocus
            />
          </div>

          {/* Valor alvo + Valor atual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Valor alvo</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  R$
                </span>
                <Input
                  id="goal-target"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.targetAmount}
                  onChange={(e) => update("targetAmount", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-current">Valor atual</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  R$
                </span>
                <Input
                  id="goal-current"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.currentAmount}
                  onChange={(e) => update("currentAmount", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Prazo */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-deadline">Prazo</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full"
            />
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
              {editing ? "Salvar alterações" : "Criar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Contribution dialog ----------------

interface ContributionState {
  amount: string;
  note: string;
}

function ContributionDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContributionState>({
    amount: "",
    note: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!goal) throw new Error("Meta inválida.");
      const amt = parseFloat(form.amount);
      if (!form.amount || isNaN(amt) || amt <= 0) {
        throw new Error("Informe um valor válido maior que zero.");
      }
      const res = await fetch(
        `/api/finpro/goals/${goal.id}/contributions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: form.amount,
            note: form.note.trim() || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao registrar aporte.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Aporte registrado!");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adicionar aporte</DialogTitle>
          <DialogDescription>
            {goal
              ? `Registre um novo aporte para "${goal.title}".`
              : "Registre um novo aporte."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contrib-amount">Valor do aporte</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                R$
              </span>
              <Input
                id="contrib-amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contrib-note">
              Nota <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="contrib-note"
              type="text"
              placeholder="Ex: Aporte mensal, 13º..."
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
            />
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
              Registrar aporte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Delete dialog ----------------

function DeleteDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!goal) throw new Error("Meta inválida.");
      const res = await fetch(`/api/finpro/goals/${goal.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao excluir meta.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Meta excluída!");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
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
          <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
          <AlertDialogDescription>
            {goal
              ? `Esta ação não pode ser desfeita. A meta "${goal.title}" e todos os seus aportes serão removidos permanentemente.`
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

// ---------------- Main view ----------------

export function GoalsView() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  // formSession forces the dialog to remount on each open so form state
  // initializes cleanly for create/edit without stale data.
  const [formSession, setFormSession] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Goal | null>(null);
  const [contribOpen, setContribOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<Goal | null>(null);
  // contribution dialog remount session
  const [contribSession, setContribSession] = useState(0);

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch("/api/finpro/goals");
      if (!res.ok) throw new Error("Erro ao carregar metas.");
      return res.json();
    },
  });

  // Active goals first, completed goals at the end (both still visible)
  const sortedGoals = useMemo(() => {
    const active = goals.filter((g) => !g.isCompleted);
    const completed = goals.filter((g) => g.isCompleted);
    return [...active, ...completed];
  }, [goals]);

  const openCreate = () => {
    setEditing(null);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openDelete = (g: Goal) => {
    setToDelete(g);
    setDeleteOpen(true);
  };

  const openContribute = (g: Goal) => {
    setContribGoal(g);
    setContribSession((s) => s + 1);
    setContribOpen(true);
  };

  const count = goals.length;
  const completedCount = goals.filter((g) => g.isCompleted).length;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {count === 0
            ? "Nenhuma meta criada"
            : `${count} ${count === 1 ? "meta" : "metas"}${
                completedCount > 0
                  ? ` • ${completedCount} concluída${completedCount > 1 ? "s" : ""}`
                  : ""
              }`}
        </p>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nova meta
        </Button>
      </div>

      {/* Summary */}
      <SummaryCard goals={goals} isLoading={isLoading} />

      {/* Grid */}
      {isLoading ? (
        <GoalsGridSkeleton />
      ) : goals.length === 0 ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <EmptyState
              icon={Target}
              title="Nenhuma meta criada"
              description="Defina objetivos financeiros e acompanhe seu progresso."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Criar meta
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGoals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={openEdit}
              onDelete={openDelete}
              onContribute={openContribute}
            />
          ))}
        </div>
      )}

      {/* Form dialog — remounts on each open via formSession */}
      <GoalFormDialog
        key={`form-${formSession}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      {/* Contribution dialog — remounts on each open via contribSession */}
      <ContributionDialog
        key={`contrib-${contribSession}`}
        open={contribOpen}
        onOpenChange={setContribOpen}
        goal={contribGoal}
      />

      {/* Delete dialog */}
      <DeleteDialog
        goal={toDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

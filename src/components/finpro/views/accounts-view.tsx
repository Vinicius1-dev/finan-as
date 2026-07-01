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
  Trash2,
  Wallet,
} from "lucide-react";
import type { Account, AccountType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFinProStore } from "@/store/finpro-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  getAccountIcon,
  getAccountTypeLabel,
} from "@/components/finpro/shared/icons";

// ---------------- constants ----------------

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Dinheiro" },
  { value: "bank", label: "Banco" },
  { value: "card", label: "Cartão" },
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

// ---------------- Total balance summary ----------------

function TotalBalanceCard({
  accounts,
  isLoading,
}: {
  accounts: Account[];
  isLoading: boolean;
}) {
  const total = useMemo(
    () =>
      accounts.reduce(
        (sum, a) => sum + (typeof a.balance === "number" ? a.balance : 0),
        0
      ),
    [accounts]
  );

  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Saldo total
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-40" />
          ) : (
            <p
              className={cn(
                "truncate text-2xl font-bold tabular-nums",
                total < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              )}
            >
              {formatCurrency(total)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Account card ----------------

function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: Account;
  onEdit: (a: Account) => void;
  onDelete: (a: Account) => void;
}) {
  const balance = typeof account.balance === "number" ? account.balance : 0;
  const isNegative = balance < 0;
  const initial =
    account.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Card className="group relative overflow-hidden py-0 transition-shadow hover:shadow-md">
      {/* colored accent strip */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: account.color }}
      />
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm"
              style={{ backgroundColor: account.color }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">
                {account.name}
              </p>
              <Badge
                variant="outline"
                className="mt-1 gap-1 px-1.5 py-0 text-xs font-medium text-muted-foreground"
              >
                {createElement(getAccountIcon(account.type), {
                  className: "h-3 w-3",
                })}
                {getAccountTypeLabel(account.type)}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Ações da conta"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(account)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Saldo atual
          </p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              isNegative
                ? "text-rose-600 dark:text-rose-400"
                : "text-foreground"
            )}
          >
            {formatCurrency(balance)}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Saldo inicial</span>
          <span className="font-medium tabular-nums text-muted-foreground">
            {formatCurrency(account.initialBalance)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Skeleton grid ----------------

function AccountsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="py-0">
          <Skeleton className="h-1.5 w-full rounded-none" />
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Form dialog ----------------

interface FormState {
  name: string;
  type: AccountType;
  initialBalance: string;
  color: string;
}

function AccountFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Account | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => {
    if (editing) {
      return {
        name: editing.name,
        type: editing.type,
        initialBalance: String(editing.initialBalance ?? ""),
        color: editing.color || COLOR_PRESETS[0],
      };
    }
    return {
      name: "",
      type: "bank",
      initialBalance: "",
      color: COLOR_PRESETS[0],
    };
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) {
        throw new Error("Informe o nome da conta.");
      }
      const body = {
        name: form.name.trim(),
        type: form.type,
        initialBalance: form.initialBalance,
        color: form.color,
      };
      const url = editing
        ? `/api/finpro/accounts/${editing.id}`
        : "/api/finpro/accounts";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao salvar conta.");
      }
      return data as Account;
    },
    onSuccess: () => {
      toast.success(editing ? "Conta atualizada!" : "Conta criada!");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
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
            {editing ? "Editar conta" : "Nova conta"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados da conta abaixo."
              : "Preencha os dados para criar uma nova conta."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Nome</Label>
            <Input
              id="acc-name"
              type="text"
              placeholder="Ex: Conta corrente, Carteira..."
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              autoFocus
            />
          </div>

          {/* Tipo + Saldo inicial */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => update("type", v as AccountType)}
              >
                <SelectTrigger id="acc-type" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-balance">Saldo inicial</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  R$
                </span>
                <Input
                  id="acc-balance"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.initialBalance}
                  onChange={(e) => update("initialBalance", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
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
              {editing ? "Salvar alterações" : "Criar conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Delete dialog ----------------

function DeleteDialog({
  account,
  open,
  onOpenChange,
}: {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Conta inválida.");
      const res = await fetch(`/api/finpro/accounts/${account.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao excluir conta.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Conta excluída!");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
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
          <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
          <AlertDialogDescription>
            {account
              ? `Esta ação não pode ser desfeita. A conta "${account.name}" será removida permanentemente. Caso existam transações vinculadas, a exclusão será bloqueada.`
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

export function AccountsView() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  // formSession forces the dialog to remount on each open so form state
  // initializes cleanly for create/edit without stale data.
  const [formSession, setFormSession] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/finpro/accounts");
      if (!res.ok) throw new Error("Erro ao carregar contas.");
      return res.json();
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openDelete = (a: Account) => {
    setToDelete(a);
    setDeleteOpen(true);
  };

  const count = accounts.length;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {count === 0
            ? "Nenhuma conta cadastrada"
            : `${count} ${count === 1 ? "conta cadastrada" : "contas cadastradas"}`}
        </p>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nova conta
        </Button>
      </div>

      {/* Summary */}
      <TotalBalanceCard accounts={accounts} isLoading={isLoading} />

      {/* Grid */}
      {isLoading ? (
        <AccountsGridSkeleton />
      ) : accounts.length === 0 ? (
        <Card className="py-0">
          <CardContent className="p-0">
            <EmptyState
              icon={Wallet}
              title="Nenhuma conta cadastrada"
              description="Crie sua primeira conta para começar a registrar transações."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Nova conta
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {/* Form dialog — remounts on each open via formSession */}
      <AccountFormDialog
        key={formSession}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      {/* Delete dialog */}
      <DeleteDialog
        account={toDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

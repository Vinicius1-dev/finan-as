"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Filter,
  Inbox,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type {
  Account,
  Category,
  Transaction,
  TransactionType,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EmptyState } from "@/components/finpro/shared/empty-state";

// ---------------- helpers ----------------

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
  { value: "transfer", label: "Transferências" },
];

const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer: "Transferência",
};

const TYPE_RADIO_OPTIONS: {
  value: TransactionType;
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
  {
    value: "transfer",
    label: "Transferência",
    color: "text-blue-600 dark:text-blue-400",
  },
];

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoDateToLocalInput(iso: string): string {
  if (!iso) return todayISODate();
  const d = new Date(iso);
  if (isNaN(d.getTime())) return todayISODate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------- Type badge ----------------

function TypeBadge({ type }: { type: TransactionType }) {
  const cls =
    type === "income"
      ? "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : type === "expense"
      ? "border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-300"
      : "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300";
  return <Badge className={cls}>{TYPE_LABELS[type]}</Badge>;
}

// ---------------- Amount cell ----------------

function AmountCell({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        isIncome
          ? "text-emerald-600 dark:text-emerald-400"
          : isTransfer
          ? "text-blue-600 dark:text-blue-400"
          : "text-foreground"
      )}
    >
      {isIncome ? "+" : isTransfer ? "" : "-"}
      {formatCurrency(transaction.amount)}
    </span>
  );
}

// ---------------- Summary cards ----------------

function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const cards = [
    {
      label: "Receitas totais",
      value: totals.income,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      Icon: ArrowDownRight,
    },
    {
      label: "Despesas totais",
      value: totals.expense,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      Icon: ArrowUpRight,
    },
    {
      label: "Saldo",
      value: totals.balance,
      color: "text-primary",
      bg: "bg-primary/10",
      Icon: ArrowLeftRight,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map(({ label, value, color, bg, Icon }) => (
        <Card key={label} className="py-0">
          <CardContent className="flex items-center gap-4 p-4">
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
              <p
                className={cn(
                  "truncate text-lg font-bold tabular-nums",
                  color
                )}
              >
                {formatCurrency(value)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Filter bar ----------------

interface Filters {
  type: string;
  accountId: string;
  categoryId: string;
  from: string;
  to: string;
  search: string;
}

const DEFAULT_FILTERS: Filters = {
  type: "all",
  accountId: "all",
  categoryId: "all",
  from: "",
  to: "",
  search: "",
};

function FilterBar({
  filters,
  setFilters,
  accounts,
  categories,
  onReset,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  accounts: Account[];
  categories: Category[];
  onReset: () => void;
}) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters({ ...filters, [key]: value });

  const hasActive =
    filters.type !== "all" ||
    filters.accountId !== "all" ||
    filters.categoryId !== "all" ||
    filters.from !== "" ||
    filters.to !== "" ||
    filters.search.trim() !== "";

  return (
    <Card className="py-0">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground"
            onClick={onReset}
            disabled={!hasActive}
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select
              value={filters.type}
              onValueChange={(v) => update("type", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Conta</Label>
            <Select
              value={filters.accountId}
              onValueChange={(v) => update("accountId", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <Select
              value={filters.categoryId}
              onValueChange={(v) => update("categoryId", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Busca */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Busca</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Descrição..."
                value={filters.search}
                onChange={(e) => update("search", e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* De */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => update("from", e.target.value)}
              className="w-full"
            />
          </div>

          {/* Até */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => update("to", e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Transactions table ----------------

function TransactionsTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  if (isLoading) {
    return (
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 max-w-[220px] flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="ml-auto h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="py-0">
        <CardContent className="p-0">
          <EmptyState
            icon={Inbox}
            title="Nenhuma transação encontrada"
            description="Tente ajustar ou limpar os filtros para ver mais resultados."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="scrollbar-thin max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b">
              <TableRow>
                <TableHead className="pl-4">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="pr-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => {
                const cat = t.category;
                const isTransfer = t.type === "transfer";
                return (
                  <TableRow key={t.id} className="hover:bg-muted/40">
                    <TableCell className="whitespace-nowrap pl-4 text-sm text-muted-foreground">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate font-medium">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      {cat ? (
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {isTransfer && t.transferTo ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <span className="truncate">{t.account?.name}</span>
                          <ArrowLeftRight className="h-3 w-3 shrink-0" />
                          <span className="truncate">{t.transferTo.name}</span>
                        </span>
                      ) : (
                        <span>{t.account?.name ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={t.type} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountCell transaction={t} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Ações da transação"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(t)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(t)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Transaction form dialog ----------------

interface FormState {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  accountId: string;
  categoryId: string;
  transferToAccountId: string;
}

const EMPTY_FORM: FormState = {
  type: "expense",
  amount: "",
  description: "",
  date: todayISODate(),
  accountId: "",
  categoryId: "",
  transferToAccountId: "",
};

function TransactionFormDialog({
  open,
  onOpenChange,
  editing,
  accounts,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Transaction | null;
  accounts: Account[];
  categories: Category[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => {
    if (editing) {
      return {
        type: editing.type,
        amount: String(editing.amount ?? ""),
        description: editing.description,
        date: isoDateToLocalInput(editing.date),
        accountId: editing.accountId,
        categoryId: editing.categoryId ?? "",
        transferToAccountId: editing.transferToAccountId ?? "",
      };
    }
    return {
      ...EMPTY_FORM,
      accountId: accounts[0]?.id ?? "",
      date: todayISODate(),
    };
  });

  // In create mode, default the account when accounts are already loaded
  // at mount time (handled by the lazy initializer above). The dialog is
  // remounted on each open via `key={formSession}` so this is fresh.
  const isTransfer = form.type === "transfer";

  const filteredCategories = useMemo(() => {
    if (isTransfer) return [];
    return categories.filter((c) => c.type === form.type);
  }, [categories, form.type, isTransfer]);

  const availableDestAccounts = useMemo(
    () => accounts.filter((a) => a.id !== form.accountId),
    [accounts, form.accountId]
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTypeChange = (next: TransactionType) => {
    setForm((prev) => ({
      ...prev,
      type: next,
      // categories are type-specific, reset to avoid mismatches
      categoryId: "",
      transferToAccountId:
        next === "transfer" ? prev.transferToAccountId : "",
    }));
  };

  const handleAccountChange = (id: string) => {
    setForm((prev) => ({
      ...prev,
      accountId: id,
      transferToAccountId:
        prev.transferToAccountId === id ? "" : prev.transferToAccountId,
    }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(form.amount);
      if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Informe um valor válido maior que zero.");
      }
      if (!form.description.trim()) {
        throw new Error("Informe uma descrição.");
      }
      if (!form.accountId) {
        throw new Error("Selecione uma conta.");
      }
      if (isTransfer) {
        if (!form.transferToAccountId) {
          throw new Error("Selecione a conta de destino.");
        }
        if (form.transferToAccountId === form.accountId) {
          throw new Error("A conta de destino deve ser diferente da origem.");
        }
      }
      const body = {
        type: form.type,
        amount: form.amount,
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        accountId: form.accountId,
        categoryId:
          isTransfer || !form.categoryId ? null : form.categoryId,
        transferToAccountId: isTransfer ? form.transferToAccountId : null,
      };
      const url = editing
        ? `/api/finpro/transactions/${editing.id}`
        : "/api/finpro/transactions";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao salvar transação.");
      }
      return data as Transaction;
    },
    onSuccess: () => {
      toast.success(
        editing ? "Transação atualizada!" : "Transação criada!"
      );
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar transação" : "Nova transação"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados da transação abaixo."
              : "Preencha os dados para registrar uma nova transação."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <RadioGroup
              value={form.type}
              onValueChange={(v) => handleTypeChange(v as TransactionType)}
              className="grid grid-cols-3 gap-2"
            >
              {TYPE_RADIO_OPTIONS.map((opt) => {
                const active = form.type === opt.value;
                return (
                  <Label
                    key={opt.value}
                    htmlFor={`type-${opt.value}`}
                    className={cn(
                      "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                      active && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem
                      id={`type-${opt.value}`}
                      value={opt.value}
                      className="sr-only"
                    />
                    <span className={cn(active && opt.color)}>{opt.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  R$
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              type="text"
              placeholder="Ex: Aluguel, Salário, Mercado..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          {/* Conta */}
          <div className="space-y-1.5">
            <Label htmlFor="account">
              {isTransfer ? "Conta de origem" : "Conta"}
            </Label>
            <Select
              value={form.accountId || undefined}
              onValueChange={handleAccountChange}
            >
              <SelectTrigger id="account" className="w-full">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria (only income/expense) */}
          {!isTransfer && (
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(v) => update("categoryId", v)}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Nenhuma categoria disponível
                    </div>
                  ) : (
                    filteredCategories.map((c) => (
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
          )}

          {/* Conta de destino (only transfer) */}
          {isTransfer && (
            <div className="space-y-1.5">
              <Label htmlFor="transferTo">Conta de destino</Label>
              <Select
                value={form.transferToAccountId || undefined}
                onValueChange={(v) => update("transferToAccountId", v)}
              >
                <SelectTrigger id="transferTo" className="w-full">
                  <SelectValue placeholder="Selecione a conta de destino" />
                </SelectTrigger>
                <SelectContent>
                  {availableDestAccounts.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Nenhuma conta disponível
                    </div>
                  ) : (
                    availableDestAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

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
              {editing ? "Salvar alterações" : "Criar transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Delete confirmation ----------------

function DeleteDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!transaction) throw new Error("Transação inválida.");
      const res = await fetch(
        `/api/finpro/transactions/${transaction.id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Erro ao excluir transação.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Transação excluída!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
          <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
          <AlertDialogDescription>
            {transaction
              ? `Esta ação não pode ser desfeita. A transação "${transaction.description}" será removida permanentemente.`
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

export function TransactionsView() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  // formSession forces the dialog to remount on each open so form state
  // initializes cleanly for create/edit without stale data
  const [formSession, setFormSession] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== "all")
      params.set("type", filters.type);
    if (filters.accountId && filters.accountId !== "all")
      params.set("accountId", filters.accountId);
    if (filters.categoryId && filters.categoryId !== "all")
      params.set("categoryId", filters.categoryId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.search.trim()) params.set("search", filters.search.trim());
    return params.toString();
  }, [filters]);

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const res = await fetch(`/api/finpro/transactions?${queryParams}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar transações.");
      }
      return res.json() as Promise<Transaction[]>;
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
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const res = await fetch("/api/finpro/categories");
      if (!res.ok) throw new Error("Erro ao carregar categorias.");
      return res.json();
    },
  });

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  const openCreate = () => {
    setEditing(null);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const openDelete = (t: Transaction) => {
    setToDelete(t);
    setDeleteOpen(true);
  };

  const count = transactions.length;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {count}{" "}
          {count === 1 ? "transação encontrada" : "transações encontradas"}
        </p>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nova transação
        </Button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        accounts={accounts}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Summary */}
      <SummaryCards transactions={transactions} />

      {/* Table */}
      <TransactionsTable
        transactions={transactions}
        isLoading={txLoading}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {/* Form dialog — remounts on each open via formSession */}
      <TransactionFormDialog
        key={formSession}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        accounts={accounts}
        categories={categories}
      />

      {/* Delete dialog */}
      <DeleteDialog
        transaction={toDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

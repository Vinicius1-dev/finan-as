"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PiggyBank,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/finpro/shared/empty-state";
import {
  getTransactionTypeLabel,
} from "@/components/finpro/shared/icons";
import { useFinProStore } from "@/store/finpro-store";
import { cn } from "@/lib/utils";

function fetchDashboard(): Promise<DashboardData> {
  return fetch("/api/finpro/dashboard").then((r) => {
    if (!r.ok) throw new Error("Falha ao carregar dashboard");
    return r.json();
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  iconClass,
  positive,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  iconClass: string;
  positive?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              iconClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md",
                positive
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {formatPercent(Math.abs(change))}
            </span>
            <span className="text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-md text-xs">
      {label && <p className="font-semibold mb-1.5 capitalize">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardView() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
  const { setActiveView } = useFinProStore();

  if (isError) {
    return (
      <EmptyState
        icon={Inbox}
        title="Não foi possível carregar o dashboard"
        description="Verifique se o banco de dados está acessível e tente novamente."
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  const { stats, monthly, expenseByCategory, recentTransactions, accounts } = data;

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(stats.totalBalance)}
          icon={Wallet}
          iconClass="bg-primary/10 text-primary"
          change={undefined}
        />
        <StatCard
          title="Receitas do mês"
          value={formatCurrency(stats.monthIncome)}
          icon={TrendingUp}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          change={stats.incomeChange}
          changeLabel="vs. mês anterior"
          positive={stats.incomeChange >= 0}
        />
        <StatCard
          title="Despesas do mês"
          value={formatCurrency(stats.monthExpense)}
          icon={TrendingDown}
          iconClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          change={stats.expenseChange}
          changeLabel="vs. mês anterior"
          positive={stats.expenseChange < 0}
        />
        <StatCard
          title="Saldo do mês"
          value={formatCurrency(stats.monthBalance)}
          icon={Scale}
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          change={undefined}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Gráfico de área — receitas vs despesas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Receitas x Despesas</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <ArrowLeftRight className="h-3 w-3" />
              {monthly.length} meses
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    className="capitalize"
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    name="Receitas"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#gInc)"
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    fill="url(#gExp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pizza — despesas por categoria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <EmptyState
                icon={PiggyBank}
                title="Sem despesas"
                description="Nenhuma despesa registrada neste mês."
                className="py-6"
              />
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {expenseByCategory.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-3 max-h-[100px] overflow-y-auto scrollbar-thin">
                  {expenseByCategory.slice(0, 5).map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="font-semibold ml-2">
                        {formatPercent(c.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transações recentes + Contas */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Transações recentes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setActiveView("transactions")}
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nenhuma transação ainda"
                description="Comece registrando sua primeira transação."
                className="py-8"
                action={
                  <Button size="sm" onClick={() => setActiveView("transactions")}>
                    Registrar transação
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map((t) => {
                  const isIncome = t.type === "income";
                  const isTransfer = t.type === "transfer";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          isIncome
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : isTransfer
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : isTransfer ? (
                          <ArrowLeftRight className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTransactionTypeLabel(t.type)} • {t.account?.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isTransfer
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-foreground"
                          )}
                        >
                          {isIncome ? "+" : isTransfer ? "" : "-"}
                          {formatCurrency(t.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(t.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Minhas contas</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setActiveView("accounts")}
            >
              Gerenciar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{acc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-sm font-semibold shrink-0",
                    acc.balance < 0 ? "text-destructive" : "text-foreground"
                  )}
                >
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  FileBarChart,
  Loader2,
  PiggyBank,
  PieChart,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/finpro/shared/empty-state";

// ---------------- Types ----------------

interface MonthlyEntry {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface Totals {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
}

interface CategoryEntry {
  name: string;
  value: number;
  color: string;
}

interface ReportData {
  year: number;
  monthly: MonthlyEntry[];
  totals: Totals;
  byCategory: CategoryEntry[];
}

// ---------------- Helpers ----------------

function yearOptions(): number[] {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2];
}

async function fetchReport(year: number): Promise<ReportData> {
  const res = await fetch(`/api/finpro/reports?year=${year}`);
  if (!res.ok) {
    throw new Error("Erro ao gerar relatório");
  }
  return res.json() as Promise<ReportData>;
}

// ---------------- Chart Tooltip ----------------

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-md">
      {label && (
        <p className="mb-1.5 font-semibold capitalize">{label}</p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------- Summary Cards ----------------

interface SummaryCardData {
  label: string;
  value: string;
  color: string;
  bg: string;
  Icon: typeof TrendingUp;
}

function SummaryCards({
  totals,
  isLoading,
}: {
  totals: Totals | undefined;
  isLoading: boolean;
}) {
  const isNegative = (totals?.balance ?? 0) < 0;

  const cards: SummaryCardData[] = [
    {
      label: "Receitas",
      value: totals ? formatCurrency(totals.income) : "",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      Icon: TrendingUp,
    },
    {
      label: "Despesas",
      value: totals ? formatCurrency(totals.expense) : "",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      Icon: TrendingDown,
    },
    {
      label: "Saldo",
      value: totals ? formatCurrency(totals.balance) : "",
      color: isNegative
        ? "text-rose-600 dark:text-rose-400"
        : "text-primary",
      bg: isNegative ? "bg-rose-500/10" : "bg-primary/10",
      Icon: Scale,
    },
    {
      label: "Taxa de poupança",
      value: totals ? formatPercent(totals.savingsRate) : "",
      color: "text-primary",
      bg: "bg-primary/10",
      Icon: PiggyBank,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                  {value}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Monthly Bar Chart ----------------

function MonthlyBarChart({
  monthly,
  isLoading,
}: {
  monthly: MonthlyEntry[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">
          Receitas x Despesas por mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthly}
                barGap={4}
                barCategoryGap="20%"
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(v: number) => formatCurrencyShort(v)}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  dataKey="receitas"
                  name="Receitas"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas"
                  fill="var(--chart-4)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Category Breakdown ----------------

const TOP_N_CATEGORIES = 10;

function CategoryBreakdown({
  byCategory,
  isLoading,
  year,
}: {
  byCategory: CategoryEntry[] | undefined;
  isLoading: boolean;
  year: number;
}) {
  const { rows, maxValue, hiddenCount, total } = useMemo(() => {
    const list = byCategory ?? [];
    const total = list.reduce((sum, c) => sum + c.value, 0);
    const top = list.slice(0, TOP_N_CATEGORIES);
    const max = top.reduce((m, c) => Math.max(m, c.value), 0);
    return {
      rows: top,
      maxValue: max || 1,
      hiddenCount: Math.max(0, list.length - TOP_N_CATEGORIES),
      total,
    };
  }, [byCategory]);

  const isEmpty = !isLoading && (byCategory?.length ?? 0) === 0;

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Despesas por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={PieChart}
            title="Sem despesas"
            description={`Nenhuma despesa registrada em ${year}.`}
          />
        ) : (
          <div className="space-y-3">
            <div className="max-h-80 space-y-3 overflow-y-auto scrollbar-thin pr-1">
              {rows.map((c) => {
                const pct =
                  total > 0 ? (c.value / total) * 100 : 0;
                const widthPct = Math.max(
                  4,
                  (c.value / maxValue) * 100
                );
                return (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="truncate font-medium">
                          {c.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums font-semibold">
                          {formatCurrency(c.value)}
                        </span>
                        <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                          {formatPercent(pct)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {hiddenCount > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                + {hiddenCount} categoria{hiddenCount > 1 ? "s" : ""} menor
                {hiddenCount > 1 ? "es" : ""} não exibida
                {hiddenCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Monthly Table ----------------

function MonthlyTable({
  monthly,
  isLoading,
}: {
  monthly: MonthlyEntry[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalhamento mensal</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="pl-3">Mês</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="pr-3 text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthly?.map((m) => {
                  const positive = m.saldo >= 0;
                  return (
                    <TableRow key={m.month}>
                      <TableCell className="pl-3 font-medium capitalize">
                        {m.month}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(m.receitas)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                        {formatCurrency(m.despesas)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "pr-3 text-right font-semibold tabular-nums",
                          positive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {formatCurrency(m.saldo)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Main View ----------------

export function ReportsView() {
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", year],
    queryFn: () => fetchReport(year),
  });

  const downloadCsv = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/finpro/reports?year=${year}&export=csv`);
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finpro-relatorio-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado!");
    } catch {
      toast.error("Não foi possível exportar o relatório.");
    } finally {
      setExporting(false);
    }
  };

  // ---------- Error state ----------
  if (isError) {
    return (
      <div className="space-y-6">
        <Header
          year={year}
          onYearChange={setYear}
          onExport={downloadCsv}
          exporting={exporting}
        />
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={FileBarChart}
              title="Erro ao gerar relatório"
              description="Não foi possível carregar os dados deste ano. Tente novamente em instantes."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Empty state ----------
  const isEmpty =
    !isLoading &&
    !!data &&
    data.totals.income === 0 &&
    data.totals.expense === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <Header
          year={year}
          onYearChange={setYear}
          onExport={downloadCsv}
          exporting={exporting}
        />
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={FileBarChart}
              title={`Sem dados em ${year}`}
              description="Não há transações registradas neste ano."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Main render ----------
  return (
    <div className="space-y-6">
      <Header
        year={year}
        onYearChange={setYear}
        onExport={downloadCsv}
        exporting={exporting}
      />

      <SummaryCards totals={data?.totals} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MonthlyBarChart monthly={data?.monthly} isLoading={isLoading} />
        <CategoryBreakdown
          byCategory={data?.byCategory}
          isLoading={isLoading}
          year={year}
        />
      </div>

      <MonthlyTable monthly={data?.monthly} isLoading={isLoading} />
    </div>
  );
}

// ---------------- Header ----------------

function Header({
  year,
  onYearChange,
  onExport,
  exporting,
}: {
  year: number;
  onYearChange: (y: number) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Análise anual das suas finanças
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={String(year)}
          onValueChange={(v) => onYearChange(Number(v))}
        >
          <SelectTrigger className="w-[120px]" aria-label="Ano">
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
        <Button
          variant="outline"
          onClick={onExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Exportar CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>
      </div>
    </div>
  );
}

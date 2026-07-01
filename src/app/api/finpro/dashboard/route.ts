import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// Calcula o saldo real de cada conta considerando receitas, despesas e transferências
async function computeAccountBalances(userId: string) {
  const accounts = await db.account.findMany({ where: { userId } });

  const balances = await Promise.all(
    accounts.map(async (acc) => {
      const [incomeAgg, expenseAgg, transferOutAgg, transferInAgg] = await Promise.all([
        db.transaction.aggregate({ where: { accountId: acc.id, type: "income" }, _sum: { amount: true } }),
        db.transaction.aggregate({ where: { accountId: acc.id, type: "expense" }, _sum: { amount: true } }),
        db.transaction.aggregate({ where: { accountId: acc.id, type: "transfer" }, _sum: { amount: true } }),
        db.transaction.aggregate({ where: { transferToAccountId: acc.id, type: "transfer" }, _sum: { amount: true } }),
      ]);

      const balance =
        acc.initialBalance +
        (incomeAgg._sum.amount || 0) -
        (expenseAgg._sum.amount || 0) -
        (transferOutAgg._sum.amount || 0) +
        (transferInAgg._sum.amount || 0);

      return { ...acc, balance };
    })
  );

  return balances;
}

export async function GET() {
  try {
    const user = await requireUser();
    const userId = user.id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ---- Saldo total + contas (do usuário) ----
    const accountsWithBalance = await computeAccountBalances(userId);
    const totalBalance = accountsWithBalance.reduce((s, a) => s + a.balance, 0);

    // ---- Receitas e despesas do mês atual (do usuário) ----
    const userTxWhere = { userId };
    const [monthIncomeAgg, monthExpenseAgg, prevIncomeAgg, prevExpenseAgg] = await Promise.all([
      db.transaction.aggregate({
        where: { ...userTxWhere, type: "income", date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...userTxWhere, type: "expense", date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...userTxWhere, type: "income", date: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...userTxWhere, type: "expense", date: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        _sum: { amount: true },
      }),
    ]);

    const monthIncome = monthIncomeAgg._sum.amount || 0;
    const monthExpense = monthExpenseAgg._sum.amount || 0;
    const prevIncome = prevIncomeAgg._sum.amount || 0;
    const prevExpense = prevExpenseAgg._sum.amount || 0;

    const incomeChange = prevIncome > 0 ? ((monthIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange = prevExpense > 0 ? ((monthExpense - prevExpense) / prevExpense) * 100 : 0;

    // ---- Série mensal dos últimos 6 meses ----
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const [inc, exp] = await Promise.all([
        db.transaction.aggregate({ where: { ...userTxWhere, type: "income", date: { gte: s, lte: e } }, _sum: { amount: true } }),
        db.transaction.aggregate({ where: { ...userTxWhere, type: "expense", date: { gte: s, lte: e } }, _sum: { amount: true } }),
      ]);
      const receitas = inc._sum.amount || 0;
      const despesas = exp._sum.amount || 0;
      monthly.push({
        month: s.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receitas,
        despesas,
        saldo: receitas - despesas,
      });
    }

    // ---- Despesas por categoria (mês atual, do usuário) ----
    const monthExpenses = await db.transaction.findMany({
      where: { ...userTxWhere, type: "expense", date: { gte: startOfMonth } },
      include: { category: true },
    });
    const byCat = new Map<string, { name: string; value: number; color: string }>();
    let totalExpenses = 0;
    for (const t of monthExpenses) {
      const key = t.category?.id || "sem-categoria";
      const name = t.category?.name || "Sem categoria";
      const color = t.category?.color || "#6B7280";
      const existing = byCat.get(key) || { name, value: 0, color };
      existing.value += t.amount;
      byCat.set(key, existing);
      totalExpenses += t.amount;
    }
    const expenseByCategory = Array.from(byCat.values())
      .map((c) => ({ ...c, percentage: totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    // ---- Receitas por categoria (mês atual, do usuário) ----
    const monthIncomes = await db.transaction.findMany({
      where: { ...userTxWhere, type: "income", date: { gte: startOfMonth } },
      include: { category: true },
    });
    const byCatInc = new Map<string, { name: string; value: number; color: string }>();
    let totalIncomes = 0;
    for (const t of monthIncomes) {
      const key = t.category?.id || "sem-categoria";
      const name = t.category?.name || "Sem categoria";
      const color = t.category?.color || "#6B7280";
      const existing = byCatInc.get(key) || { name, value: 0, color };
      existing.value += t.amount;
      byCatInc.set(key, existing);
      totalIncomes += t.amount;
    }
    const incomeByCategory = Array.from(byCatInc.values())
      .map((c) => ({ ...c, percentage: totalIncomes > 0 ? (c.value / totalIncomes) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    // ---- Transações recentes (do usuário) ----
    const recentTransactions = await db.transaction.findMany({
      where: { userId },
      take: 6,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { account: true, category: true },
    });

    const transactionCount = await db.transaction.count({ where: { userId } });

    return NextResponse.json({
      stats: {
        totalBalance,
        monthIncome,
        monthExpense,
        monthBalance: monthIncome - monthExpense,
        expenseChange,
        incomeChange,
        accountCount: accountsWithBalance.length,
        transactionCount,
      },
      monthly,
      expenseByCategory,
      incomeByCategory,
      recentTransactions,
      accounts: accountsWithBalance,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[dashboard] error:", error);
    return NextResponse.json({ error: "Erro ao carregar dashboard" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/finpro/reports?year=&export=csv
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
    const exportCsv = searchParams.get("export") === "csv";

    // Resumo mensal do ano
    const monthly = [];
    let totalIncome = 0;
    let totalExpense = 0;
    for (let m = 0; m < 12; m++) {
      const s = new Date(year, m, 1);
      const e = new Date(year, m + 1, 0, 23, 59, 59);
      const [inc, exp] = await Promise.all([
        db.transaction.aggregate({ where: { type: "income", date: { gte: s, lte: e } }, _sum: { amount: true } }),
        db.transaction.aggregate({ where: { type: "expense", date: { gte: s, lte: e } }, _sum: { amount: true } }),
      ]);
      const receitas = inc._sum.amount || 0;
      const despesas = exp._sum.amount || 0;
      totalIncome += receitas;
      totalExpense += despesas;
      monthly.push({
        month: s.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receitas,
        despesas,
        saldo: receitas - despesas,
      });
    }

    // Despesas por categoria no ano
    const startYear = new Date(year, 0, 1);
    const endYear = new Date(year, 11, 31, 23, 59, 59);
    const expenses = await db.transaction.findMany({
      where: { type: "expense", date: { gte: startYear, lte: endYear } },
      include: { category: true },
    });
    const byCat = new Map<string, { name: string; value: number; color: string }>();
    for (const t of expenses) {
      const key = t.category?.name || "Sem categoria";
      const existing = byCat.get(key) || { name: key, value: 0, color: t.category?.color || "#6B7280" };
      existing.value += t.amount;
      byCat.set(key, existing);
    }
    const byCategory = Array.from(byCat.values()).sort((a, b) => b.value - a.value);

    if (exportCsv) {
      const allTx = await db.transaction.findMany({
        where: { date: { gte: startYear, lte: endYear } },
        include: { account: true, category: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
      const rows = [
        ["Data", "Tipo", "Descrição", "Categoria", "Conta", "Valor"],
        ...allTx.map((t) => [
          new Date(t.date).toLocaleDateString("pt-BR"),
          t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferência",
          `"${t.description.replace(/"/g, '""')}"`,
          t.category?.name || "",
          t.account?.name || "",
          t.amount.toFixed(2),
        ]),
      ];
      const csv = rows.map((r) => r.join(",")).join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="finpro-relatorio-${year}.csv"`,
        },
      });
    }

    return NextResponse.json({
      year,
      monthly,
      totals: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
      },
      byCategory,
    });
  } catch (error) {
    console.error("[reports GET] error:", error);
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/finpro/budgets?month=&year=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    const budgets = await db.budget.findMany({
      where: { month, year },
      include: { category: true, account: true },
      orderBy: { category: { name: "asc" } },
    });

    // Calcula quanto foi gasto em cada categoria no mês/ano
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const withSpent = await Promise.all(
      budgets.map(async (b) => {
        const agg = await db.transaction.aggregate({
          where: {
            type: "expense",
            categoryId: b.categoryId,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });
        return { ...b, spent: agg._sum.amount || 0 };
      })
    );

    return NextResponse.json(withSpent);
  } catch (error) {
    console.error("[budgets GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar orçamentos" }, { status: 500 });
  }
}

// POST /api/finpro/budgets
export async function POST(req: NextRequest) {
  try {
    const { amount, month, year, categoryId, accountId } = await req.json();
    if (!amount || !month || !year || !categoryId || !accountId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }
    const budget = await db.budget.create({
      data: {
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
        categoryId,
        accountId,
      },
      include: { category: true, account: true },
    });
    return NextResponse.json({ ...budget, spent: 0 }, { status: 201 });
  } catch (error) {
    console.error("[budgets POST] error:", error);
    return NextResponse.json({ error: "Erro ao criar orçamento" }, { status: 500 });
  }
}

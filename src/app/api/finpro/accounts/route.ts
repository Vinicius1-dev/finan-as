import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function computeBalance(accId: string) {
  const acc = await db.account.findUnique({ where: { id: accId } });
  if (!acc) return 0;
  const [incomeAgg, expenseAgg, transferOutAgg, transferInAgg] = await Promise.all([
    db.transaction.aggregate({ where: { accountId: acc.id, type: "income" }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { accountId: acc.id, type: "expense" }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { accountId: acc.id, type: "transfer" }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { transferToAccountId: acc.id, type: "transfer" }, _sum: { amount: true } }),
  ]);
  return (
    acc.initialBalance +
    (incomeAgg._sum.amount || 0) -
    (expenseAgg._sum.amount || 0) -
    (transferOutAgg._sum.amount || 0) +
    (transferInAgg._sum.amount || 0)
  );
}

// GET /api/finpro/accounts
export async function GET() {
  try {
    const accounts = await db.account.findMany({ orderBy: { createdAt: "asc" } });
    const withBalance = await Promise.all(
      accounts.map(async (a) => ({ ...a, balance: await computeBalance(a.id) }))
    );
    return NextResponse.json(withBalance);
  } catch (error) {
    console.error("[accounts GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar contas" }, { status: 500 });
  }
}

// POST /api/finpro/accounts
export async function POST(req: NextRequest) {
  try {
    const { name, type, initialBalance, color } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });
    }
    const account = await db.account.create({
      data: {
        name,
        type,
        initialBalance: parseFloat(initialBalance) || 0,
        color: color || "#6B7280",
      },
    });
    return NextResponse.json({ ...account, balance: account.initialBalance }, { status: 201 });
  } catch (error) {
    console.error("[accounts POST] error:", error);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/finpro/transactions
// Query params: type, accountId, categoryId, from, to, search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (type && type !== "all") where.type = type;
    if (accountId && accountId !== "all") where.accountId = accountId;
    if (categoryId && categoryId !== "all") where.categoryId = categoryId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as { gte?: Date }).gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        (where.date as { lte?: Date }).lte = end;
      }
    }
    if (search) {
      where.description = { contains: search };
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { account: true, category: true, transferTo: true },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[transactions GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar transações" }, { status: 500 });
  }
}

// POST /api/finpro/transactions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, description, date, accountId, categoryId, transferToAccountId } = body;

    if (!type || !amount || !description || !date || !accountId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      type,
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      accountId,
    };

    if (type === "transfer") {
      if (!transferToAccountId) {
        return NextResponse.json({ error: "Transferência precisa de conta de destino" }, { status: 400 });
      }
      data.transferToAccountId = transferToAccountId;
      data.categoryId = null;
    } else {
      if (categoryId) data.categoryId = categoryId;
      data.transferToAccountId = null;
    }

    const transaction = await db.transaction.create({ data, include: { account: true, category: true } });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("[transactions POST] error:", error);
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}

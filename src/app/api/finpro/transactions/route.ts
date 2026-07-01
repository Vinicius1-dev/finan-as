import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// GET /api/finpro/transactions
// Query params: type, accountId, categoryId, from, to, search
// Sempre filtrado pelo usuário autenticado.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { userId };
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
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[transactions GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar transações" }, { status: 500 });
  }
}

// POST /api/finpro/transactions
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const body = await req.json();
    const { type, amount, description, date, accountId, categoryId, transferToAccountId } = body;

    if (!type || !amount || !description || !date || !accountId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Validação de ownership: a conta de origem deve pertencer ao usuário
    const account = await db.account.findFirst({ where: { id: accountId, userId } });
    if (!account) {
      return NextResponse.json({ error: "Conta inválida." }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      type,
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      accountId,
      userId,
    };

    if (type === "transfer") {
      if (!transferToAccountId) {
        return NextResponse.json({ error: "Transferência precisa de conta de destino" }, { status: 400 });
      }
      const destAccount = await db.account.findFirst({ where: { id: transferToAccountId, userId } });
      if (!destAccount) {
        return NextResponse.json({ error: "Conta de destino inválida." }, { status: 400 });
      }
      data.transferToAccountId = transferToAccountId;
      data.categoryId = null;
    } else {
      if (categoryId) {
        const cat = await db.category.findFirst({ where: { id: categoryId, userId } });
        if (!cat) {
          return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
        }
        data.categoryId = categoryId;
      }
      data.transferToAccountId = null;
    }

    const transaction = await db.transaction.create({
      data,
      include: { account: true, category: true },
    });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[transactions POST] error:", error);
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}

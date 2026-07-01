import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// PUT /api/finpro/transactions/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;
    const body = await req.json();
    const { type, amount, description, date, accountId, categoryId, transferToAccountId } = body;

    // Verifica ownership da transação
    const existing = await db.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 });
    }

    // Valida ownership da conta
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
    };

    if (type === "transfer") {
      data.transferToAccountId = transferToAccountId || null;
      data.categoryId = null;
    } else {
      data.categoryId = categoryId || null;
      data.transferToAccountId = null;
    }

    const transaction = await db.transaction.update({
      where: { id },
      data,
      include: { account: true, category: true },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[transactions PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 });
  }
}

// DELETE /api/finpro/transactions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;

    // Verifica ownership antes de excluir
    const existing = await db.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 });
    }

    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[transactions DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 500 });
  }
}

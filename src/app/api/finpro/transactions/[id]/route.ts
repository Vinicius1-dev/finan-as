import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/finpro/transactions/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { type, amount, description, date, accountId, categoryId, transferToAccountId } = body;

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
    console.error("[transactions PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 });
  }
}

// DELETE /api/finpro/transactions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[transactions DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 500 });
  }
}

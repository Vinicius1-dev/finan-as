import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// PUT /api/finpro/budgets/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;
    const { amount, month, year, categoryId, accountId } = await req.json();

    const existing = await db.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
    }

    const budget = await db.budget.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
        categoryId,
        accountId,
      },
      include: { category: true, account: true },
    });
    return NextResponse.json(budget);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[budgets PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 500 });
  }
}

// DELETE /api/finpro/budgets/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;

    const existing = await db.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
    }

    await db.budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[budgets DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir orçamento" }, { status: 500 });
  }
}

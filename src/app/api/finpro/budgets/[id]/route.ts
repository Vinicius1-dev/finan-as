import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/finpro/budgets/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { amount, month, year, categoryId, accountId } = await req.json();
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
    console.error("[budgets PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 500 });
  }
}

// DELETE /api/finpro/budgets/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[budgets DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir orçamento" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// PUT /api/finpro/accounts/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;
    const { name, type, initialBalance, color } = await req.json();

    // Verifica ownership
    const existing = await db.account.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    const account = await db.account.update({
      where: { id },
      data: {
        name,
        type,
        initialBalance: parseFloat(initialBalance) || 0,
        color,
      },
    });
    return NextResponse.json(account);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[accounts PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 });
  }
}

// DELETE /api/finpro/accounts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;

    // Verifica ownership
    const existing = await db.account.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    // Verifica se há transações vinculadas
    const count = await db.transaction.count({ where: { accountId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: existem ${count} transações vinculadas a esta conta.` },
        { status: 409 }
      );
    }
    await db.account.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[accounts DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 });
  }
}

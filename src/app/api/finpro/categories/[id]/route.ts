import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// PUT /api/finpro/categories/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;
    const { name, type, color, icon } = await req.json();

    const existing = await db.category.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }

    const category = await db.category.update({
      where: { id },
      data: { name, type, color, icon },
    });
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[categories PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

// DELETE /api/finpro/categories/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;

    const existing = await db.category.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }

    // Remove a referência das transações antes de excluir (categoryId = null)
    await db.transaction.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await db.budget.deleteMany({ where: { categoryId: id } });
    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[categories DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 });
  }
}

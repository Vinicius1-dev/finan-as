import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/finpro/categories/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, type, color, icon } = await req.json();
    const category = await db.category.update({
      where: { id },
      data: { name, type, color, icon },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("[categories PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

// DELETE /api/finpro/categories/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Remove a referência das transações antes de excluir (categoryId = null)
    await db.transaction.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await db.budget.deleteMany({ where: { categoryId: id } });
    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[categories DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 });
  }
}

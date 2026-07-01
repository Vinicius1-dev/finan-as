import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// PUT /api/finpro/goals/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;
    const { title, targetAmount, currentAmount, deadline, color } = await req.json();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Meta não encontrada." }, { status: 404 });
    }

    const goal = await db.goal.update({
      where: { id },
      data: {
        title,
        targetAmount: target,
        currentAmount: current,
        deadline: new Date(deadline),
        color: color || "#10B981",
        isCompleted: current >= target,
      },
      include: { contributions: { orderBy: { date: "desc" } } },
    });
    return NextResponse.json(goal);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[goals PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
  }
}

// DELETE /api/finpro/goals/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;

    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Meta não encontrada." }, { status: 404 });
    }

    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[goals DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 });
  }
}

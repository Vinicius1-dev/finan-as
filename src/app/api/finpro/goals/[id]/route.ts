import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/finpro/goals/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title, targetAmount, currentAmount, deadline, color } = await req.json();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

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
    console.error("[goals PUT] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
  }
}

// DELETE /api/finpro/goals/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[goals DELETE] error:", error);
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 });
  }
}

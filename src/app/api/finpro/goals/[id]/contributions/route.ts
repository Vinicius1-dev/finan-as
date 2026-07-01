import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// GET /api/finpro/goals/[id]/contributions
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;

    // Verifica ownership da meta
    const goal = await db.goal.findFirst({ where: { id, userId } });
    if (!goal) {
      return NextResponse.json({ error: "Meta não encontrada." }, { status: 404 });
    }

    const contributions = await db.goalContribution.findMany({
      where: { goalId: id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(contributions);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[contributions GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar contribuições" }, { status: 500 });
  }
}

// POST /api/finpro/goals/[id]/contributions
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { id } = await params;
    const { amount, note } = await req.json();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    // Verifica ownership da meta
    const goal = await db.goal.findFirst({ where: { id, userId } });
    if (!goal) {
      return NextResponse.json({ error: "Meta não encontrada." }, { status: 404 });
    }

    const contribution = await db.goalContribution.create({
      data: { goalId: id, amount: amt, note: note || null },
    });

    // Atualiza currentAmount e isCompleted
    const newCurrent = goal.currentAmount + amt;
    await db.goal.update({
      where: { id },
      data: { currentAmount: newCurrent, isCompleted: newCurrent >= goal.targetAmount },
    });

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[contributions POST] error:", error);
    return NextResponse.json({ error: "Erro ao registrar contribuição" }, { status: 500 });
  }
}

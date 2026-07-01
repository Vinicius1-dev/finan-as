import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// GET /api/finpro/goals
export async function GET() {
  try {
    const user = await requireUser();
    const userId = user.id;
    const goals = await db.goal.findMany({
      where: { userId },
      orderBy: [{ isCompleted: "asc" }, { deadline: "asc" }],
      include: { contributions: { orderBy: { date: "desc" } } },
    });
    return NextResponse.json(goals);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[goals GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar metas" }, { status: 500 });
  }
}

// POST /api/finpro/goals
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { title, targetAmount, currentAmount, deadline, color } = await req.json();
    if (!title || !targetAmount || !deadline) {
      return NextResponse.json({ error: "Título, valor alvo e prazo são obrigatórios" }, { status: 400 });
    }
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;
    const goal = await db.goal.create({
      data: {
        title,
        targetAmount: target,
        currentAmount: current,
        deadline: new Date(deadline),
        color: color || "#10B981",
        isCompleted: current >= target,
        userId,
      },
      include: { contributions: true },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[goals POST] error:", error);
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 });
  }
}

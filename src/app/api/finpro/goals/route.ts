import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/finpro/goals
export async function GET() {
  try {
    const goals = await db.goal.findMany({
      orderBy: [{ isCompleted: "asc" }, { deadline: "asc" }],
      include: { contributions: { orderBy: { date: "desc" } } },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error("[goals GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar metas" }, { status: 500 });
  }
}

// POST /api/finpro/goals
export async function POST(req: NextRequest) {
  try {
    const { title, targetAmount, currentAmount, deadline, color } = await req.json();
    if (!title || !targetAmount || !deadline) {
      return NextResponse.json({ error: "Título, valor alvo e prazo são obrigatórios" }, { status: 400 });
    }
    const goal = await db.goal.create({
      data: {
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: new Date(deadline),
        color: color || "#10B981",
        isCompleted: parseFloat(currentAmount) >= parseFloat(targetAmount),
      },
      include: { contributions: true },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("[goals POST] error:", error);
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 });
  }
}

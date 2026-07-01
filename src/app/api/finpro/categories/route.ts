import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

// GET /api/finpro/categories
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const where: Record<string, unknown> = { userId };
    if (type && type !== "all") where.type = type;

    const categories = await db.category.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(categories);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[categories GET] error:", error);
    return NextResponse.json({ error: "Erro ao listar categorias" }, { status: 500 });
  }
}

// POST /api/finpro/categories
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const { name, type, color, icon } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });
    }
    const category = await db.category.create({
      data: { name, type, color: color || "#6B7280", icon: icon || "Circle", userId },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    console.error("[categories POST] error:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}

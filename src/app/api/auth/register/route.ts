import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// POST /api/auth/register
// Body: { name, email, password }
// Cria um novo usuário e opcionalmente popula categorias padrão.
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        passwordHash,
      },
    });

    // Categorias padrão para o novo usuário (para ele começar a usar logo)
    const defaultCategories = [
      { name: "Salário", type: "income", color: "#10B981", icon: "Banknote" },
      { name: "Freelance", type: "income", color: "#06B6D4", icon: "Laptop" },
      { name: "Investimentos", type: "income", color: "#84CC16", icon: "TrendingUp" },
      { name: "Alimentação", type: "expense", color: "#F59E0B", icon: "Utensils" },
      { name: "Moradia", type: "expense", color: "#8B5CF6", icon: "Home" },
      { name: "Transporte", type: "expense", color: "#3B82F6", icon: "Car" },
      { name: "Lazer", type: "expense", color: "#EC4899", icon: "Gamepad2" },
      { name: "Saúde", type: "expense", color: "#EF4444", icon: "HeartPulse" },
      { name: "Educação", type: "expense", color: "#14B8A6", icon: "GraduationCap" },
      { name: "Compras", type: "expense", color: "#F97316", icon: "ShoppingBag" },
      { name: "Assinaturas", type: "expense", color: "#6366F1", icon: "Repeat" },
    ];
    await db.category.createMany({
      data: defaultCategories.map((c) => ({ ...c, userId: user.id })),
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register] error:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}

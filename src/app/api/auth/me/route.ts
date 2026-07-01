import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/auth/me — retorna o usuário autenticado + stats resumidas
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Busca dados completos do usuário no banco (por segurança)
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("[me] error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

import "next-auth";
import type { NextAuthOptions } from "next-auth";
import type { Session } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Re-exportado para conveniência
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
  },
  providers: [
    (await import("next-auth/providers/credentials")).default({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios.");
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) {
          throw new Error("Email ou senha incorretos.");
        }
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          throw new Error("Email ou senha incorretos.");
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string) ?? undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
    };
  }
}

// Helpers usados pelas API routes para obter o usuário autenticado.
// Retornam null quando não autenticado — as rotas respondem 401.
export async function getCurrentUser(): Promise<Session["user"] | null> {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

// Lança erro 401 se não autenticado. Caso contrário retorna o usuário.
export async function requireUser(): Promise<Session["user"]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("Não autenticado.");
  }
}

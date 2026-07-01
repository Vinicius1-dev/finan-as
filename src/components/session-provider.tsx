"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Wraps the app with NextAuth's SessionProvider so that client-side
 * hooks (`useSession`) and helpers (`signIn`, `signOut`) work everywhere.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

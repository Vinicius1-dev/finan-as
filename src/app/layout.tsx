import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";
import { SessionProvider } from "@/components/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinPro — Gestor de Finanças Pessoais",
  description:
    "Controle suas receitas, despesas, orçamentos e metas em um só lugar. Sistema completo de gestão financeira pessoal.",
  keywords: ["finanças pessoais", "orçamento", "controle de gastos", "metas financeiras"],
  authors: [{ name: "FinPro" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SessionProvider>
              {children}
              <Toaster />
              <SonnerToaster richColors position="top-right" />
            </SessionProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  Target,
  PieChart,
  FileBarChart,
  Menu,
  Moon,
  Sun,
  Github,
  LogOut,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useFinProStore, type ViewKey } from "@/store/finpro-store";
import { DashboardView } from "@/components/finpro/views/dashboard-view";
import { TransactionsView } from "@/components/finpro/views/transactions-view";
import { AccountsView } from "@/components/finpro/views/accounts-view";
import { CategoriesView } from "@/components/finpro/views/categories-view";
import { BudgetsView } from "@/components/finpro/views/budgets-view";
import { GoalsView } from "@/components/finpro/views/goals-view";
import { ReportsView } from "@/components/finpro/views/reports-view";
import { AuthScreen } from "@/components/finpro/auth-screen";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface AuthMeResponse {
  user: AuthUser | null;
}

/**
 * Hook que verifica o estado de autenticação chamando GET /api/auth/me.
 * Retorna o usuário atual, estado de loading e função de refetch.
 */
function useAuth() {
  const query = useQuery<AuthUser | null, Error>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return null;
      const data: AuthMeResponse = await res.json();
      return data.user ?? null;
    },
    staleTime: 60_000,
    retry: 1,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

const NAV_ITEMS: {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "transactions", label: "Transações", icon: ArrowLeftRight },
  { key: "accounts", label: "Contas", icon: Wallet },
  { key: "categories", label: "Categorias", icon: Tags },
  { key: "budgets", label: "Orçamentos", icon: Target },
  { key: "goals", label: "Metas", icon: Target },
  { key: "reports", label: "Relatórios", icon: FileBarChart },
];

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral das suas finanças" },
  transactions: { title: "Transações", subtitle: "Gerencie suas receitas e despesas" },
  accounts: { title: "Contas", subtitle: "Suas contas e saldos" },
  categories: { title: "Categorias", subtitle: "Organize suas receitas e despesas" },
  budgets: { title: "Orçamentos", subtitle: "Defina limites e acompanhe seus gastos" },
  goals: { title: "Metas", subtitle: "Acompanhe seus objetivos financeiros" },
  reports: { title: "Relatórios", subtitle: "Análise anual e exportação de dados" },
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Alternar tema"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function getInitial(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    return name.trim().charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

function SidebarContent({
  onNavigate,
  user,
  onLogout,
  isLoggingOut,
}: {
  onNavigate?: () => void;
  user: AuthUser | null;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}) {
  const { activeView, setActiveView } = useFinProStore();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <PieChart className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-lg leading-none">FinPro</p>
          <p className="text-xs text-muted-foreground mt-1">Finanças pessoais</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 scrollbar-thin overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveView(item.key);
                onNavigate?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg p-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm"
              aria-hidden
            >
              {getInitial(user.name, user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {user.name?.trim() || user.email.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              onClick={onLogout}
              disabled={isLoggingOut}
              aria-label="Sair"
              title="Sair"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Dica</p>
          <p className="text-xs text-sidebar-foreground/70 mt-1 leading-relaxed">
            Registre suas transações diariamente para manter o controle financeiro sempre atualizado.
          </p>
        </div>
      </div>
    </div>
  );
}

function ViewRouter() {
  const { activeView } = useFinProStore();
  switch (activeView) {
    case "dashboard":
      return <DashboardView />;
    case "transactions":
      return <TransactionsView />;
    case "accounts":
      return <AccountsView />;
    case "categories":
      return <CategoriesView />;
    case "budgets":
      return <BudgetsView />;
    case "goals":
      return <GoalsView />;
    case "reports":
      return <ReportsView />;
    default:
      return <DashboardView />;
  }
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-primary/5 text-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <PieChart className="h-6 w-6" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando FinPro...
      </div>
    </div>
  );
}

export function AppShell() {
  const { activeView } = useFinProStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const { user, isLoading, refetch } = useAuth();
  const { title, subtitle } = VIEW_TITLES[activeView];

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      // Limpa cache de queries para evitar vazar dados entre usuários
      queryClient.clear();
      toast.success("Até logo!");
      await refetch();
    } catch (err) {
      console.error("[logout] error:", err);
      toast.error("Não foi possível sair agora. Tente novamente.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <AuthScreen onSuccess={() => refetch()} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
          <SidebarContent
            user={user}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          />
        </aside>

        {/* Conteúdo principal */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
                <SidebarContent
                  onNavigate={() => setMobileOpen(false)}
                  user={user}
                  onLogout={handleLogout}
                  isLoggingOut={isLoggingOut}
                />
              </SheetContent>
            </Sheet>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild aria-label="Ver código-fonte">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                </a>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          {/* Conteúdo da view */}
          <main className="flex-1 p-4 lg:p-6">
            <div key={activeView} className="animate-fade-in-up">
              <ViewRouter />
            </div>
          </main>

          {/* Footer sticky */}
          <footer className="mt-auto border-t border-border bg-background px-4 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">FinPro</span> — Gestor de Finanças
                Pessoais
              </p>
              <p className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Sistema de portfólio • Next.js + Prisma
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

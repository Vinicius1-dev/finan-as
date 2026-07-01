"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  PieChart,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Check,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Target,
  FileBarChart,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthScreenProps {
  onSuccess?: () => void;
}

const DEMO_EMAIL = "demo@finpro.com";
const DEMO_PASSWORD = "demo123";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Dashboard completo com gráficos",
    description: "Acompanhe receitas, despesas e saldo em tempo real.",
  },
  {
    icon: Target,
    title: "Orçamentos e metas inteligentes",
    description: "Defina limites por categoria e objetivos de poupança.",
  },
  {
    icon: FileBarChart,
    title: "Relatórios e exportação CSV",
    description: "Analise o ano por mês e exporte quando precisar.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados ficam privados e seguros",
    description: "Cada usuário tem seu próprio espaço isolado.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Hero panel (desktop only)                                                 */
/* -------------------------------------------------------------------------- */

function HeroPanel() {
  return (
    <div className="relative hidden lg:flex lg:flex-col justify-between overflow-hidden bg-primary text-primary-foreground p-10 xl:p-14">
      {/* Decorative soft circles */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-primary-foreground/5 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-[32rem] w-[32rem] rounded-full bg-primary-foreground/5 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-primary-foreground/[0.04] blur-3xl"
      />

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20 backdrop-blur-sm">
          <PieChart className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight">FinPro</span>
      </div>

      {/* Headline */}
      <div className="relative z-10 max-w-md space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium ring-1 ring-primary-foreground/15">
          <Sparkles className="h-3.5 w-3.5" />
          Gestor de finanças pessoais
        </div>
        <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
          Suas finanças, sob controle.
        </h1>
        <p className="text-base text-primary-foreground/80 leading-relaxed">
          Controle receitas, despesas, orçamentos e metas em um só lugar.
        </p>

        <ul className="space-y-3 pt-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-primary-foreground/70 mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer microcopy */}
      <div className="relative z-10 flex items-center gap-2 text-xs text-primary-foreground/70">
        <ShieldCheck className="h-4 w-4" />
        Feito com Next.js, Prisma e shadcn/ui
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mobile branded header                                                     */
/* -------------------------------------------------------------------------- */

function MobileBrandHeader() {
  return (
    <div className="lg:hidden flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <PieChart className="h-5 w-5" />
      </div>
      <div>
        <p className="font-bold text-lg leading-none">FinPro</p>
        <p className="text-xs text-muted-foreground mt-1">
          Gestor de finanças pessoais
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field helpers                                                             */
/* -------------------------------------------------------------------------- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-sm font-medium text-foreground">{children}</Label>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  icon: Icon,
  disabled,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          className="pl-9"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  AuthScreen                                                                */
/* -------------------------------------------------------------------------- */

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  async function handleLogin(email: string, password: string) {
    setIsLoginLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        const message =
          res?.error && res.error !== "CredentialsSignin"
            ? res.error
            : "Email ou senha incorretos.";
        toast.error(message);
        return;
      }
      toast.success("Bem-vindo!");
      onSuccess?.();
    } catch (err) {
      console.error("[login] error:", err);
      toast.error("Não foi possível entrar agora. Tente novamente.");
    } finally {
      setIsLoginLoading(false);
    }
  }

  function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      toast.error("Preencha email e senha.");
      return;
    }
    void handleLogin(loginEmail.trim(), loginPassword);
  }

  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = regName.trim();
    const email = regEmail.trim();
    const password = regPassword;

    if (!name) {
      toast.error("Informe seu nome.");
      return;
    }
    if (!email) {
      toast.error("Informe seu email.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        let message = "Erro ao criar conta.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          /* ignore parse errors */
        }
        toast.error(message);
        return;
      }

      // Account created — auto-login
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signInRes || signInRes.error) {
        // Rare: account created but auto-login failed — switch to login tab
        toast.success("Conta criada! Faça login para continuar.");
        setTab("login");
        setLoginEmail(email);
        setLoginPassword("");
        return;
      }
      toast.success("Conta criada com sucesso!");
      onSuccess?.();
    } catch (err) {
      console.error("[register] error:", err);
      toast.error("Não foi possível criar a conta agora. Tente novamente.");
    } finally {
      setIsRegisterLoading(false);
    }
  }

  async function handleDemoAccess() {
    if (isLoginLoading || isRegisterLoading) return;
    setTab("login");
    setLoginEmail(DEMO_EMAIL);
    setLoginPassword(DEMO_PASSWORD);
    // Slight delay so the user sees the credentials pre-filled
    await new Promise((r) => setTimeout(r, 80));
    void handleLogin(DEMO_EMAIL, DEMO_PASSWORD);
  }

  const anyLoading = isLoginLoading || isRegisterLoading;

  return (
    <div className="min-h-screen w-full bg-background grid lg:grid-cols-2">
      <HeroPanel />

      {/* Right panel: form */}
      <div className="flex flex-col min-h-screen lg:min-h-0">
        <div className="flex flex-1 items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-sm space-y-6">
            {/* Mobile brand header (compact) */}
            <MobileBrandHeader />

            <Card className="border-border/60 shadow-lg shadow-black/[0.03]">
              <CardHeader className="gap-1.5">
                <CardTitle className="text-xl">
                  {tab === "login" ? "Acessar conta" : "Criar sua conta"}
                </CardTitle>
                <CardDescription>
                  {tab === "login"
                    ? "Entre para gerenciar suas finanças."
                    : "Comece a controlar seu dinheiro em segundos."}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs
                  value={tab}
                  onValueChange={(v) =>
                    setTab(v === "register" ? "register" : "login")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="register">Criar conta</TabsTrigger>
                  </TabsList>

                  {/* Login */}
                  <TabsContent value="login" className="mt-5">
                    <form onSubmit={onLoginSubmit} className="space-y-4">
                      <Field
                        id="login-email"
                        label="Email"
                        type="email"
                        placeholder="voce@email.com"
                        value={loginEmail}
                        onChange={setLoginEmail}
                        autoComplete="email"
                        icon={Mail}
                        disabled={anyLoading}
                      />
                      <Field
                        id="login-password"
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={setLoginPassword}
                        autoComplete="current-password"
                        icon={Lock}
                        disabled={anyLoading}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isLoginLoading}
                      >
                        {isLoginLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          <>
                            Entrar
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Register */}
                  <TabsContent value="register" className="mt-5">
                    <form onSubmit={onRegisterSubmit} className="space-y-4">
                      <Field
                        id="reg-name"
                        label="Nome"
                        type="text"
                        placeholder="Seu nome"
                        value={regName}
                        onChange={setRegName}
                        autoComplete="name"
                        icon={UserIcon}
                        disabled={anyLoading}
                      />
                      <Field
                        id="reg-email"
                        label="Email"
                        type="email"
                        placeholder="voce@email.com"
                        value={regEmail}
                        onChange={setRegEmail}
                        autoComplete="email"
                        icon={Mail}
                        disabled={anyLoading}
                      />
                      <Field
                        id="reg-password"
                        label="Senha"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={setRegPassword}
                        autoComplete="new-password"
                        icon={Lock}
                        disabled={anyLoading}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isRegisterLoading}
                      >
                        {isRegisterLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          <>
                            Criar conta
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Demo access — visible on both tabs */}
                <div className="mt-4">
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-2 text-xs text-muted-foreground uppercase tracking-wider">
                        ou
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-3"
                    size="lg"
                    onClick={handleDemoAccess}
                    disabled={anyLoading}
                  >
                    {isLoginLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                    Acessar conta demo
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mt-1.5">
                    demo@finpro.com · demo123
                  </p>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground text-center mt-5">
                  Ao continuar, você concorda em usar o FinPro para fins
                  pessoais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;

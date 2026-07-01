// Tipos compartilhados do FinPro — espelham os models do Prisma

export type AccountType = "cash" | "bank" | "card";
export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  // campo calculado (saldo atual)
  balance?: number;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  accountId: string;
  categoryId: string | null;
  transferToAccountId: string | null;
  account?: Account;
  category?: Category | null;
  transferTo?: Account | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  accountId: string;
  category?: Category;
  account?: Account;
  // campo calculado
  spent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note: string | null;
}

// ---- Tipos de resposta agregada (dashboard / relatórios) ----

export interface DashboardStats {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthBalance: number;
  expenseChange: number; // % vs mês anterior
  incomeChange: number;
  accountCount: number;
  transactionCount: number;
}

export interface MonthlyPoint {
  month: string; // "Jan"
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface DashboardData {
  stats: DashboardStats;
  monthly: MonthlyPoint[];
  expenseByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  recentTransactions: (Transaction & {
    account: Account;
    category: Category | null;
  })[];
  accounts: (Account & { balance: number })[];
}

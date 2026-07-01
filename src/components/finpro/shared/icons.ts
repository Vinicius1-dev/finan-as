import type { AccountType, TransactionType } from "@/lib/types";
import {
  Wallet,
  Landmark,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import * as Icons from "lucide-react";

export function getAccountIcon(type: AccountType): LucideIcon {
  switch (type) {
    case "cash":
      return Wallet;
    case "bank":
      return Landmark;
    case "card":
      return CreditCard;
    default:
      return Wallet;
  }
}

export function getAccountTypeLabel(type: AccountType): string {
  switch (type) {
    case "cash":
      return "Dinheiro";
    case "bank":
      return "Banco";
    case "card":
      return "Cartão";
    default:
      return type;
  }
}

export function getTransactionIcon(type: TransactionType): LucideIcon {
  switch (type) {
    case "income":
      return TrendingUp;
    case "expense":
      return TrendingDown;
    case "transfer":
      return ArrowLeftRight;
    default:
      return ArrowLeftRight;
  }
}

export function getTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case "income":
      return "Receita";
    case "expense":
      return "Despesa";
    case "transfer":
      return "Transferência";
    default:
      return type;
  }
}

// Resolve um ícone de categoria pelo nome (string) -> componente Lucide
export function getCategoryIcon(name: string): LucideIcon {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name];
  return Icon || Icons.Circle;
}

// Seed do FinPro — popula o banco com dados realistas brasileiros
// Executa com: bun run prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const monthsAgo = (months: number, day = 15) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d;
};

async function main() {
  console.log("🧹 Limpando banco...");
  await db.goalContribution.deleteMany();
  await db.goal.deleteMany();
  await db.budget.deleteMany();
  await db.transaction.deleteMany();
  await db.category.deleteMany();
  await db.account.deleteMany();

  // ---------------- CONTAS ----------------
  const contas = await db.$transaction([
    db.account.create({
      data: { name: "Carteira", type: "cash", initialBalance: 300, color: "#10B981" },
    }),
    db.account.create({
      data: { name: "Banco Nubank", type: "bank", initialBalance: 4500, color: "#8B5CF6" },
    }),
    db.account.create({
      data: { name: "Cartão de Crédito", type: "card", initialBalance: 0, color: "#EF4444" },
    }),
  ]);
  const [carteira, banco, cartao] = contas;

  // ---------------- CATEGORIAS ----------------
  const cat = (name: string, type: string, color: string, icon: string) =>
    db.category.create({ data: { name, type, color, icon } });

  const [salario, freela, investimento] = await Promise.all([
    cat("Salário", "income", "#10B981", "Banknote"),
    cat("Freelance", "income", "#06B6D4", "Laptop"),
    cat("Investimentos", "income", "#84CC16", "TrendingUp"),
  ]);

  const [alimentacao, moradia, transporte, lazer, saude, educacao, compras, assinaturas] = await Promise.all([
    cat("Alimentação", "expense", "#F59E0B", "Utensils"),
    cat("Moradia", "expense", "#8B5CF6", "Home"),
    cat("Transporte", "expense", "#3B82F6", "Car"),
    cat("Lazer", "expense", "#EC4899", "Gamepad2"),
    cat("Saúde", "expense", "#EF4444", "HeartPulse"),
    cat("Educação", "expense", "#14B8A6", "GraduationCap"),
    cat("Compras", "expense", "#F97316", "ShoppingBag"),
    cat("Assinaturas", "expense", "#6366F1", "Repeat"),
  ]);

  // ---------------- TRANSAÇÕES (últimos 3 meses) ----------------
  const tx = (
    type: string,
    amount: number,
    description: string,
    date: Date,
    accountId: string,
    categoryId: string | null
  ) =>
    db.transaction.create({
      data: { type, amount, description, date, accountId, categoryId },
    });

  const transacoes = [] as ReturnType<typeof tx>[];

  for (let m = 0; m < 3; m++) {
    // Receitas fixas
    transacoes.push(tx("income", 4500, "Salário mensal", monthsAgo(m, 5), banco.id, salario.id));
    transacoes.push(tx("income", 800 + Math.round(Math.random() * 600), "Projeto freelance", monthsAgo(m, 18), banco.id, freela.id));
    transacoes.push(tx("income", 150, "Dividendos", monthsAgo(m, 20), banco.id, investimento.id));

    // Despesas fixas
    transacoes.push(tx("expense", 1200, "Aluguel", monthsAgo(m, 10), banco.id, moradia.id));
    transacoes.push(tx("expense", 89.9, "Internet + Streaming", monthsAgo(m, 8), cartao.id, assinaturas.id));
    transacoes.push(tx("expense", 49.9, "Academia", monthsAgo(m, 6), cartao.id, saude.id));

    // Despesas variáveis (várias por mês)
    const despesasVariaveis = [
      { cat: alimentacao, vals: [45.5, 32.0, 28.9, 56.7, 41.2], desc: ["Supermercado", "Almoço", "iFood", "Padaria", "Jantar"] },
      { cat: transporte, vals: [120, 35, 28, 22], desc: ["Combustível", "Uber", "Ônibus", "Estacionamento"] },
      { cat: lazer, vals: [55, 89.5, 32], desc: ["Cinema", "Restaurante", "Streaming filme"] },
      { cat: compras, vals: [120, 75.9], desc: ["Roupas", "Livro"] },
      { cat: educacao, vals: [99.9], desc: ["Curso online"] },
    ];

    for (const grupo of despesasVariaveis) {
      grupo.vals.forEach((v, i) => {
        const dia = 3 + Math.floor(Math.random() * 24);
        const conta = Math.random() > 0.5 ? cartao.id : banco.id;
        transacoes.push(
          tx("expense", v, grupo.desc[i] || grupo.cat.name, monthsAgo(m, dia), conta, grupo.cat.id)
        );
      });
    }
  }

  // Transferência entre contas
  transacoes.push(
    tx("transfer", 500, "Transferência para carteira", monthsAgo(0, 12), banco.id, null)
  );

  await Promise.all(transacoes);

  // ---------------- ORÇAMENTOS (mês atual) ----------------
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  await db.$transaction([
    db.budget.create({ data: { amount: 600, month: mes, year: ano, categoryId: alimentacao.id, accountId: banco.id } }),
    db.budget.create({ data: { amount: 200, month: mes, year: ano, categoryId: transporte.id, accountId: banco.id } }),
    db.budget.create({ data: { amount: 300, month: mes, year: ano, categoryId: lazer.id, accountId: cartao.id } }),
    db.budget.create({ data: { amount: 250, month: mes, year: ano, categoryId: compras.id, accountId: cartao.id } }),
    db.budget.create({ data: { amount: 150, month: mes, year: ano, categoryId: assinaturas.id, accountId: cartao.id } }),
  ]);

  // ---------------- METAS ----------------
  const meta1 = await db.goal.create({
    data: {
      title: "Reserva de Emergência",
      targetAmount: 10000,
      currentAmount: 3500,
      deadline: monthsAgo(-6, 1),
      color: "#10B981",
    },
  });
  const meta2 = await db.goal.create({
    data: {
      title: "Viagem para o Nordeste",
      targetAmount: 5000,
      currentAmount: 1850,
      deadline: monthsAgo(-4, 1),
      color: "#06B6D4",
    },
  });
  const meta3 = await db.goal.create({
    data: {
      title: "Notebook Novo",
      targetAmount: 4500,
      currentAmount: 4500,
      deadline: monthsAgo(-1, 1),
      color: "#8B5CF6",
      isCompleted: true,
    },
  });

  await db.$transaction([
    db.goalContribution.create({ data: { goalId: meta1.id, amount: 1000, note: "Janeiro" } }),
    db.goalContribution.create({ data: { goalId: meta1.id, amount: 1500, note: "Fevereiro" } }),
    db.goalContribution.create({ data: { goalId: meta1.id, amount: 1000, note: "Março" } }),
    db.goalContribution.create({ data: { goalId: meta2.id, amount: 850, note: "Primeira parcela" } }),
    db.goalContribution.create({ data: { goalId: meta2.id, amount: 1000, note: "Segunda parcela" } }),
    db.goalContribution.create({ data: { goalId: meta3.id, amount: 4500, note: "Compra realizada" } }),
  ]);

  console.log("✅ Seed concluído!");
  console.log(`   • ${contas.length} contas`);
  console.log(`   • ${3 + 8} categorias`);
  console.log(`   • ${transacoes.length} transações`);
  console.log(`   • 5 orçamentos`);
  console.log(`   • 3 metas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

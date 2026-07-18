# Finanças - Controle de Gastos Pessoais

Aplicação web para controle de finanças pessoais. Cadastre receitas, despesas e acompanhe seu saldo em tempo real.

## 🚀 Deploy
https://finan-as-kappa-seven.vercel.app

## 🛠️ Tecnologias
- TypeScript
- Next.js
- Prisma (ORM)
- SQLite / PostgreSQL
- WebSocket (atualizações em tempo real)

## ⚙️ Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/Vinicius1-dev/finan-as.git

# Instale as dependências
npm install

# Configure o banco de dados
npx prisma migrate dev

# Inicie o servidor
npm run dev

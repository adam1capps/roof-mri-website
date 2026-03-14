import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";

async function getProfitLossData() {
  const transactions = await prisma.transaction.findMany({
    where: { NOT: { categoryId: null } },
    include: {
      category: {
        include: { parent: true },
      },
    },
  });

  // Aggregate by category
  const categoryTotals: Record<
    string,
    { name: string; type: string; parentName: string | null; total: number }
  > = {};

  for (const txn of transactions) {
    if (!txn.category) continue;
    const key = txn.category.id;
    if (!categoryTotals[key]) {
      categoryTotals[key] = {
        name: txn.category.name,
        type: txn.category.type,
        parentName: txn.category.parent?.name || null,
        total: 0,
      };
    }
    categoryTotals[key].total += txn.amount;
  }

  const income = Object.values(categoryTotals).filter(
    (c) => c.type === "income"
  );
  const expenses = Object.values(categoryTotals).filter(
    (c) => c.type === "expense"
  );

  const totalIncome = income.reduce((sum, c) => sum + c.total, 0);
  const totalExpenses = expenses.reduce((sum, c) => sum + Math.abs(c.total), 0);
  const netProfit = totalIncome - totalExpenses;

  return { income, expenses, totalIncome, totalExpenses, netProfit };
}

export default async function ProfitLossPage() {
  const data = await getProfitLossData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Profit & Loss Statement
        </h1>
        <p className="mt-1 text-sm text-muted">
          Based on categorized transactions
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Income */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between bg-success/5 px-6 py-3">
            <span className="text-sm font-semibold text-success">Income</span>
            <span className="text-sm font-mono font-semibold text-success">
              ${data.totalIncome.toFixed(2)}
            </span>
          </div>
          {data.income.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between px-6 py-2.5 pl-10 hover:bg-surface-hover"
            >
              <span className="text-sm text-foreground">{cat.name}</span>
              <span className="text-sm font-mono text-muted">
                ${cat.total.toFixed(2)}
              </span>
            </div>
          ))}
          {data.income.length === 0 && (
            <div className="px-6 py-4 pl-10 text-sm text-muted">
              No income transactions categorized yet
            </div>
          )}
        </div>

        {/* Expenses */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between bg-danger/5 px-6 py-3">
            <span className="text-sm font-semibold text-danger">Expenses</span>
            <span className="text-sm font-mono font-semibold text-danger">
              ${data.totalExpenses.toFixed(2)}
            </span>
          </div>
          {data.expenses.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between px-6 py-2.5 pl-10 hover:bg-surface-hover"
            >
              <span className="text-sm text-foreground">{cat.name}</span>
              <span className="text-sm font-mono text-muted">
                ${Math.abs(cat.total).toFixed(2)}
              </span>
            </div>
          ))}
          {data.expenses.length === 0 && (
            <div className="px-6 py-4 pl-10 text-sm text-muted">
              No expense transactions categorized yet
            </div>
          )}
        </div>

        {/* Net Profit */}
        <div className="flex items-center justify-between px-6 py-4 bg-surface-hover">
          <span className="text-sm font-bold text-foreground">Net Profit</span>
          <span
            className={cn(
              "text-lg font-mono font-bold",
              data.netProfit >= 0 ? "text-success" : "text-danger"
            )}
          >
            {data.netProfit < 0 ? "-" : ""}$
            {Math.abs(data.netProfit).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

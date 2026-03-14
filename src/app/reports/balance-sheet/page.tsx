import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";

async function getBalanceSheetData() {
  const transactions = await prisma.transaction.findMany({
    where: { NOT: { categoryId: null } },
    include: {
      category: {
        include: { parent: true },
      },
    },
  });

  const categoryTotals: Record<
    string,
    { name: string; type: string; total: number }
  > = {};

  for (const txn of transactions) {
    if (!txn.category) continue;
    const key = txn.category.id;
    if (!categoryTotals[key]) {
      categoryTotals[key] = {
        name: txn.category.name,
        type: txn.category.type,
        total: 0,
      };
    }
    categoryTotals[key].total += txn.amount;
  }

  const assets = Object.values(categoryTotals).filter((c) => c.type === "asset");
  const liabilities = Object.values(categoryTotals).filter((c) => c.type === "liability");
  const equity = Object.values(categoryTotals).filter((c) => c.type === "equity");

  const totalAssets = assets.reduce((sum, c) => sum + c.total, 0);
  const totalLiabilities = liabilities.reduce((sum, c) => sum + Math.abs(c.total), 0);
  const totalEquity = equity.reduce((sum, c) => sum + c.total, 0);

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
}

function Section({
  title,
  items,
  total,
  color,
}: {
  title: string;
  items: { name: string; total: number }[];
  total: number;
  color: string;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <div className={cn("flex items-center justify-between px-6 py-3", `${color}/5`)}>
        <span className={cn("text-sm font-semibold", color)}>{title}</span>
        <span className={cn("text-sm font-mono font-semibold", color)}>
          ${Math.abs(total).toFixed(2)}
        </span>
      </div>
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between px-6 py-2.5 pl-10 hover:bg-surface-hover"
        >
          <span className="text-sm text-foreground">{item.name}</span>
          <span className="text-sm font-mono text-muted">
            ${Math.abs(item.total).toFixed(2)}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <div className="px-6 py-4 pl-10 text-sm text-muted">
          No {title.toLowerCase()} recorded yet
        </div>
      )}
    </div>
  );
}

export default async function BalanceSheetPage() {
  const data = await getBalanceSheetData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Balance Sheet</h1>
        <p className="mt-1 text-sm text-muted">
          Assets, liabilities, and equity from categorized transactions
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <Section
          title="Assets"
          items={data.assets}
          total={data.totalAssets}
          color="text-success"
        />
        <Section
          title="Liabilities"
          items={data.liabilities}
          total={data.totalLiabilities}
          color="text-danger"
        />
        <Section
          title="Equity"
          items={data.equity}
          total={data.totalEquity}
          color="text-accent"
        />
      </div>
    </div>
  );
}

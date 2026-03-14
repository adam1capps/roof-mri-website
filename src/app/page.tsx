import { prisma } from "@/lib/db";
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

async function getStats() {
  const [
    totalTransactions,
    uncategorized,
    categorized,
    merchantRules,
    accountingRules,
    accounts,
  ] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.count({ where: { categoryId: null } }),
    prisma.transaction.count({ where: { NOT: { categoryId: null } } }),
    prisma.merchantRule.count(),
    prisma.accountingRule.count({ where: { isActive: true } }),
    prisma.account.count(),
  ]);

  return {
    totalTransactions,
    uncategorized,
    categorized,
    merchantRules,
    accountingRules,
    accounts,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Total Transactions",
      value: stats.totalTransactions,
      icon: ArrowLeftRight,
      color: "text-accent",
    },
    {
      label: "Needs Review",
      value: stats.uncategorized,
      icon: AlertCircle,
      color: stats.uncategorized > 0 ? "text-warning" : "text-success",
    },
    {
      label: "Categorized",
      value: stats.categorized,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Merchant Rules",
      value: stats.merchantRules,
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      label: "Active Rules",
      value: stats.accountingRules,
      icon: ShieldCheck,
      color: "text-accent",
    },
    {
      label: "Accounts",
      value: stats.accounts,
      icon: BookOpen,
      color: "text-accent",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Your bookkeeping at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-surface p-6 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {card.value}
                </p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>

      {stats.totalTransactions === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <ArrowLeftRight className="mx-auto h-12 w-12 text-muted" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No transactions yet
          </h2>
          <p className="mt-2 text-sm text-muted">
            Upload a bank statement to get started. CSV or PDF supported.
          </p>
          <a
            href="/upload"
            className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Upload Statement
          </a>
        </div>
      )}
    </div>
  );
}

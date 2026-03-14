"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { CategorizeModal } from "@/components/categorize-modal";
import { AlertCircle, CheckCircle2, Zap, Filter } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  rawMerchant: string;
  normalizedMerchant: string | null;
  categoryId: string | null;
  category: { id: string; name: string; parent: { name: string } | null } | null;
  isReviewed: boolean;
  autoCategorized: boolean;
  ruleTier: string | null;
}

type FilterMode = "all" | "uncategorized" | "categorized";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("uncategorized");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/transactions?filter=${filter}`);
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const uncategorizedCount = transactions.filter((t) => !t.categoryId).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="mt-1 text-sm text-muted">
            {uncategorizedCount > 0
              ? `${uncategorizedCount} transactions need categorization`
              : "All transactions are categorized"}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {(
          [
            { key: "uncategorized", label: "Needs Review" },
            { key: "categorized", label: "Categorized" },
            { key: "all", label: "All" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground"
            )}
          >
            {f.key === "uncategorized" && (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {f.key === "categorized" && (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {f.key === "all" && <Filter className="h-3.5 w-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted">Date</th>
              <th className="px-4 py-3 font-medium text-muted">Merchant</th>
              <th className="px-4 py-3 font-medium text-muted">Amount</th>
              <th className="px-4 py-3 font-medium text-muted">Category</th>
              <th className="px-4 py-3 font-medium text-muted">Status</th>
              <th className="px-4 py-3 font-medium text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  {filter === "uncategorized"
                    ? "All caught up! No transactions need review."
                    : "No transactions found."}
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => !txn.categoryId && setSelectedTxn(txn)}
                >
                  <td className="px-4 py-3 text-muted">
                    {new Date(txn.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">
                      {txn.normalizedMerchant || txn.rawMerchant}
                    </div>
                    {txn.normalizedMerchant &&
                      txn.normalizedMerchant !== txn.rawMerchant && (
                        <div className="text-xs text-muted truncate max-w-[200px]">
                          {txn.rawMerchant}
                        </div>
                      )}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 font-mono",
                      txn.amount < 0 ? "text-danger" : "text-success"
                    )}
                  >
                    {txn.amount < 0 ? "-" : "+"}$
                    {Math.abs(txn.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {txn.category ? (
                      <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                        {txn.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {txn.autoCategorized ? (
                      <span
                        className="flex items-center gap-1 text-xs text-accent"
                        title="Auto-categorized by merchant rule"
                      >
                        <Zap className="h-3 w-3" />
                        auto
                      </span>
                    ) : txn.isReviewed ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        reviewed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-warning">
                        <AlertCircle className="h-3 w-3" />
                        needs review
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!txn.categoryId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxn(txn);
                        }}
                        className="rounded-lg bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                      >
                        Categorize
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Categorize Modal */}
      {selectedTxn && (
        <CategorizeModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onCategorized={() => {
            setSelectedTxn(null);
            fetchTransactions();
          }}
        />
      )}
    </div>
  );
}

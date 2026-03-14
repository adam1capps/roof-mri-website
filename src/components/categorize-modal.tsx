"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Check, Info } from "lucide-react";
import { cn } from "@/lib/cn";

interface Category {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  parent: { name: string } | null;
  _count: { transactions: number };
}

interface CategorizeModalProps {
  transaction: {
    id: string;
    normalizedMerchant: string | null;
    rawMerchant: string;
    amount: number;
    date: string;
  };
  onClose: () => void;
  onCategorized: () => void;
}

const TIER_INFO = {
  HARD: {
    label: "Hard",
    color: "bg-success/20 text-success",
    desc: "Black and white — no judgment needed",
  },
  SEMI_AGGRESSIVE: {
    label: "Semi-Aggressive",
    color: "bg-warning/20 text-warning",
    desc: "Defensible but requires some judgment",
  },
  AGGRESSIVE: {
    label: "Aggressive",
    color: "bg-danger/20 text-danger",
    desc: "Maximum deduction — higher audit risk",
  },
};

export function CategorizeModal({
  transaction,
  onClose,
  onCategorized,
}: CategorizeModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [tier, setTier] = useState<keyof typeof TIER_INFO>("HARD");
  const [remember, setRemember] = useState(true);
  const [applyRetro, setApplyRetro] = useState(false);
  const [retroCount, setRetroCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    if (transaction.normalizedMerchant) {
      fetch(
        `/api/categorize/merchant-count?merchant=${encodeURIComponent(
          transaction.normalizedMerchant
        )}`
      )
        .then((r) => r.json())
        .then((d) => setRetroCount(d.count));
    }
  }, [transaction.normalizedMerchant]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filteredCategories = categories.filter((c) => {
    if (!search) return c.parentId !== null; // Show leaf categories by default
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.parent?.name.toLowerCase().includes(q)
    );
  });

  // Sort: recently used categories first
  const sortedCategories = [...filteredCategories].sort(
    (a, b) => b._count.transactions - a._count.transactions
  );

  async function handleSubmit() {
    if (!selectedCategoryId) return;
    setSubmitting(true);

    await fetch("/api/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: transaction.id,
        categoryId: selectedCategoryId,
        tier,
        rememberMerchant: remember,
        applyRetroactively: applyRetro,
      }),
    });

    setSubmitting(false);
    onCategorized();
  }

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && selectedCategoryId) handleSubmit();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Categorize Transaction
            </h2>
            <p className="text-sm text-muted">
              {transaction.normalizedMerchant || transaction.rawMerchant}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Transaction info */}
        <div className="flex gap-4 border-b border-border px-6 py-3 text-sm">
          <span className="text-muted">
            {new Date(transaction.date).toLocaleDateString()}
          </span>
          <span
            className={cn(
              "font-mono font-medium",
              transaction.amount < 0 ? "text-danger" : "text-success"
            )}
          >
            {transaction.amount < 0 ? "-" : "+"}$
            {Math.abs(transaction.amount).toFixed(2)}
          </span>
        </div>

        {/* Category search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Category list */}
        <div className="max-h-48 overflow-y-auto px-6 py-2">
          {sortedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                selectedCategoryId === cat.id
                  ? "bg-accent/10 text-accent"
                  : "text-foreground hover:bg-surface-hover"
              )}
            >
              <div className="text-left">
                <span>{cat.name}</span>
                {cat.parent && (
                  <span className="ml-2 text-xs text-muted">
                    {cat.parent.name}
                  </span>
                )}
              </div>
              {selectedCategoryId === cat.id && (
                <Check className="h-4 w-4 flex-shrink-0" />
              )}
            </button>
          ))}
          {sortedCategories.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">
              No categories match
            </p>
          )}
        </div>

        {/* Rule tier */}
        <div className="border-t border-border px-6 py-3">
          <p className="mb-2 text-xs font-medium text-muted">Rule Tier</p>
          <div className="flex gap-2">
            {(Object.keys(TIER_INFO) as Array<keyof typeof TIER_INFO>).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    tier === t
                      ? TIER_INFO[t].color
                      : "bg-surface-hover text-muted hover:text-foreground"
                  )}
                  title={TIER_INFO[t].desc}
                >
                  {TIER_INFO[t].label}
                  <Info className="h-3 w-3 opacity-60" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2 border-t border-border px-6 py-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-border accent-accent"
            />
            <span className="text-foreground">
              Remember for future{" "}
              <span className="font-medium text-accent">
                {transaction.normalizedMerchant || transaction.rawMerchant}
              </span>{" "}
              transactions
            </span>
          </label>

          {retroCount > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={applyRetro}
                onChange={(e) => setApplyRetro(e.target.checked)}
                className="rounded border-border accent-accent"
              />
              <span className="text-foreground">
                Apply to{" "}
                <span className="font-medium text-accent">{retroCount}</span>{" "}
                existing uncategorized transactions from this merchant
              </span>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCategoryId || submitting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Categorize"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { ShieldCheck, ShieldAlert, Shield, ToggleLeft, ToggleRight } from "lucide-react";

interface AccountingRule {
  id: string;
  name: string;
  description: string;
  tier: string;
  isActive: boolean;
  category: { name: string } | null;
}

interface Settings {
  globalRiskProfile: string;
}

const TIERS = [
  {
    key: "HARD",
    label: "Hard Rules",
    icon: ShieldCheck,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
    desc: "Black and white — no judgment needed. Always defensible.",
  },
  {
    key: "SEMI_AGGRESSIVE",
    label: "Semi-Aggressive",
    icon: ShieldAlert,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    desc: "Defensible with documentation. Common deductions that require some judgment.",
  },
  {
    key: "AGGRESSIVE",
    label: "Aggressive",
    icon: Shield,
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/20",
    desc: "Maximum deductions. Gray area — higher audit risk. Requires strong documentation.",
  },
];

export default function RulesPage() {
  const [rules, setRules] = useState<AccountingRule[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/rules").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([rulesData, settingsData]) => {
      setRules(rulesData);
      setSettings(settingsData);
      setLoading(false);
    });
  }, []);

  async function toggleRule(ruleId: string, isActive: boolean) {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive } : r))
    );
    await fetch("/api/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId, isActive }),
    });
  }

  async function setGlobalProfile(profile: string) {
    setSettings((prev) =>
      prev ? { ...prev, globalRiskProfile: profile } : null
    );
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalRiskProfile: profile }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Accounting Rules
        </h1>
        <p className="mt-1 text-sm text-muted">
          Control how aggressively your books are managed. Each rule is tagged by
          risk tier.
        </p>
      </div>

      {/* Global Risk Profile */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-sm font-medium text-foreground mb-3">
          Global Risk Profile
        </h2>
        <p className="text-xs text-muted mb-4">
          Sets which rule tiers are active by default. You can still override
          individual rules below.
        </p>
        <div className="flex gap-3">
          {TIERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setGlobalProfile(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                settings?.globalRiskProfile === t.key
                  ? `${t.bgColor} ${t.borderColor} ${t.color}`
                  : "border-border text-muted hover:border-muted hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules by tier */}
      <div className="space-y-6">
        {TIERS.map((tier) => {
          const tierRules = rules.filter((r) => r.tier === tier.key);

          return (
            <div
              key={tier.key}
              className="rounded-xl border border-border bg-surface overflow-hidden"
            >
              <div
                className={cn(
                  "flex items-center gap-3 border-b border-border px-6 py-4",
                  tier.bgColor
                )}
              >
                <tier.icon className={cn("h-5 w-5", tier.color)} />
                <div>
                  <h3 className={cn("text-sm font-semibold", tier.color)}>
                    {tier.label}
                  </h3>
                  <p className="text-xs text-muted">{tier.desc}</p>
                </div>
                <span className="ml-auto text-xs text-muted">
                  {tierRules.filter((r) => r.isActive).length}/{tierRules.length}{" "}
                  active
                </span>
              </div>

              <div className="divide-y divide-border">
                {tierRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-hover transition-colors"
                  >
                    <button
                      onClick={() => toggleRule(rule.id, !rule.isActive)}
                      className="flex-shrink-0"
                    >
                      {rule.isActive ? (
                        <ToggleRight className="h-6 w-6 text-accent" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          rule.isActive ? "text-foreground" : "text-muted"
                        )}
                      >
                        {rule.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {rule.description}
                      </p>
                    </div>
                    {rule.category && (
                      <span className="flex-shrink-0 rounded-md bg-accent/10 px-2 py-1 text-xs text-accent">
                        {rule.category.name}
                      </span>
                    )}
                  </div>
                ))}
                {tierRules.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-muted">
                    No rules in this tier yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

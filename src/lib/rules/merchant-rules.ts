import { prisma } from "@/lib/db";

/**
 * Normalize a merchant name by stripping location codes, transaction IDs, etc.
 * "STARBUCKS #4521 SAN FRAN" → "STARBUCKS"
 * "SQ *BOBS HARDWARE" → "BOBS HARDWARE"
 * "PAYPAL *ACME INC" → "ACME INC"
 */
export function normalizeMerchant(raw: string): string {
  let name = raw.toUpperCase().trim();

  // Strip common prefixes
  name = name.replace(/^(SQ \*|TST \*|PAYPAL \*|VENMO \*|ZELLE \*|SP \*|IN \*)/, "");

  // Strip trailing location/store numbers: #1234, STORE 0891, etc.
  name = name.replace(/\s*#\d+.*$/, "");
  name = name.replace(/\s*STORE\s*\d+.*$/i, "");
  name = name.replace(/\s*LOC\s*\d+.*$/i, "");

  // Strip city/state suffixes that look like "SAN FRANCISCO CA"
  name = name.replace(
    /\s+[A-Z]{2,}\s+[A-Z]{2}\s*\d{0,5}\s*$/,
    ""
  );

  // Strip trailing numbers and whitespace
  name = name.replace(/\s+\d+\s*$/, "");

  return name.trim();
}

/**
 * Try to find a matching merchant rule for a transaction.
 * Returns the rule if found, null otherwise.
 */
export async function findMatchingRule(rawMerchant: string) {
  const normalized = normalizeMerchant(rawMerchant);

  // Exact match on normalized pattern
  const exactMatch = await prisma.merchantRule.findFirst({
    where: { merchantPattern: normalized },
    include: { category: true },
  });

  if (exactMatch) return exactMatch;

  // Fuzzy: check if the normalized merchant starts with any rule pattern
  const allRules = await prisma.merchantRule.findMany({
    include: { category: true },
  });

  for (const rule of allRules) {
    if (
      normalized.includes(rule.merchantPattern) ||
      rule.merchantPattern.includes(normalized)
    ) {
      return rule;
    }
  }

  return null;
}

/**
 * Apply merchant rules to a batch of uncategorized transactions.
 * Returns the count of auto-categorized transactions.
 */
export async function applyMerchantRules(): Promise<number> {
  const uncategorized = await prisma.transaction.findMany({
    where: { categoryId: null },
  });

  let count = 0;

  for (const txn of uncategorized) {
    const rule = await findMatchingRule(txn.rawMerchant);
    if (rule) {
      await prisma.transaction.update({
        where: { id: txn.id },
        data: {
          categoryId: rule.categoryId,
          normalizedMerchant: rule.merchantPattern,
          autoCategorized: true,
          ruleTier: rule.tier,
          isReviewed: true,
        },
      });
      count++;
    } else {
      // Still normalize the merchant for display
      await prisma.transaction.update({
        where: { id: txn.id },
        data: {
          normalizedMerchant: normalizeMerchant(txn.rawMerchant),
        },
      });
    }
  }

  return count;
}

/**
 * Create a new merchant rule from a categorization decision.
 * Optionally apply retroactively to past transactions.
 */
export async function createMerchantRule(params: {
  merchantPattern: string;
  displayName?: string;
  categoryId: string;
  tier?: string;
  applyRetroactively?: boolean;
}) {
  const {
    merchantPattern,
    displayName,
    categoryId,
    tier = "HARD",
    applyRetroactively = false,
  } = params;

  const rule = await prisma.merchantRule.upsert({
    where: { merchantPattern },
    update: { categoryId, tier, displayName },
    create: {
      merchantPattern,
      displayName,
      categoryId,
      tier,
      autoCreated: false,
    },
  });

  if (applyRetroactively) {
    // Find all transactions matching this merchant that aren't already categorized with this rule
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { normalizedMerchant: merchantPattern },
          { rawMerchant: { contains: merchantPattern } },
        ],
      },
    });

    for (const txn of transactions) {
      const normalized = normalizeMerchant(txn.rawMerchant);
      if (
        normalized === merchantPattern ||
        normalized.includes(merchantPattern) ||
        merchantPattern.includes(normalized)
      ) {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: {
            categoryId,
            normalizedMerchant: merchantPattern,
            autoCategorized: true,
            ruleTier: tier,
            isReviewed: true,
          },
        });
      }
    }
  }

  return rule;
}

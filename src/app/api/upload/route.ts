import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCSV } from "@/lib/parsers/csv-parser";
import { applyMerchantRules, normalizeMerchant } from "@/lib/rules/merchant-rules";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const accountId = formData.get("accountId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const content = await file.text();
  const fileName = file.name.toLowerCase();

  let transactions;

  if (fileName.endsWith(".csv")) {
    transactions = parseCSV(content);
  } else {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a CSV file." },
      { status: 400 }
    );
  }

  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "No transactions found in file" },
      { status: 400 }
    );
  }

  // Insert transactions
  let created = 0;
  let duplicates = 0;

  for (const txn of transactions) {
    // Simple duplicate detection: same date + amount + merchant
    const existing = await prisma.transaction.findFirst({
      where: {
        date: txn.date,
        amount: txn.amount,
        rawMerchant: txn.rawMerchant,
      },
    });

    if (existing) {
      duplicates++;
      continue;
    }

    await prisma.transaction.create({
      data: {
        date: txn.date,
        amount: txn.amount,
        description: txn.description,
        rawMerchant: txn.rawMerchant,
        normalizedMerchant: normalizeMerchant(txn.rawMerchant),
        accountId: accountId || undefined,
      },
    });
    created++;
  }

  // Auto-categorize using existing merchant rules
  const autoCategorized = await applyMerchantRules();

  return NextResponse.json({
    created,
    duplicates,
    autoCategorized,
    total: transactions.length,
  });
}

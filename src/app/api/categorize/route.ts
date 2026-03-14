import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createMerchantRule } from "@/lib/rules/merchant-rules";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    transactionId,
    categoryId,
    tier = "HARD",
    rememberMerchant = true,
    applyRetroactively = false,
  } = body;

  if (!transactionId || !categoryId) {
    return NextResponse.json(
      { error: "transactionId and categoryId are required" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Update this transaction
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      categoryId,
      isReviewed: true,
      autoCategorized: false,
      ruleTier: tier,
    },
  });

  let retroCount = 0;

  // Create merchant rule if requested
  if (rememberMerchant && transaction.normalizedMerchant) {
    const rule = await createMerchantRule({
      merchantPattern: transaction.normalizedMerchant,
      categoryId,
      tier,
      applyRetroactively,
    });

    if (applyRetroactively) {
      // Count how many were updated retroactively
      const updated = await prisma.transaction.count({
        where: {
          normalizedMerchant: transaction.normalizedMerchant,
          id: { not: transactionId },
          autoCategorized: true,
        },
      });
      retroCount = updated;
    }
  }

  return NextResponse.json({
    success: true,
    retroCount,
  });
}

export async function GET() {
  // Get count of matching transactions for a merchant (for the "Apply to N" prompt)
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

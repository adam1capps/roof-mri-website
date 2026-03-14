import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const merchant = request.nextUrl.searchParams.get("merchant");

  if (!merchant) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.transaction.count({
    where: {
      normalizedMerchant: merchant,
      categoryId: null,
    },
  });

  return NextResponse.json({ count });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get("filter") || "all";

  const where =
    filter === "uncategorized"
      ? { categoryId: null }
      : filter === "categorized"
      ? { NOT: { categoryId: null } }
      : {};

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: {
        include: { parent: true },
      },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json(transactions);
}

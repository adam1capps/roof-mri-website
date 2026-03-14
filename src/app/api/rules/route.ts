import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rules = await prisma.accountingRule.findMany({
    include: { category: true },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(rules);
}

export async function PATCH(request: NextRequest) {
  const { ruleId, isActive } = await request.json();

  const rule = await prisma.accountingRule.update({
    where: { id: ruleId },
    data: { isActive },
  });

  return NextResponse.json(rule);
}

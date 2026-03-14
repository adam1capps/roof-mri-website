import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default" },
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const settings = await prisma.settings.update({
    where: { id: "default" },
    data: body,
  });

  return NextResponse.json(settings);
}

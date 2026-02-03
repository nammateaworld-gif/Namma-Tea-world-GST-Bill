// app/api/products/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "public", "listofprodutes.json");

export async function GET() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

// ❌ Block mutations explicitly
export function POST() {
  return NextResponse.json({ error: "Read-only" }, { status: 405 });
}
export function PUT() {
  return NextResponse.json({ error: "Read-only" }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: "Read-only" }, { status: 405 });
}

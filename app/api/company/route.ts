export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "companydetails.json");
    const file = await readFile(filePath, "utf-8");
    const data = JSON.parse(file);

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "companydetails.json not found" },
      { status: 404 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: body });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

export function DELETE() {
  return NextResponse.json(
    { error: "Delete not supported" },
    { status: 405 }
  );
}

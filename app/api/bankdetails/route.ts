export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "bankdetails.json");
    const file = await readFile(filePath, "utf-8");
    const data = JSON.parse(file);

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "bankdetails.json not found" },
      { status: 404 }
    );
  }
}

export function POST() {
  return NextResponse.json(
    { error: "Write not supported" },
    { status: 405 }
  );
}

export function PUT() {
  return NextResponse.json(
    { error: "Update not supported" },
    { status: 405 }
  );
}

export function DELETE() {
  return NextResponse.json(
    { error: "Delete not supported" },
    { status: 405 }
  );
}

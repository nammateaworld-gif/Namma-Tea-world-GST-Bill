export const runtime = "nodejs";
import { NextResponse } from "next/server";

// GET request – read JSON from public folder
export async function GET() {
  try {
    // Fetch the static JSON from the public folder via the same origin.
    // Uses NEXT_PUBLIC_BASE_URL for prod (full URL) or defaults to relative path for local dev.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const res = await fetch(`${baseUrl}/companydetails.json`);
    // Removed cache option to avoid local dev compatibility issues; defaults to 'default' mode.
    if (!res.ok) throw new Error("File not found");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err); // Logs errors for debugging (visible in Cloudflare/Edge logs)
    return NextResponse.json({ error: String(err) }, { status: 404 });
  }
}

// POST request – No server-side write needed; client handles persistence via localStorage
export async function POST(request: Request) {
  try {
    // Optionally parse and validate the body if needed in future
    const body = await request.json();
    // For now, just acknowledge the save (client-side persistence is sufficient)
    return NextResponse.json({ success: true, data: body }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process save" }, { status: 500 });
  }
}

// DELETE request – Edge cannot delete files
export async function DELETE() {
  return NextResponse.json(
    { error: "Cannot delete in Edge runtime" },
    { status: 500 }
  );
}
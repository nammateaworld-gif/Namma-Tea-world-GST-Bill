// ✅ Use Node.js runtime to allow file operations

export const runtime = "nodejs";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// ✅ Define the Product type for safety
type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  variant?: string;
};

// ✅ Path to your JSON file
const filePath = path.join(process.cwd(), "public", "listofprodutes.json");

// ✅ GET - Read all products
export async function GET() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const products: Product[] = JSON.parse(data);
    return NextResponse.json(products);
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

// ✅ POST - Add a new product
export async function POST(req: Request) {
  try {
    const newProduct = (await req.json()) as Product;
    const data = JSON.parse(await fs.readFile(filePath, "utf8")) as Product[];
    data.push(newProduct);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}

// ✅ PUT - Update an existing product
export async function PUT(req: Request) {
  try {
    const updated = (await req.json()) as Product;
    const data = JSON.parse(await fs.readFile(filePath, "utf8")) as Product[];

    const index = data.findIndex((p) => p.id === updated.id);
    if (index === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    data[index] = { ...data[index], ...updated };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ success: true, product: data[index] });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// ✅ DELETE - Remove a product by ID
export async function DELETE(req: Request) {
  try {
    const { id } = (await req.json()) as { id: string };
    let data = JSON.parse(await fs.readFile(filePath, "utf8")) as Product[];

    const beforeCount = data.length;
    data = data.filter((p) => p.id !== id);

    if (data.length === beforeCount) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

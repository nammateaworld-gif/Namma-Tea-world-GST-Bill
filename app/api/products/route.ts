// ✅ Use Node.js runtime (Upstash + no filesystem writes)
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// ✅ Product type
type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  variant?: string;
};

// ✅ Init Redis
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,     // ← use this
  token: process.env.KV_REST_API_TOKEN!, // ← use the full token (not read-only)
});

// ✅ Redis key
const KEY = "products";

/* =====================================================
   GET – Fetch all products
===================================================== */
export async function GET() {
  const products = (await redis.get<Product[]>(KEY)) ?? [];
  return NextResponse.json(products);
}

/* =====================================================
   POST – Add a new product
===================================================== */
export async function POST(req: Request) {
  try {
    const newProduct = (await req.json()) as Product;

    if (!newProduct.id || !newProduct.name) {
      return NextResponse.json(
        { error: "Invalid product data" },
        { status: 400 }
      );
    }

    const products = (await redis.get<Product[]>(KEY)) ?? [];
    products.push(newProduct);

    await redis.set(KEY, products);

    return NextResponse.json({
      success: true,
      product: newProduct,
    });
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json(
      { error: "Failed to add product" },
      { status: 500 }
    );
  }
}

/* =====================================================
   PUT – Update an existing product
===================================================== */
export async function PUT(req: Request) {
  try {
    const updated = (await req.json()) as Product;

    if (!updated?.id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    const products = (await redis.get<Product[]>(KEY)) ?? [];

    const index = products.findIndex(p => p.id === updated.id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    products[index] = { ...products[index], ...updated };
    await redis.set(KEY, products);

    return NextResponse.json({
      success: true,
      product: products[index],
    });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/* =====================================================
   DELETE – Remove a product by ID
===================================================== */
export async function DELETE(req: Request) {
  try {
    const { id } = (await req.json()) as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    const products = (await redis.get<Product[]>(KEY)) ?? [];
    const filtered = products.filter(p => p.id !== id);

    if (filtered.length === products.length) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await redis.set(KEY, filtered);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

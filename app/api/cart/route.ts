import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { addToCart, getCart } from "@/lib/api-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID found" }, { status: 401 });
    }

    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }

    const authData = await redis.get(`auth:${sessionId}`);
    if (!authData) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { customerId } = JSON.parse(authData);
    const data = await getCart(customerId);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch cart in API route:", error);
    return NextResponse.json({ 
      error: "Failed to fetch cart", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }
  
    try {
      const { sessionId, variantCode, quantity } = await req.json();
  
      if (!sessionId || !variantCode || !quantity) {
        return NextResponse.json({ error: "Missing sessionId or variantCode or quantity" }, { status: 400 });
      }
  
      const authData = await redis.get(`auth:${sessionId}`);
      console.log(`nsc-adding-to-cart: authData: ${authData}`);
      if (!authData) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
  
      const { customerId } = JSON.parse(authData);

      console.log(`nsc-adding-to-cart: variant ${variantCode}, qty ${quantity} for customer ${customerId}`);
      const data = await addToCart(customerId, variantCode, quantity);
  
      return NextResponse.json(data);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      return NextResponse.json({ 
        error: "Failed to add to cart", 
        details: error.message 
      }, { status: 500 });
    }
  }


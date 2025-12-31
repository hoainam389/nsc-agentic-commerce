import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { submitOrder } from "@/lib/api-service";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

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

    const { token, customerId } = JSON.parse(authData);
    const data = await submitOrder(token, customerId);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to submit order in API route:", error);
    return NextResponse.json({ 
      error: "Failed to submit order", 
      details: error.message 
    }, { status: 500 });
  }
}


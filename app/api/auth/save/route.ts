import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
  }

  try {
    const { sessionId, token, customerId } = await req.json();

    if (!sessionId || !token || !customerId) {
      return NextResponse.json({ error: "Missing sessionId or token or customerId" }, { status: 400 });
    }

    // Store the token in Redis with a 5-minute (300 seconds) expiration
    await redis.set(`auth:${sessionId}`, JSON.stringify({ token, customerId }), "EX", 300);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving token to Redis:", error);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
}


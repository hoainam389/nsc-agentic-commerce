import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET(req: Request) {
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const token = await redis.get(`auth:${sessionId}`);

    if (token) {
      // Clear the token from Redis after successful retrieval
      await redis.del(`auth:${sessionId}`);
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error polling token from Redis:", error);
    return NextResponse.json({ error: "Failed to poll token" }, { status: 500 });
  }
}


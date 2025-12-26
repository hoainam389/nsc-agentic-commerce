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

    const data = await redis.get(`auth:${sessionId}`);
    if (!data) {
      return NextResponse.json({ error: "No data found for sessionId" }, { status: 404 });
    }
    const { token, customerId } = JSON.parse(data);

    return NextResponse.json({ token, customerId });
  } catch (error) {
    console.error("Error polling token from Redis:", error);
    return NextResponse.json({ error: "Failed to poll token" }, { status: 500 });
  }
}


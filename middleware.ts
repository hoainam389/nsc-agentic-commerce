import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = request.method === "OPTIONS" 
    ? new NextResponse(null, { status: 204 })
    : NextResponse.next();

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  response.headers.set("Access-Control-Allow-Headers", "*");

  return response;
}

export const config = {
  matcher: "/:path*",
};

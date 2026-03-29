import { NextResponse } from "next/server";
import { buildLlmsTxtBody } from "@/lib/seo/llms-txt-body";

export function GET() {
  const body = buildLlmsTxtBody();
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

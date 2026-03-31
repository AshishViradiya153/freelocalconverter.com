import { ImageResponse } from "@vercel/og";
import { siteConfig } from "@/config/site";

function sanitize(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function truncate(raw: string, maxChars: number): string {
  const s = sanitize(raw);
  if (s.length <= maxChars) return s;
  if (maxChars <= 3) return s.slice(0, maxChars);
  return `${s.slice(0, maxChars - 3)}...`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? siteConfig.name;
  const description = searchParams.get("description") ?? siteConfig.description;

  const safeTitle = truncate(title, 80);
  const safeDescription = truncate(description, 160);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 60,
        boxSizing: "border-box",
        background:
          "linear-gradient(135deg, rgba(99,102,241,1) 0%, rgba(15,23,42,1) 60%, rgba(2,6,23,1) 100%)",
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -1,
            wordBreak: "break-word",
            maxWidth: 1060,
          }}
        >
          {safeTitle}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 550,
            lineHeight: 1.3,
            opacity: 0.95,
            wordBreak: "break-word",
            maxWidth: 1060,
          }}
        >
          {safeDescription}
        </div>
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          opacity: 0.8,
          paddingTop: 24,
        }}
      >
        {siteConfig.name}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

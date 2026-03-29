import type { MetadataRoute } from "next";
import { rootSitemapUrl } from "@/lib/sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: rootSitemapUrl(),
  };
}

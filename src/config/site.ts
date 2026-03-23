export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Table",
  description:
    "Data grid application built with Next.js, TanStack Table, and shadcn/ui.",
  url: "https://csvcn.com",
  /** Set to your repository URL to show the GitHub icon in the header; leave empty to hide it. */
  links: { github: "" },
  /**
   * `utm_source` on outbound marketing links (trusted-by marquee, header repo, etc.).
   * Match the value you use in analytics (GA4, Plausible custom props, etc.).
   */
  utmSource: "csvcn",
};

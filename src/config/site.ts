export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "CSV Editor Online",
  description:
    "Free browser-based CSV, JSON, PDF, image, and data conversion tools that run locally in your browser without server uploads.",
  url: "https://csveditoronline.org/",
  copyrightYear: 2026,
  /** Set to your repository URL to show the GitHub icon in the header; leave empty to hide it. */
  links: { github: "" },
  /**
   * `utm_source` on outbound marketing links (trusted-by marquee, header repo, etc.).
   * Match the value you use in analytics (GA4, Plausible custom props, etc.).
   */
  utmSource: "csvcn",
};

export interface SiteConfigOrganizationContact {
  email: string;
  /** Schema.org `contactType` (e.g. customer support, sales). */
  contactType?: string;
}

export interface SiteConfigShape {
  name: string;
  description: string;
  url: string;
  copyrightYear: number;
  brandLogoPath: string;
  links: { github: string; twitter: string; linkedin: string };
  organizationContact?: SiteConfigOrganizationContact;
  utmSource: string;
}

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Localtool",
  description:
    "Localtool: free browser-based CSV, JSON, PDF, image, and data conversion tools that run locally in your browser without server uploads.",
  url: "https://csveditoronline.com/",
  copyrightYear: 2026,
  /**
   * Public logo path (served from `/public`). Used for Organization `logo` JSON-LD
   * and should match `icons.icon` in the root layout when possible.
   */
  brandLogoPath: "/icon.png",
  /**
   * Profile URLs included in Organization `sameAs` when non-empty.
   * `github` also drives the header repo link.
   */
  links: {
    github: "https://github.com/AshishViradiya153/csvvieweronline",
    twitter: "",
    linkedin: "",
  },
  /**
   * `utm_source` on outbound marketing links (trusted-by marquee, header repo, etc.).
   * Match the value you use in analytics (GA4, Plausible custom props, etc.).
   */
  utmSource: "localtool",
} satisfies SiteConfigShape;

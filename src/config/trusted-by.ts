import type { SimpleIcon } from "simple-icons";
import {
  siAirbnb,
  siApple,
  siDatabricks,
  siGithub,
  siGoogle,
  siIntel,
  siMeta,
  siNetflix,
  siNotion,
  siNvidia,
  siShopify,
  siSnowflake,
  siSpotify,
  siStripe,
  siVercel,
  siYale,
} from "simple-icons";

export interface TrustedByBrand {
  icon: SimpleIcon;
  /** Official site opened in a new tab when the logo is clicked. */
  href: string;
}

/**
 * Logos: local SVG in `public/trusted-by/logos/{id}.svg` (Wikimedia / official
 * assets where available), then Clearbit `logo.clearbit.com/{logoHost}` as
 * fallback for real marks, then text `abbr` if both fail.
 */
export interface TrustedByInstitution {
  /** Filename stem for `public/trusted-by/logos/{id}.svg`. */
  id: string;
  /** Full name for accessibility. */
  name: string;
  href: string;
  /** Shown only if local + remote logo fail to load. */
  abbr: string;
  /**
   * Hostname for Clearbit logo CDN (defaults from `href`; override when the
   * site hostname is not the one Clearbit indexes, e.g. `web.mit.edu`).
   */
  logoHost?: string;
}

export type TrustedByEntry =
  | { type: "brand"; brand: TrustedByBrand }
  | { type: "institution"; institution: TrustedByInstitution };

function brand(icon: SimpleIcon, href: string): TrustedByEntry {
  return { type: "brand", brand: { icon, href } };
}

function institution(
  id: string,
  name: string,
  href: string,
  abbr: string,
  logoHost?: string,
): TrustedByEntry {
  return {
    type: "institution",
    institution: { id, name, href, abbr, logoHost },
  };
}

/** Resolve hostname for remote logo lookup (Clearbit). */
export function defaultInstitutionLogoHost(href: string): string {
  const raw = new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  const aliases: Record<string, string> = {
    "web.mit.edu": "mit.edu",
  };
  return aliases[raw] ?? raw;
}

/**
 * Brand marks from [Simple Icons](https://simpleicons.org/) (CC0-1.0) plus
 * universities with real logos (local SVG and/or Clearbit fallback).
 */
export const trustedByEntries: TrustedByEntry[] = [
  brand(siGoogle, "https://www.google.com"),
  brand(siApple, "https://www.apple.com"),
  brand(siMeta, "https://www.meta.com"),
  brand(siGithub, "https://github.com"),
  brand(siStripe, "https://stripe.com"),
  brand(siShopify, "https://www.shopify.com"),
  brand(siDatabricks, "https://www.databricks.com"),
  brand(siSnowflake, "https://www.snowflake.com"),
  brand(siNotion, "https://www.notion.so"),
  brand(siVercel, "https://vercel.com"),
  brand(siIntel, "https://www.intel.com"),
  brand(siNvidia, "https://www.nvidia.com"),
  brand(siNetflix, "https://www.netflix.com"),
  brand(siSpotify, "https://www.spotify.com"),
  brand(siAirbnb, "https://www.airbnb.com"),
  brand(siYale, "https://www.yale.edu"),
  // North America
  institution(
    "harvard",
    "Harvard University",
    "https://www.harvard.edu",
    "Harvard",
  ),
  institution(
    "mit",
    "Massachusetts Institute of Technology",
    "https://web.mit.edu",
    "MIT",
    "mit.edu",
  ),
  institution(
    "stanford",
    "Stanford University",
    "https://www.stanford.edu",
    "Stanford",
  ),
  institution(
    "berkeley",
    "University of California, Berkeley",
    "https://www.berkeley.edu",
    "Berkeley",
  ),
  institution(
    "princeton",
    "Princeton University",
    "https://www.princeton.edu",
    "Princeton",
  ),
  institution(
    "caltech",
    "California Institute of Technology",
    "https://www.caltech.edu",
    "Caltech",
  ),
  institution(
    "columbia",
    "Columbia University",
    "https://www.columbia.edu",
    "Columbia",
  ),
  institution(
    "chicago",
    "University of Chicago",
    "https://www.uchicago.edu",
    "Chicago",
  ),
  institution(
    "cornell",
    "Cornell University",
    "https://www.cornell.edu",
    "Cornell",
  ),
  institution("duke", "Duke University", "https://www.duke.edu", "Duke"),
  institution(
    "cmu",
    "Carnegie Mellon University",
    "https://www.cmu.edu",
    "CMU",
  ),
  institution(
    "gatech",
    "Georgia Institute of Technology",
    "https://www.gatech.edu",
    "GT",
  ),
  institution(
    "jhu",
    "Johns Hopkins University",
    "https://www.jhu.edu",
    "JHU",
  ),
  institution(
    "nu",
    "Northwestern University",
    "https://www.northwestern.edu",
    "NU",
  ),
  institution(
    "toronto",
    "University of Toronto",
    "https://www.utoronto.ca",
    "Toronto",
  ),
  institution("mcgill", "McGill University", "https://www.mcgill.ca", "McGill"),
  // Europe & UK
  institution(
    "oxford",
    "University of Oxford",
    "https://www.ox.ac.uk",
    "Oxford",
  ),
  institution(
    "cambridge",
    "University of Cambridge",
    "https://www.cam.ac.uk",
    "Cambridge",
  ),
  institution(
    "imperial",
    "Imperial College London",
    "https://www.imperial.ac.uk",
    "Imperial",
  ),
  institution(
    "ucl",
    "University College London",
    "https://www.ucl.ac.uk",
    "UCL",
  ),
  institution("eth", "ETH Zurich", "https://ethz.ch", "ETH"),
  institution("epfl", "EPFL", "https://www.epfl.ch", "EPFL"),
  institution(
    "tum",
    "Technical University of Munich",
    "https://www.tum.de",
    "TUM",
  ),
  institution(
    "sorbonne",
    "Sorbonne University",
    "https://www.sorbonne-universite.fr",
    "Sorbonne",
  ),
  institution(
    "kuleuven",
    "KU Leuven",
    "https://www.kuleuven.be",
    "KU Leuven",
  ),
  // Asia–Pacific
  institution(
    "nus",
    "National University of Singapore",
    "https://nus.edu.sg",
    "NUS",
  ),
  institution(
    "ntu",
    "Nanyang Technological University",
    "https://www.ntu.edu.sg",
    "NTU",
  ),
  institution(
    "tsinghua",
    "Tsinghua University",
    "https://www.tsinghua.edu.cn",
    "Tsinghua",
  ),
  institution(
    "peking",
    "Peking University",
    "https://www.pku.edu.cn",
    "Peking",
  ),
  institution(
    "utokyo",
    "The University of Tokyo",
    "https://www.u-tokyo.ac.jp",
    "UTokyo",
  ),
  institution("kaist", "KAIST", "https://www.kaist.ac.kr", "KAIST"),
  institution(
    "snu",
    "Seoul National University",
    "https://www.snu.ac.kr",
    "SNU",
  ),
  institution(
    "melbourne",
    "University of Melbourne",
    "https://www.unimelb.edu.au",
    "Melbourne",
  ),
  institution(
    "anu",
    "Australian National University",
    "https://www.anu.edu.au",
    "ANU",
  ),
  institution(
    "sydney",
    "University of Sydney",
    "https://www.sydney.edu.au",
    "Sydney",
  ),
  institution(
    "hku",
    "The University of Hong Kong",
    "https://www.hku.hk",
    "HKU",
  ),
];

/** @deprecated Use `trustedByEntries` and filter `type === "brand"` if you only need icons. */
export const trustedByBrands: TrustedByBrand[] = trustedByEntries
  .filter((e): e is Extract<TrustedByEntry, { type: "brand" }> => e.type === "brand")
  .map((e) => e.brand);

export function trustedByEntryKey(entry: TrustedByEntry): string {
  if (entry.type === "brand") {
    return `brand-${entry.brand.icon.slug}`;
  }
  return `inst-${entry.institution.id}`;
}

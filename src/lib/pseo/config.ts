/**
 * Max leaf routes to pre-render per dynamic segment at build time (per param shape).
 * Larger corpora (100k+ URLs) rely on on-demand generation; sitemaps still list every URL.
 * Raise only if build time and hosting limits allow.
 */
export const PSEO_PREBUILD_LEAF_PER_LOCALE = 2500;

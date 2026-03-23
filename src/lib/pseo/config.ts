/**
 * Keep build-time static params bounded for very large pSEO corpora.
 * At runtime, non-prebuilt paths still resolve dynamically via App Router.
 * Tune this constant in code if you need a different prebuild cap.
 */
export const PSEO_PREBUILD_LEAF_PER_LOCALE = 2500;

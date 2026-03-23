# Trusted-by logo assets

## Local SVGs (`logos/`)

Most university marks are from **Wikimedia Commons** (check each file’s Commons page for license, e.g. CC BY-SA). Replace with your own licensed assets from each institution’s official brand/press kit if you need different terms.

### Typographic placeholders

These IDs use **simple local wordmark SVGs** (system sans text only) because Commons did not have a suitable freely licensed vector at fetch time: `toronto`, `mcgill`, `hku`, `nus`, `ntu`, `sydney`, `jhu`. Swap for official marks when you have permission.

### Refreshing from Commons

`scripts/fetch-trusted-by-logos.mjs` can download SVGs using **explicit** Commons file titles. Do **not** rely on broad Commons search for logos—it can return unrelated coats of arms or other universities. Prefer verifying `File:…` titles on commons.wikimedia.org first.

## Remote fallback

When a local `logos/{id}.svg` is missing or fails to load, the site may request a logo from **Clearbit’s Logo API** (`logo.clearbit.com`) using the school’s primary domain. That service has its own terms of use; swap to self-hosted SVGs only if you need to avoid third-party requests.

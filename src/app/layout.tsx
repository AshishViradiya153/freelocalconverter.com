import type { ReactNode } from "react";

/**
 * Root layout passes through to `app/[locale]/layout.tsx` (required by Next.js when using next-intl).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

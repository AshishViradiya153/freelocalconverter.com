import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * pSEO article bodies are English-only; UI strings follow the active locale.
 * Shows a clear notice when the interface locale is not the default.
 */
export async function PseoContentLocaleNotice({ locale }: { locale: string }) {
  if (locale === routing.defaultLocale) {
    return null;
  }
  const t = await getTranslations("pseo");
  return (
    <p
      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground text-sm leading-relaxed"
      role="status"
    >
      {t("contentLocaleNotice")}
    </p>
  );
}

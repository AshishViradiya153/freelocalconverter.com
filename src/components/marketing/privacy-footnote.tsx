import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function PrivacyFootnote() {
  const t = await getTranslations("marketing");
  const tNav = await getTranslations("nav");

  return (
    <section
      className="border-border border-t py-6 md:py-8"
      aria-label={t("privacySectionAria")}
    >
      <div className="container">
        <p className="max-w-2xl text-muted-foreground text-xs leading-relaxed">
          {t("privacyBody")}{" "}
          <Link className="underline underline-offset-2" href="/privacy">
            {tNav("privacy")}
          </Link>{" "}
          ·{" "}
          <Link className="underline underline-offset-2" href="/terms">
            {tNav("terms")}
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

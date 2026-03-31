"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_MESSAGE = 1000;

const LINK_FIELDS = ["linkX", "linkGithub", "linkLinkedin"] as const;

export function ContactUsApp() {
  const t = useTranslations("contactUs");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [linkX, setLinkX] = React.useState("");
  const [linkGithub, setLinkGithub] = React.useState("");
  const [linkLinkedin, setLinkLinkedin] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(t("errorEmailInvalid"));
      return;
    }
    if (!trimmed) {
      toast.error(t("errorEmpty"));
      return;
    }
    if (trimmed.length > MAX_MESSAGE) {
      toast.error(t("errorTooLong", { max: MAX_MESSAGE }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: trimmedEmail,
          message: trimmed,
          linkX: linkX.trim() || undefined,
          linkGithub: linkGithub.trim() || undefined,
          linkLinkedin: linkLinkedin.trim() || undefined,
        }),
      });

      const data: unknown = await res.json().catch(() => null);
      const err =
        data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "";
      const details =
        data &&
        typeof data === "object" &&
        "details" in data &&
        (data as { details?: unknown }).details;
      const fieldErrors =
        details &&
        typeof details === "object" &&
        "fieldErrors" in details &&
        (details as { fieldErrors?: Record<string, unknown> }).fieldErrors;

      if (res.status === 503 || err === "unavailable") {
        toast.error(t("errorUnavailable"));
        return;
      }
      if (res.status === 400 && err === "validation") {
        if (
          fieldErrors &&
          typeof fieldErrors === "object" &&
          Object.hasOwn(fieldErrors, "email")
        ) {
          toast.error(t("errorEmailInvalid"));
          return;
        }
        if (
          fieldErrors &&
          typeof fieldErrors === "object" &&
          LINK_FIELDS.some((k) => Object.hasOwn(fieldErrors, k))
        ) {
          toast.error(t("errorLinkInvalid"));
          return;
        }
        toast.error(t("errorEmpty"));
        return;
      }
      if (!res.ok) {
        toast.error(t("errorSendFailed"));
        return;
      }

      toast.success(t("submitToast"));
      setMessage("");
      setLinkX("");
      setLinkGithub("");
      setLinkLinkedin("");
    } catch {
      toast.error(t("errorSendFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container max-w-3xl py-10 pb-20">
      <header className="pb-2">
        <p className="font-bold font-mono text-foreground text-xs uppercase tracking-wider">
          {t("kicker")}
        </p>
        <div className="mt-2 min-w-0">
          <h1 className={toolHeroTitleClassName}>{t("heroTitle")}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            {t("heroDescription")}
          </p>
        </div>
      </header>

      <section className="mt-8" aria-label={t("heroTitle")}>
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-none border-2 border-border bg-background px-4 py-5 sm:px-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name">{t("fieldName")}</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fieldNamePlaceholder")}
              autoComplete="name"
              maxLength={120}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email">{t("fieldEmail")}</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("fieldEmailPlaceholder")}
              autoComplete="email"
              maxLength={254}
              required
              disabled={isSubmitting}
            />
          </div>

          <fieldset className="space-y-4 border-0 p-0">
            <legend className="mb-1 font-medium text-foreground text-sm">
              {t("linksGroupLabel")}
            </legend>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-link-x">{t("fieldLinkX")}</Label>
              <Input
                id="contact-link-x"
                type="url"
                inputMode="url"
                value={linkX}
                onChange={(e) => setLinkX(e.target.value)}
                placeholder={t("fieldLinkXPlaceholder")}
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-link-github">
                {t("fieldLinkGithub")}
              </Label>
              <Input
                id="contact-link-github"
                type="url"
                inputMode="url"
                value={linkGithub}
                onChange={(e) => setLinkGithub(e.target.value)}
                placeholder={t("fieldLinkGithubPlaceholder")}
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-link-linkedin">
                {t("fieldLinkLinkedin")}
              </Label>
              <Input
                id="contact-link-linkedin"
                type="url"
                inputMode="url"
                value={linkLinkedin}
                onChange={(e) => setLinkLinkedin(e.target.value)}
                placeholder={t("fieldLinkLinkedinPlaceholder")}
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-message">{t("fieldMessage")}</Label>
            <Textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("fieldMessagePlaceholder")}
              maxLength={MAX_MESSAGE}
              rows={6}
              required
              disabled={isSubmitting}
              className="min-h-[140px] resize-y font-sans text-sm"
            />
            <p className="text-muted-foreground text-xs">
              {message.trim().length}/{MAX_MESSAGE}
            </p>
          </div>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </section>
    </div>
  );
}

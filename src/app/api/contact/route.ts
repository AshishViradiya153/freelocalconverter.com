import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  isContactMailConfigured,
  sendContactMail,
} from "@/lib/send-contact-mail";

const MAX_MESSAGE = 1000;
const MAX_URL_LEN = 500;

function optionalHttpsUrl(field: "linkX" | "linkGithub" | "linkLinkedin") {
  return (val: string, ctx: z.RefinementCtx) => {
    if (!val) return;
    const parsed = z.string().url().safeParse(val);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "invalid_url",
      });
      return;
    }
    if (!/^https:\/\//i.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "invalid_url",
      });
    }
  };
}

const contactBodySchema = z
  .object({
    name: z.string().max(120).optional(),
    email: z.string().email().max(254),
    message: z.string().max(MAX_MESSAGE),
    linkX: z.string().max(MAX_URL_LEN).optional(),
    linkGithub: z.string().max(MAX_URL_LEN).optional(),
    linkLinkedin: z.string().max(MAX_URL_LEN).optional(),
  })
  .transform((d) => ({
    name: (d.name ?? "").trim(),
    email: d.email.trim(),
    message: d.message.trim(),
    linkX: (d.linkX ?? "").trim(),
    linkGithub: (d.linkGithub ?? "").trim(),
    linkLinkedin: (d.linkLinkedin ?? "").trim(),
  }))
  .refine((d) => d.message.length > 0, {
    path: ["message"],
    message: "required",
  })
  .superRefine((d, ctx) => {
    optionalHttpsUrl("linkX")(d.linkX, ctx);
    optionalHttpsUrl("linkGithub")(d.linkGithub, ctx);
    optionalHttpsUrl("linkLinkedin")(d.linkLinkedin, ctx);
  });

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit();
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  if (!isContactMailConfigured()) {
    console.error({ message: "Contact mail env not configured" });
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = contactBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, message, linkX, linkGithub, linkLinkedin } = parsed.data;

  try {
    await sendContactMail({
      name,
      email,
      message,
      linkX,
      linkGithub,
      linkLinkedin,
    });
  } catch (error) {
    console.error({ error });
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

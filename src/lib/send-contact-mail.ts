import nodemailer from "nodemailer";

export interface ContactMailInput {
  name: string;
  email: string;
  message: string;
  linkX: string;
  linkGithub: string;
  linkLinkedin: string;
}

function getMailRuntime(): {
  transporter: nodemailer.Transporter;
  to: string;
  from: string;
} | null {
  const host = process.env.CONTACT_SMTP_HOST;
  const user = process.env.CONTACT_SMTP_USER;
  const pass = process.env.CONTACT_SMTP_PASS;
  const to = process.env.CONTACT_MAIL_TO;
  if (!host || !user || !pass || !to) return null;

  const port = Number(process.env.CONTACT_SMTP_PORT ?? "587");
  const secure = process.env.CONTACT_SMTP_SECURE === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const from = process.env.CONTACT_MAIL_FROM?.trim() || user;

  return { transporter, to, from };
}

export function isContactMailConfigured(): boolean {
  return getMailRuntime() !== null;
}

export async function sendContactMail(input: ContactMailInput): Promise<void> {
  const cfg = getMailRuntime();
  if (!cfg) {
    throw new Error("CONTACT_MAIL_NOT_CONFIGURED");
  }

  const { transporter, to, from } = cfg;
  const who = input.name || input.email || "visitor";
  const subject = `[Contact] ${who}`.slice(0, 200);

  const linkLines = [
    input.linkX ? `X: ${input.linkX}` : null,
    input.linkGithub ? `GitHub: ${input.linkGithub}` : null,
    input.linkLinkedin ? `LinkedIn: ${input.linkLinkedin}` : null,
  ].filter((line) => line !== null);

  const lines = [
    "Message from the contact form:",
    "",
    input.name ? `Name: ${input.name}` : null,
    input.email ? `Email: ${input.email}` : null,
    ...(linkLines.length > 0 ? ["", "Links:", ...linkLines] : []),
    "",
    input.message,
  ].filter((line) => line !== null);

  await transporter.sendMail({
    from,
    to,
    replyTo: input.email || undefined,
    subject,
    text: lines.join("\n"),
  });
}

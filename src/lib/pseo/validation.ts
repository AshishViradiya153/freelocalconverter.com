import { z } from "zod";
import type { PseoPageRecord } from "./types";

const routeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("guide") }),
  z.object({
    type: z.literal("tool"),
    category: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
]);

const faqSchema = z.object({
  question: z.string().min(10).max(300),
  answer: z.string().min(40).max(2500),
});

const sectionSchema = z.object({
  heading: z.string().min(4).max(200),
  paragraphs: z.array(z.string().min(40)).min(1).max(12),
});

export const pseoPageRecordSchema = z.object({
  id: z
    .string()
    .min(4)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  template: z.enum(["guide", "tool"]),
  route: routeSchema,
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  primaryKeyword: z.string().min(3).max(120),
  secondaryKeywords: z.array(z.string().min(2)).max(24),
  title: z.string().min(20).max(70),
  metaDescription: z.string().min(110).max(200),
  heroHeading: z.string().min(10).max(100),
  intro: z.array(z.string().min(40)).min(2).max(6),
  sections: z.array(sectionSchema).min(2).max(16),
  faqs: z.array(faqSchema).min(2).max(24),
  relatedSlugs: z.array(z.string()).max(20),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  readTimeMinutes: z.number().int().min(1).max(60).optional(),
});

export function parsePseoPageRecord(raw: unknown): PseoPageRecord {
  return pseoPageRecordSchema.parse(raw) as PseoPageRecord;
}

export function validatePseoRegistry(pages: unknown[]): PseoPageRecord[] {
  return pages.map((p, i) => {
    try {
      return parsePseoPageRecord(p);
    } catch (e) {
      throw new Error(`pSEO page index ${i} failed validation: ${e}`);
    }
  });
}

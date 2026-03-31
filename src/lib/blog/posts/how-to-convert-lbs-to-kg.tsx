import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-lbs-to-kg",
  title: "Lbs to Kg: how to convert pounds to kilograms (exact factor + examples)",
  description:
    "Convert lbs to kg using the exact factor 1 lb = 0.45359237 kg. Learn the formula, see common examples, and use the in-browser Lbs to Kg converter.",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 6,
  keywords: [
    "lbs to kg",
    "pounds to kilograms",
    "lb to kg",
    "lbs to kg formula",
    "convert pounds to kg",
  ],
};

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        To convert <strong>pounds (lb)</strong> to <strong>kilograms (kg)</strong>,
        multiply by the exact factor{" "}
        <code className="text-foreground">0.45359237</code>:
      </p>
      <p>
        <code className="text-foreground">kg = lb × 0.45359237</code>
      </p>

      <p>
        If you just want the answer, use our{" "}
        <Link href="/lbs-to-kg" className={linkClass}>
          Lbs to Kg converter
        </Link>{" "}
        (runs locally in your browser).
      </p>

      <h2>Why the conversion factor is 0.45359237</h2>
      <p>
        The factor comes from the international agreement that defines the pound
        in terms of kilograms. Because it’s exact, you can use it confidently
        for calculations that need consistency across systems.
      </p>

      <h2>Examples: common lbs to kg conversions</h2>
      <ul>
        <li>
          <strong>150 lb</strong> →{" "}
          <code className="text-foreground">150 × 0.45359237 = 68.0388555 kg</code>{" "}
          (≈ <strong>68.04 kg</strong>)
        </li>
        <li>
          <strong>200 lb</strong> →{" "}
          <code className="text-foreground">200 × 0.45359237 = 90.718474 kg</code>{" "}
          (≈ <strong>90.72 kg</strong>)
        </li>
        <li>
          <strong>1 lb</strong> →{" "}
          <code className="text-foreground">0.45359237 kg</code>
        </li>
      </ul>

      <h2>Reverse conversion (kg to lbs)</h2>
      <p>
        To convert kilograms to pounds, divide by the same factor:
      </p>
      <p>
        <code className="text-foreground">lb = kg ÷ 0.45359237</code>
      </p>
      <p>
        Try the reverse tool:{" "}
        <Link href="/kg-to-lbs" className={linkClass}>
          Kg to Lbs
        </Link>
        .
      </p>

      <h2>Next: one page for all conversions</h2>
      <p>
        If you switch between weight and length conversions, use the{" "}
        <Link href="/unit-converter" className={linkClass}>
          Unit Converter
        </Link>{" "}
        to keep everything in one place.
      </p>
    </BlogProse>
  );
}


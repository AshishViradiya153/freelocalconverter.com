import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-decimal-to-fraction",
  title: "How to convert decimals to fractions (simplest form, mixed numbers, and examples)",
  description:
    "Convert a decimal like 0.375 into a simplified fraction (3/8). Learn terminating vs repeating decimals, mixed numbers, and when rounding is unavoidable.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 11,
  keywords: [
    "how to convert decimal to fraction",
    "decimal to fraction",
    "simplify fraction",
    "mixed number to fraction",
    "convert decimals to fractions",
  ],
};

export function BlogPostContent() {
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  return (
    <BlogProse>
      <p>
        <strong>How to convert decimal to fraction</strong> depends on what
        kind of decimal you have. Terminating decimals (like 0.75) become
        exact fractions by moving the decimal point; repeating decimals (like
        0.333...) can also become exact fractions, but you need a repeating
        decimal method instead. This guide focuses on both, with practical
        examples and a workflow for simplifying the final fraction.
      </p>

      <p>
        Want a calculator-style converter? Use{" "}
        <Link href="/decimal-fraction-converter" className={linkClass}>
          Decimal ↔ fraction
        </Link>{" "}
        to get simplified results instantly.
      </p>

      <p>
        <strong>Key takeaways</strong>
      </p>
      <ul>
        <li>
          Terminating decimals -{">"} exact fractions with a power-of-10
          denominator (then simplify).
        </li>
        <li>
          Repeating decimals -{">"} exact fractions, but use the repeating-decimal
          method (or algebra).
        </li>
        <li>
          Mixed numbers are just “whole part + fractional part” and can be
          represented as improper fractions when needed.
        </li>
        <li>
          Always simplify at the end (divide numerator and denominator by
          the greatest common divisor).
        </li>
      </ul>

      <h2>Step 1: identify the decimal type</h2>
      <p>
        Before converting, decide whether your decimal is:
      </p>
      <ul>
        <li>
          <strong>Terminating</strong>: ends after a finite number of digits
          (e.g. 0.125, 2.5).
        </li>
        <li>
          <strong>Repeating</strong>: one or more digits repeat forever
          (e.g. 0.333..., 0.142857142857...).
        </li>
      </ul>

      <h2>Terminating decimals: fastest exact method</h2>
      <p>
        For a terminating decimal, write it as a fraction with denominator
        equal to the power of 10 that matches the number of digits after
        the decimal point.
      </p>

      <ol>
        <li>
          Remove the decimal point to form the numerator.
        </li>
        <li>
          Use 10, 100, 1000, etc. as the denominator (depending on digits).
        </li>
        <li>
          Simplify the fraction.
        </li>
      </ol>

      <h2>Worked examples</h2>
      <p>
        Example 1: convert 0.75.
        {" "}
        <br />
        0.75 = 75/100 = 3/4.
      </p>
      <p>
        Example 2: convert 2.125.
        {" "}
        <br />
        2.125 = 2125/1000 = 17/8 = 2 1/8 (mixed number form).
      </p>

      <h2>Repeating decimals: method for exact fractions</h2>
      <p>
        For repeating decimals, the numerator and denominator come from
        aligning one “repeat” of digits and subtracting, or from converting
        to an algebraic equation. A common reference method is:
      </p>
      <ol>
        <li>Let x equal the repeating decimal.</li>
        <li>
          Multiply x by the appropriate power of 10 so the repeating part lines
          up.
        </li>
        <li>Subtract to eliminate the repeating digits.</li>
        <li>Simplify the resulting fraction.</li>
      </ol>

      <p>
        Quick reference example: 0.333... = 1/3.
      </p>

      <h2>Where rounding enters (and how to avoid it)</h2>
      <p>
        If your “decimal” came from measurement or from rounding a number
        upstream, it may be an approximation of a rational value. In that
        case, your fraction result can be a “best rational approximation”
        with a chosen maximum denominator. If you need the exact fraction,
        keep the original unrounded decimal information.
      </p>

      <h2>Next: convert the other way</h2>
      <p>
        If you also need the reverse conversion, see{" "}
        <Link
          href="/blog/how-to-convert-fractions-to-decimals"
          className={linkClass}
        >
          how to convert fractions to decimals
        </Link>
        .
      </p>

      <h2>Reference</h2>
      <p>
        For a worked walkthrough of converting terminating and repeating
        decimals, see{" "}
        <a
          href="https://www.mathsisfun.com/converting-decimals-fractions.html"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          Maths Is Fun: Convert Decimals to Fractions
        </a>
        .
      </p>
    </BlogProse>
  );
}


import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-celsius-to-fahrenheit",
  title: "How to convert Celsius to Fahrenheit (and Fahrenheit to Celsius)",
  description:
    "Use the exact formulas to convert temperatures between Celsius and Fahrenheit: F = C × 9/5 + 32 and C = (F - 32) × 5/9. Includes examples and a quick calculator workflow.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 9,
  keywords: [
    "how to convert celsius to fahrenheit",
    "celsius to fahrenheit formula",
    "fahrenheit to celsius formula",
    "temperature conversion",
    "convert °C to °F",
  ],
};

export function BlogPostContent() {
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  return (
    <BlogProse>
      <p>
        <strong>How to convert Celsius to Fahrenheit</strong> is mostly about
        using the right formula. The exact relationships are:
        <br />
        <code className="text-foreground">F = C * 9/5 + 32</code> and
        <br />
        <code className="text-foreground">C = (F - 32) * 5/9</code>.
        This guide is for anyone who needs quick, correct conversions for
        weather, cooking, lab work, and everyday comparisons.
      </p>

      <p>
        If you want to avoid mental math, use the in-browser converter:
        {" "}
        <Link href="/celsius-fahrenheit-converter" className={linkClass}>
          Celsius ↔ Fahrenheit
        </Link>
        .
      </p>

      <p>
        <strong>Key takeaways</strong>
      </p>
      <ul>
        <li>
          Celsius-to-Fahrenheit uses{" "}
          <code className="text-foreground">* 9/5</code> then{" "}
          <code className="text-foreground">+ 32</code>.
        </li>
        <li>
          Fahrenheit-to-Celsius subtracts{" "}
          <code className="text-foreground">32</code> then multiplies{" "}
          <code className="text-foreground">* 5/9</code>.
        </li>
        <li>
          Conversions are exact scale formulas; rounding is the only place
          mistakes happen.
        </li>
        <li>
          For precision, round at the end of the calculation (not after each
          step).
        </li>
      </ul>

      <h2>Celsius to Fahrenheit (step-by-step)</h2>
      <p>
        Start with a Celsius temperature (C) and plug it into:
        {" "}
        <code className="text-foreground">F = C * 9/5 + 32</code>.
      </p>

      <ol>
        <li>
          Multiply C by <code className="text-foreground">9/5</code> (also
          written as <code className="text-foreground">1.8</code>).
        </li>
        <li>
          Add <code className="text-foreground">32</code>.
        </li>
        <li>
          Round only if you need a whole number (weather and rough estimates
          often use integers).
        </li>
      </ol>

      <h2>Worked examples</h2>
      <p>
        Example 1: convert 20 C.
        {" "}
        <br />
        <code className="text-foreground">F = 20 * 9/5 + 32</code> ={" "}
        <code className="text-foreground">36 + 32</code> ={" "}
        <code className="text-foreground">68 F</code>.
      </p>
      <p>
        Example 2: convert 0 C.
        {" "}
        <br />
        <code className="text-foreground">F = 0 * 9/5 + 32</code> ={" "}
        <code className="text-foreground">32 F</code>.
      </p>

      <h2>Fahrenheit to Celsius (inverse)</h2>
      <p>
        Use the inverse formula:
        {" "}
        <code className="text-foreground">C = (F - 32) * 5/9</code>.
      </p>

      <ol>
        <li>
          Subtract <code className="text-foreground">32</code> from F.
        </li>
        <li>
          Multiply by <code className="text-foreground">5/9</code> (also
          written as <code className="text-foreground">0.555...</code>).
        </li>
        <li>
          Round at the end, if needed.
        </li>
      </ol>

      <h2>Accuracy tips (where people slip)</h2>
      <ul>
        <li>
          If you round between steps, you can introduce small but noticeable
          errors (especially for values like 77 F or 25 C).
        </li>
        <li>
          Use consistent units. The formulas assume true Celsius (C) and true
          Fahrenheit (F), not a local scale or “thermometer style” conversion.
        </li>
      </ul>

      <h2>Reference</h2>
      <p>
        The Celsius/Fahrenheit temperature scale relationship is documented by{" "}
        <a
          href="https://www.nist.gov/pml/owm/si-units-temperature"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          NIST
        </a>
        .
      </p>

      <h2>Next steps</h2>
      <p>
        Use the in-browser tool to convert instantly:
        {" "}
        <Link href="/celsius-fahrenheit-converter" className={linkClass}>
          Celsius ↔ Fahrenheit
        </Link>
        .
        Then apply the same “round at the end” approach to other unit
        conversions.
      </p>
    </BlogProse>
  );
}


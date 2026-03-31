import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-degrees-to-radians",
  title: "How to convert degrees to radians (and radians to degrees) for math and geometry",
  description:
    "Convert angles between degrees and radians using rad = deg * pi / 180 and deg = rad * 180 / pi. Includes clear examples and a quick browser converter.",
  publishedAt: "2026-04-03",
  category: "guide",
  readTimeMinutes: 9,
  keywords: [
    "how to convert degrees to radians",
    "degrees to radians formula",
    "radians to degrees formula",
    "pi radians equals 180 degrees",
    "angle unit conversion",
  ],
};

export function BlogPostContent() {
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  return (
    <BlogProse>
      <p>
        <strong>How to convert degrees to radians</strong> is a standard math
        unit conversion used in trig, circles, and geometry. The core
        relationship is:
        <br />
        <code className="text-foreground">rad = deg * pi / 180</code>.
        The inverse is:
        <br />
        <code className="text-foreground">deg = rad * 180 / pi</code>.
      </p>

      <p>
        Prefer instant calculations? Use{" "}
        <Link href="/degrees-radians-converter" className={linkClass}>
          Degrees ↔ radians
        </Link>
        .
      </p>

      <p>
        <strong>Key takeaways</strong>
      </p>
      <ul>
        <li>
          Convert by multiplying degrees by <code className="text-foreground">pi/180</code>.
        </li>
        <li>
          Convert back by multiplying radians by <code className="text-foreground">180/pi</code>.
        </li>
        <li>
          180 degrees equals pi radians.
        </li>
        <li>
          Round only after computing the full expression (especially if
          you plug into trig functions).
        </li>
      </ul>

      <h2>Degrees to radians (how to do it)</h2>
      <p>
        Take your angle in degrees (deg) and apply:
        {" "}
        <code className="text-foreground">rad = deg * pi / 180</code>.
      </p>

      <ol>
        <li>Write down the degrees value.</li>
        <li>Multiply by pi.</li>
        <li>Divide by 180.</li>
        <li>Round at the end if needed.</li>
      </ol>

      <h2>Examples</h2>
      <p>
        Example 1: 90 degrees.
        {" "}
        <br />
        rad = 90 * pi / 180 = <code className="text-foreground">pi/2</code>.
      </p>
      <p>
        Example 2: 180 degrees.
        {" "}
        <br />
        rad = 180 * pi / 180 = <code className="text-foreground">pi</code>.
      </p>

      <h2>Radians to degrees</h2>
      <p>
        If you already have radians and want degrees, use:
        {" "}
        <code className="text-foreground">deg = rad * 180 / pi</code>.
      </p>

      <ol>
        <li>Write down the radians value.</li>
        <li>Multiply by 180.</li>
        <li>Divide by pi.</li>
      </ol>

      <h2>Where mistakes happen</h2>
      <ul>
        <li>
          Confusing radians with degrees in calculators/software (for trig
          functions, most inputs require radians).
        </li>
        <li>
          Rounding pi too early instead of using a full-precision value.
        </li>
      </ul>

      <h2>Reference</h2>
      <p>
        The radians definition and the degrees<->radians conversion are explained by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Radian"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          Wikipedia (Radian)
        </a>
        .
      </p>

      <h2>Next steps</h2>
      <p>
        Convert once, then reuse the result in your trig/geometry steps.
        If you need to check multiple values quickly, run{" "}
        <Link href="/degrees-radians-converter" className={linkClass}>
          Degrees ↔ radians
        </Link>{" "}
        and copy the output.
      </p>
    </BlogProse>
  );
}


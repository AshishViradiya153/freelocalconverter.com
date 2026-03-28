import { describe, expect, it } from "vitest";

import { svgToCode, toJsxPropName } from "@/lib/svg/svg-to-code";

describe("toJsxPropName", () => {
  it("maps class and hyphenated SVG attrs", () => {
    expect(toJsxPropName("class")).toBe("className");
    expect(toJsxPropName("stroke-width")).toBe("strokeWidth");
    expect(toJsxPropName("stroke-linecap")).toBe("strokeLinecap");
  });

  it("keeps data- and aria- attributes", () => {
    expect(toJsxPropName("data-icon")).toBe("data-icon");
    expect(toJsxPropName("aria-hidden")).toBe("aria-hidden");
  });
});

describe("svgToCode", () => {
  const sample = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" stroke-width="2" class="x"/></svg>`;

  it("returns jsx with camelCase attrs", () => {
    const r = svgToCode(sample, { mode: "jsx" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toContain("strokeWidth");
    expect(r.text).toContain("className");
    expect(r.text).toContain('className="x"');
  });

  it("converts inline style attribute to JSX style object", () => {
    const r = svgToCode(
      `<svg xmlns="http://www.w3.org/2000/svg"><g style="stroke-width: 2; fill: red;" /></svg>`,
      { mode: "jsx" },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toContain('style={{ strokeWidth: "2", fill: "red" }}');
  });

  it("returns a React component for react mode", () => {
    const r = svgToCode(sample, { mode: "react", componentName: "MyIcon" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toContain("export function MyIcon");
    expect(r.text).toContain("SVGProps<SVGSVGElement>");
    expect(r.text).toContain("{...props}");
  });

  it("pretty mode includes declaration and root svg", () => {
    const r = svgToCode(sample, { mode: "pretty" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toContain('<?xml version="1.0"');
    expect(r.text).toContain("<svg");
  });

  it("fails on non-svg root", () => {
    const r = svgToCode("<div/>", { mode: "jsx" });
    expect(r.ok).toBe(false);
  });

  it("treats empty input as no conversion yet", () => {
    expect(svgToCode("", { mode: "jsx" })).toEqual({ ok: true, text: "" });
    expect(svgToCode("   \n", { mode: "react" })).toEqual({ ok: true, text: "" });
  });
});

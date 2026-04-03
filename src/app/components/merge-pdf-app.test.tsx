import { act, render, screen, waitFor } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MergePdfApp } from "@/app/components/merge-pdf-app";
import { setInputFiles } from "@/lib/test/dom-file-input";

vi.mock("sonner", () => ({
  toast: {
    message: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

async function minimalPdfFile(name: string): Promise<File> {
  const doc = await PDFDocument.create();
  doc.addPage([100, 100]);
  const bytes = await doc.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new File([copy], name, { type: "application/pdf" });
}

describe("MergePdfApp", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps merge disabled until two PDF files are added", async () => {
    render(<MergePdfApp />);
    expect(
      screen.queryByRole("button", { name: "Merge & download PDF" }),
    ).not.toBeInTheDocument();

    const input = document.getElementById(
      "merge-pdf-input",
    ) as HTMLInputElement;
    const one = await minimalPdfFile("one.pdf");
    await act(async () => {
      setInputFiles(input, [one]);
    });

    const mergeBtn = await screen.findByRole("button", {
      name: "Merge & download PDF",
    });
    expect(mergeBtn).toBeDisabled();

    const two = await minimalPdfFile("two.pdf");
    await act(async () => {
      setInputFiles(input, [two]);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Merge & download PDF" }),
      ).toBeEnabled();
    });
  });

  it("shows sortable list with reorder controls after two PDFs", async () => {
    render(<MergePdfApp />);
    const input = document.getElementById(
      "merge-pdf-input",
    ) as HTMLInputElement;
    const first = await minimalPdfFile("report.pdf");
    const second = await minimalPdfFile("extra.pdf");

    await act(async () => {
      setInputFiles(input, [first, second]);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Merge & download PDF" }),
      ).toBeEnabled();
    });

    await screen.findByRole("list", { name: "PDF merge order" });
    expect(
      screen.getByRole("button", { name: "Drag to reorder report.pdf" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Up" }).length).toBeGreaterThan(
      0,
    );
  });
});

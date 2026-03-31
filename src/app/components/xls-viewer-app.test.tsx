import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XlsViewerApp } from "@/app/components/xls-viewer-app";
import { parseStringMatrixToImportResult } from "@/lib/csv-import";
import { parseExcelFile } from "@/lib/excel-import";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { message: vi.fn() },
}));

vi.mock("@/lib/csv-viewer-idb", () => ({
  loadCsvViewerSession: vi.fn(() => Promise.resolve(null)),
  saveCsvViewerSession: vi.fn(() => Promise.resolve()),
  clearCsvViewerSession: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/xls-viewer-memory", () => ({
  getInMemoryXlsViewerState: vi.fn(() => null),
  setInMemoryXlsViewerState: vi.fn(),
}));

vi.mock("@/app/components/csv-viewer-app", () => ({
  CsvGridPanel: ({ session }: { session: { fileName: string; rows: { id: string }[] } }) => (
    <div data-testid="csv-grid">
      <span data-testid="grid-file">{session.fileName}</span>
      <span data-testid="grid-rows">{session.rows.length}</span>
    </div>
  ),
}));

vi.mock("@/lib/excel-import", () => ({
  parseExcelFile: vi.fn(),
}));

describe("XlsViewerApp", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.mocked(parseExcelFile).mockImplementation(async (_file, opts) => {
      const idx =
        typeof opts === "number"
          ? opts
          : Math.min(Math.max(0, opts?.sheetIndex ?? 0), 1);
      const matrix =
        idx === 0
          ? [
            ["H"],
            ["alpha"],
          ]
          : [
            ["H"],
            ["beta"],
          ];
      const result = parseStringMatrixToImportResult(matrix);
      return {
        result,
        sheetNames: ["First", "Second"],
        sheetIndex: idx,
        sheetRowCount: 2,
      };
    });
  });

  async function uploadWorkbook(fileName = "book.xlsx") {
    const input = await waitFor(() => {
      const el = document.getElementById("xls-viewer-file");
      expect(el).toBeTruthy();
      return el as HTMLInputElement;
    });
    const file = new File(["x"], fileName, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
  }

  it("shows bottom sheet tabs for multi-sheet workbooks and switches sheets", async () => {
    render(<XlsViewerApp />);

    await waitFor(() => {
      expect(document.getElementById("xls-viewer-file")).toBeInTheDocument();
    });

    await uploadWorkbook();

    await waitFor(() => {
      expect(screen.getByTestId("csv-grid")).toBeInTheDocument();
    });

    const tablist = screen.getByRole("tablist", { name: /sheetLabel/i });
    expect(tablist).toBeInTheDocument();

    const first = screen.getByRole("tab", { name: "First" });
    const second = screen.getByRole("tab", { name: "Second" });
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveAttribute("aria-selected", "false");

    await act(async () => {
      fireEvent.click(second);
    });

    await waitFor(() => {
      expect(second).toHaveAttribute("aria-selected", "true");
    });
    expect(first).toHaveAttribute("aria-selected", "false");

    expect(vi.mocked(parseExcelFile).mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastCall = vi.mocked(parseExcelFile).mock.calls.at(-1);
    expect(lastCall?.[1]).toMatchObject({ sheetIndex: 1 });
  });

  it("does not render sheet tabs when the workbook has one sheet", async () => {
    vi.mocked(parseExcelFile).mockImplementation(async (_file, opts) => {
      const idx = typeof opts === "number" ? opts : (opts?.sheetIndex ?? 0);
      const result = parseStringMatrixToImportResult([
        ["H"],
        ["only"],
      ]);
      return {
        result,
        sheetNames: ["OnlySheet"],
        sheetIndex: idx,
        sheetRowCount: 2,
      };
    });

    render(<XlsViewerApp />);

    await waitFor(() => {
      expect(document.getElementById("xls-viewer-file")).toBeInTheDocument();
    });

    await uploadWorkbook("single.xlsx");

    await waitFor(() => {
      expect(screen.getByTestId("csv-grid")).toBeInTheDocument();
    });

    expect(screen.queryByRole("tablist", { name: /sheetLabel/i })).not.toBeInTheDocument();
  });
});

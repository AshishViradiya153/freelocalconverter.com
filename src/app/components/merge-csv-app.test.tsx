import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MergeCsvApp } from "@/app/components/merge-csv-app";
import { setInputFiles } from "@/lib/test/dom-file-input";

const downloadBlob = vi.fn();

vi.mock("@/lib/download-blob", () => ({
  downloadBlob: (...args: unknown[]) => downloadBlob(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    message: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
      if (namespace === "landing" && key === "largeFileDescription" && values) {
        return `shown ${values.shown} total ${values.total}`;
      }
      if (values && typeof values === "object" && "count" in values) {
        return `${key}:${String(values.count)}`;
      }
      if (values && typeof values === "object" && "name" in values) {
        return `${key}:${String(values.name)}`;
      }
      return key;
    },
}));

describe("MergeCsvApp", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps merge disabled until two CSV files are added", async () => {
    render(<MergeCsvApp />);
    expect(
      screen.queryByRole("button", { name: "mergeDownload" }),
    ).not.toBeInTheDocument();

    const input = document.getElementById(
      "merge-csv-input",
    ) as HTMLInputElement;
    const f1 = new File(["A,B\n1,2"], "one.csv", { type: "text/csv" });
    await act(async () => {
      setInputFiles(input, [f1]);
    });

    const mergeBtn = await screen.findByRole("button", { name: "mergeDownload" });
    expect(mergeBtn).toBeDisabled();

    const f2 = new File(["A,B\n3,4"], "two.csv", { type: "text/csv" });
    await act(async () => {
      setInputFiles(input, [f2]);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "mergeDownload" }),
      ).toBeEnabled();
    });
  });

  it("calls downloadBlob with merged csv after merge", async () => {
    render(<MergeCsvApp />);
    const input = document.getElementById(
      "merge-csv-input",
    ) as HTMLInputElement;
    const f1 = new File(["Name,V\na,1"], "first.csv", { type: "text/csv" });
    const f2 = new File(["Name,V\nb,2"], "second.csv", { type: "text/csv" });

    await act(async () => {
      setInputFiles(input, [f1, f2]);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "mergeDownload" }),
      ).toBeEnabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "mergeDownload" }));
    });

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });

    const call = downloadBlob.mock.calls[0];
    expect(call).toBeDefined();
    const [blob, filename] = call as [Blob, string];
    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toBe("first-merged.csv");
  });

  it("renders merge settings checkboxes after files are queued", async () => {
    render(<MergeCsvApp />);
    const input = document.getElementById(
      "merge-csv-input",
    ) as HTMLInputElement;
    await act(async () => {
      setInputFiles(input, [
        new File(["a\n1"], "a.csv", { type: "text/csv" }),
        new File(["a\n2"], "b.csv", { type: "text/csv" }),
      ]);
    });

    await screen.findByRole("button", { name: "mergeDownload" });

    expect(
      document.getElementById("merge-csv-skip-repeat-header"),
    ).toBeInTheDocument();
    expect(document.getElementById("merge-csv-dedupe-rows")).toBeInTheDocument();
    expect(document.getElementById("merge-csv-dedupe-cols")).toBeInTheDocument();
    expect(document.getElementById("merge-csv-add-index")).toBeInTheDocument();
  });
});

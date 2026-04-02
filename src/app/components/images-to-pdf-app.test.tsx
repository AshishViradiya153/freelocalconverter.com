import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImagesToPdfApp } from "@/app/components/images-to-pdf-app";
import { setInputFiles } from "@/lib/test/dom-file-input";

const downloadBlob = vi.fn();
const { imagesToPdf } = vi.hoisted(() => ({ imagesToPdf: vi.fn() }));

vi.mock("@/lib/download-blob", () => ({
  downloadBlob: (...args: unknown[]) => downloadBlob(...args),
}));

vi.mock("@/lib/pdf/images-to-pdf", () => ({
  imagesToPdf: (...args: unknown[]) => imagesToPdf(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    message: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/** 1×1 PNG */
const tinyPng = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

describe("ImagesToPdfApp", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("enables convert after one image and calls downloadBlob", async () => {
    imagesToPdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

    render(<ImagesToPdfApp />);
    const input = document.getElementById(
      "images-to-pdf-input",
    ) as HTMLInputElement;

    await act(async () => {
      setInputFiles(input, [
        new File([tinyPng], "shot.png", { type: "image/png" }),
      ]);
    });

    const btn = await screen.findByRole("button", {
      name: "Convert & download PDF",
    });
    expect(btn).toBeEnabled();

    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });
    expect(imagesToPdf).toHaveBeenCalledTimes(1);

    const call = downloadBlob.mock.calls[0];
    expect(call).toBeDefined();
    const [, filename] = call as [Blob, string];
    expect(filename).toBe("shot.pdf");
  });

  it("shows sortable list with reorder controls after two images", async () => {
    imagesToPdf.mockResolvedValue(new Uint8Array([1]));

    render(<ImagesToPdfApp />);
    const input = document.getElementById(
      "images-to-pdf-input",
    ) as HTMLInputElement;

    await act(async () => {
      setInputFiles(input, [
        new File([tinyPng], "a.png", { type: "image/png" }),
        new File([tinyPng], "b.png", { type: "image/png" }),
      ]);
    });

    await screen.findByRole("list", { name: "Image page order" });
    expect(
      screen.getByRole("button", { name: "Drag to reorder a.png" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Up" }).length).toBeGreaterThan(
      0,
    );
  });
});

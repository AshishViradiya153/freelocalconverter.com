import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GifToolsApp } from "@/app/components/gif-tools-app";
import { setInputFiles } from "@/lib/test/dom-file-input";

vi.mock("@/lib/download-blob", () => ({
  downloadBlob: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    message: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, unknown>) => {
      if (values && typeof values === "object" && "name" in values) {
        return `${key}:${String(values.name)}`;
      }
      if (values && typeof values === "object" && "count" in values) {
        return `${key}:${String(values.count)}`;
      }
      if (values && typeof values === "object" && "size" in values) {
        return `${key}:${String(values.size)}`;
      }
      return key;
    },
}));

/** 1×1 PNG */
const tinyPng = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

describe("GifToolsApp", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows sequence sortable list after switching mode and adding images", async () => {
    render(<GifToolsApp />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "modeSequenceLabel" }));
    });

    const input = document.getElementById(
      "gif-tools-seq-input",
    ) as HTMLInputElement;

    await act(async () => {
      setInputFiles(input, [
        new File([tinyPng], "frame-a.png", { type: "image/png" }),
        new File([tinyPng], "frame-b.png", { type: "image/png" }),
      ]);
    });

    await screen.findByRole("list", { name: "sequenceListAria" });
    expect(
      screen.getByRole("button", {
        name: "sequenceDragReorderAria:frame-a.png",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Up" }).length).toBeGreaterThan(
      0,
    );
  });
});

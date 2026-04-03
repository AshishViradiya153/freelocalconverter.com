import { fireEvent } from "@testing-library/react";

/** JSDOM has no `DataTransfer` on `File` inputs; mimic a `FileList` for tests. */
export function createFileList(files: File[]): FileList {
  const list = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    *[Symbol.iterator]() {
      for (const f of files) yield f;
    },
  };
  return list as unknown as FileList;
}

export function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    value: createFileList(files),
    configurable: true,
    writable: false,
  });
  fireEvent.change(input);
}

"use client";

import * as React from "react";

import { ImageConvertApp } from "@/app/components/image-convert-app";

export function HeicToJpgApp() {
  return (
    <ImageConvertApp
      title="HEIC to JPG/PNG"
      subtitle="Convert iPhone HEIC/HEIF photos to JPG or PNG locally in your browser. Bulk add files and download converted outputs, no uploads."
      inputId="heic-to-jpg-input"
      accept="image/heic,image/heif,.heic,.heif"
      dropTitleEmpty="Drop HEIC/HEIF photos here or click to browse"
      dropTitleHasItems="Drop more HEIC/HEIF photos or click to add"
      dropHint="Bulk queue · HEIC/HEIF → JPG/PNG · local-only conversion"
      fileHint="Bulk add: HEIC, HEIF. Output: JPG or PNG. Everything stays on this device."
      allowedFormats={["jpeg", "png"]}
      initialFormat="jpeg"
      initialEngine="browser"
    />
  );
}


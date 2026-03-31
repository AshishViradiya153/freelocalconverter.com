import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AudioConvertApp } from "@/app/components/audio-convert-app";
import { Shell } from "@/components/shell";
import { buildToolPageMetadata } from "@/lib/seo/tool-page-metadata";

export async function generateMetadata({
  params,
}: YoutubeToMp3PageProps): Promise<Metadata> {
  const { locale } = await params;
  return await buildToolPageMetadata(locale, "youtube-to-mp3");
}

interface YoutubeToMp3PageProps {
  params: Promise<{ locale: string }>;
}

export default async function YoutubeToMp3Page({ params }: YoutubeToMp3PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Shell>
      <Suspense
        fallback={
          <div className="container flex flex-col gap-4 py-4">
            <div className="h-10 w-[min(520px,100%)] animate-pulse rounded-md bg-muted/40" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-muted/30" />
            <div className="h-[380px] w-full animate-pulse rounded-xl bg-muted/20" />
          </div>
        }
      >
        <AudioConvertApp
          title="YouTube to MP3 converter"
          allowUrlInput
          subtitle="Paste a direct MP4/WebM URL (or add a video file you already have). We extract MP3 locally in your browser (no uploads to our servers). If the site blocks browser downloads (CORS), download the file first and upload it instead."
          inputId="youtube-to-mp3-input"
          guideLinks={[
            {
              href: "/blog/how-to-convert-youtube-to-mp3",
              label: "how to convert YouTube to MP3",
            },
          ]}
        />
      </Suspense>
    </Shell>
  );
}

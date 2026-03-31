"use client";

import { Archive, Download, FileArchive } from "lucide-react";
import { zipSync } from "fflate";
import * as React from "react";
import { toast } from "sonner";

import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
} from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob } from "@/lib/download-blob";

async function readFileBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

function safeZipLeafName(name: string): string {
  const leaf = name.split("/").pop()?.split("\\").pop() ?? name;
  const cleaned = leaf.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 200);
  return cleaned || "file";
}

export function ArchiveConverterApp() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [zipName, setZipName] = React.useState("archive.zip");
  const [isBuilding, setIsBuilding] = React.useState(false);

  const canDownload = files.length > 0 && !isBuilding;

  const onDownloadZip = React.useCallback(async () => {
    if (!files.length) return;
    setIsBuilding(true);
    try {
      const entries: Record<string, Uint8Array> = {};
      for (const file of files) {
        const bytes = await readFileBytes(file);
        let leaf = safeZipLeafName(file.name);
        let candidate = leaf;
        let i = 2;
        while (entries[candidate]) {
          candidate = `${leaf} (${i})`;
          i += 1;
        }
        entries[candidate] = bytes;
      }

      const zipBytes = zipSync(entries, { level: 6 });
      const blob = new Blob([zipBytes as unknown as BlobPart], {
        type: "application/zip",
      });
      const filename = zipName.trim().toLowerCase().endsWith(".zip")
        ? zipName.trim()
        : `${zipName.trim()}.zip`;
      downloadBlob(blob, filename || "archive.zip");
      toast.success("ZIP ready");
    } catch (e) {
      console.log({ e });
      toast.error("Could not build ZIP");
    } finally {
      setIsBuilding(false);
    }
  }, [files, zipName]);

  return (
    <ToolPage>
      <ToolHero
        icon={<Archive className="size-8" aria-hidden />}
        title="Archive Converter"
        description="Create a ZIP from files locally in your browser (no uploads)."
      />

      <ToolCard className="flex flex-col gap-4">
        <ToolPane>
          <ToolPaneTitle>Files</ToolPaneTitle>
          <div className="flex flex-col gap-3">
            <Label htmlFor="archive-files">Select files</Label>
            <Input
              id="archive-files"
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <p className="text-muted-foreground text-sm">
              {files.length ? `${files.length} file(s) selected` : "No files selected."}
            </p>
          </div>
        </ToolPane>

        <ToolPane>
          <ToolPaneTitle>Download</ToolPaneTitle>
          <div className="flex flex-col gap-3">
            <Label htmlFor="archive-zip-name">ZIP filename</Label>
            <Input
              id="archive-zip-name"
              value={zipName}
              onChange={(e) => setZipName(e.target.value)}
              placeholder="archive.zip"
              autoComplete="off"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={onDownloadZip} disabled={!canDownload}>
                <Download className="size-4" aria-hidden />
                {isBuilding ? "Building…" : "Download ZIP"}
              </Button>
              <p className="text-muted-foreground text-sm">
                {files.length ? (
                  <span className="inline-flex items-center gap-2">
                    <FileArchive className="size-4" aria-hidden />
                    Contents are created locally.
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </ToolPane>
      </ToolCard>
    </ToolPage>
  );
}


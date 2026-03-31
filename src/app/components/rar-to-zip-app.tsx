"use client";

import { Archive, Download, Info } from "lucide-react";
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

export function RarToZipApp() {
  const [rarFile, setRarFile] = React.useState<File | null>(null);
  const [isBuilding, setIsBuilding] = React.useState(false);

  const onDownloadZip = React.useCallback(async () => {
    if (!rarFile) return;
    setIsBuilding(true);
    try {
      const bytes = await readFileBytes(rarFile);
      const zipBytes = zipSync({ [rarFile.name]: bytes }, { level: 6 });
      const blob = new Blob([zipBytes as unknown as BlobPart], {
        type: "application/zip",
      });
      const base = rarFile.name.replace(/\.[a-z0-9]+$/i, "") || "archive";
      downloadBlob(blob, `${base}.zip`);
      toast.success("ZIP ready");
    } catch (e) {
      console.log({ e });
      toast.error("Could not build ZIP");
    } finally {
      setIsBuilding(false);
    }
  }, [rarFile]);

  return (
    <ToolPage>
      <ToolHero
        icon={<Archive className="size-8" aria-hidden />}
        title="RAR to Zip"
        description="Wrap a .rar file into a .zip locally (no uploads)."
      />

      <ToolCard className="flex flex-col gap-4">
        <ToolPane>
          <ToolPaneTitle>RAR file</ToolPaneTitle>
          <div className="flex flex-col gap-3">
            <Label htmlFor="rar-input">Select a .rar file</Label>
            <Input
              id="rar-input"
              type="file"
              accept=".rar"
              onChange={(e) => setRarFile((e.target.files ?? [])[0] ?? null)}
            />
            <div className="rounded-md border bg-muted/20 p-3 text-muted-foreground text-sm">
              <p className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                This tool does <strong>not</strong> extract RAR contents (RAR decompression
                requires dedicated libraries). It packages your RAR file inside a ZIP container.
              </p>
            </div>
          </div>
        </ToolPane>

        <ToolPane>
          <ToolPaneTitle>Download</ToolPaneTitle>
          <Button
            type="button"
            onClick={onDownloadZip}
            disabled={!rarFile || isBuilding}
          >
            <Download className="size-4" aria-hidden />
            {isBuilding ? "Building…" : "Download ZIP"}
          </Button>
        </ToolPane>
      </ToolCard>
    </ToolPage>
  );
}


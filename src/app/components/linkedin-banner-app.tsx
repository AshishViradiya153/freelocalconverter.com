"use client";

import {
  Download,
  ImagePlus,
  Settings2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download-blob";
import {
  type BannerDesignInput,
  type BannerFontFamilyId,
  type BannerFormatId,
  type BannerGradientPresetId,
  type BannerTemplateId,
  type BannerTemplateTweakKey,
  type BannerTemplateTweaks,
  type BannerTextFontStyle,
  DEFAULT_BANNER_TEMPLATE_TWEAKS,
  DEFAULT_HEADLINE_FONT,
  DEFAULT_SUB_FONT,
  DEFAULT_TAG_FONT,
  findLinkedInBannerGradientPreset,
  LINKEDIN_BANNER_FONT_FAMILY_LABELS,
  LINKEDIN_BANNER_FONT_FAMILY_ORDER,
  LINKEDIN_BANNER_FORMAT_ORDER,
  LINKEDIN_BANNER_FORMATS,
  LINKEDIN_BANNER_GRADIENT_PRESETS,
  LINKEDIN_BANNER_TEMPLATE_GROUPS,
  LINKEDIN_BANNER_TEMPLATE_LABELS,
  renderLinkedInBannerCanvas,
} from "@/lib/linkedin-banner/render-banner";
import { cn } from "@/lib/utils";

interface EditorState extends BannerDesignInput {
  formatId: BannerFormatId;
  /** Which curated gradient is active, or `custom` for manual A/B/angle. */
  gradientPresetId: BannerGradientPresetId;
}

const initialEditorState: EditorState = {
  formatId: "profileCover",
  templateId: "hero",
  headline: "Your name or brand",
  subheadline: "Short line about what you do — role, focus, or motto.",
  tag: "Open to opportunities",
  colorA: "#1d4ed8",
  colorB: "#7c3aed",
  solidColor: "#0f172a",
  backgroundMode: "gradient",
  angleDeg: 118,
  textColorMode: "auto",
  customTextColor: "#f8fafc",
  showGrid: false,
  noiseOpacity: 0.1,
  tagFont: { ...DEFAULT_TAG_FONT },
  headlineFont: { ...DEFAULT_HEADLINE_FONT },
  subheadlineFont: { ...DEFAULT_SUB_FONT },
  gradientPresetId: "indigoViolet",
  templateTweaks: { ...DEFAULT_BANNER_TEMPLATE_TWEAKS },
};

type EditorAction =
  | { type: "patch"; patch: Partial<EditorState> }
  | {
    type: "patchFont";
    field: "tagFont" | "headlineFont" | "subheadlineFont";
    partial: Partial<BannerTextFontStyle>;
  }
  | { type: "patchTweak"; key: BannerTemplateTweakKey; value: number };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === "patch") return { ...state, ...action.patch };
  if (action.type === "patchFont") {
    const cur = state[action.field];
    return {
      ...state,
      [action.field]: { ...cur, ...action.partial },
    };
  }
  if (action.type === "patchTweak") {
    return {
      ...state,
      templateTweaks: {
        ...state.templateTweaks,
        [action.key]: action.value,
      },
    };
  }
  return state;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: "image/png" | "image/jpeg" | "image/webp",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export image."))),
      mime,
      quality,
    );
  });
}

function designSlice(state: EditorState): BannerDesignInput {
  const {
    formatId: _f,
    templateId,
    headline,
    subheadline,
    tag,
    tagFont,
    headlineFont,
    subheadlineFont,
    colorA,
    colorB,
    solidColor,
    backgroundMode,
    angleDeg,
    textColorMode,
    customTextColor,
    showGrid,
    noiseOpacity,
    templateTweaks,
  } = state;
  return {
    templateId,
    headline,
    subheadline,
    tag,
    tagFont,
    headlineFont,
    subheadlineFont,
    colorA,
    colorB,
    solidColor,
    backgroundMode,
    angleDeg,
    textColorMode,
    customTextColor,
    showGrid,
    noiseOpacity,
    templateTweaks,
  };
}

interface TextFontSettingsPopoverProps {
  id: string;
  ariaLabel: string;
  field: "tagFont" | "headlineFont" | "subheadlineFont";
  style: BannerTextFontStyle;
  dispatch: React.Dispatch<EditorAction>;
}

function TextFontSettingsPopover(props: TextFontSettingsPopoverProps) {
  const { id, ariaLabel, field, style, dispatch } = props;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={ariaLabel}
        >
          <Settings2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex flex-col gap-4">
          <p className="font-medium text-sm">Font settings</p>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-family`}>Family</Label>
            <Select
              value={style.familyId}
              onValueChange={(v) =>
                dispatch({
                  type: "patchFont",
                  field,
                  partial: { familyId: v as BannerFontFamilyId },
                })
              }
            >
              <SelectTrigger id={`${id}-family`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINKEDIN_BANNER_FONT_FAMILY_ORDER.map((fid) => (
                  <SelectItem key={fid} value={fid}>
                    {LINKEDIN_BANNER_FONT_FAMILY_LABELS[fid]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-weight`}>Weight</Label>
            <Select
              value={String(style.weight)}
              onValueChange={(v) =>
                dispatch({
                  type: "patchFont",
                  field,
                  partial: {
                    weight: Number(v) as BannerTextFontStyle["weight"],
                  },
                })
              }
            >
              <SelectTrigger id={`${id}-weight`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="400">Regular (400)</SelectItem>
                <SelectItem value="500">Medium (500)</SelectItem>
                <SelectItem value="600">Semibold (600)</SelectItem>
                <SelectItem value="700">Bold (700)</SelectItem>
                <SelectItem value="800">Extra bold (800)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-size`}>Size</Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {style.sizePercent}%
              </span>
            </div>
            <Slider
              id={`${id}-size`}
              min={50}
              max={200}
              step={1}
              value={[style.sizePercent]}
              onValueChange={([v]) =>
                dispatch({
                  type: "patchFont",
                  field,
                  partial: { sizePercent: v ?? 100 },
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-ls`}>Letter spacing</Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {style.letterSpacingPx}px
              </span>
            </div>
            <Slider
              id={`${id}-ls`}
              min={-2}
              max={12}
              step={0.5}
              value={[style.letterSpacingPx]}
              onValueChange={([v]) =>
                dispatch({
                  type: "patchFont",
                  field,
                  partial: { letterSpacingPx: v ?? 0 },
                })
              }
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TWEAK_ROWS_BY_TEMPLATE: Record<
  BannerTemplateId,
  readonly {
    key: BannerTemplateTweakKey;
    label: string;
    min: number;
    max: number;
    step: number;
  }[]
> = {
  hero: [],
  minimal: [
    {
      key: "centerTextWidthPercent",
      label: "Center text width",
      min: 58,
      max: 82,
      step: 1,
    },
  ],
  split: [
    {
      key: "splitLeftPercent",
      label: "Left column width",
      min: 30,
      max: 48,
      step: 1,
    },
  ],
  editorial: [
    {
      key: "editorialBarScale",
      label: "Accent bar thickness",
      min: 0.65,
      max: 1.85,
      step: 0.05,
    },
  ],
  diagonalSlash: [
    {
      key: "diagonalTipPercent",
      label: "Diagonal reach",
      min: 44,
      max: 64,
      step: 1,
    },
    {
      key: "diagonalShade",
      label: "Overlay strength",
      min: 0.12,
      max: 0.42,
      step: 0.01,
    },
    {
      key: "diagonalColumnStartPercent",
      label: "Text column start",
      min: 34,
      max: 54,
      step: 1,
    },
  ],
  spotlight: [
    {
      key: "spotlightInnerPercent",
      label: "Bright center size",
      min: 3,
      max: 14,
      step: 1,
    },
    {
      key: "spotlightMid",
      label: "Mid vignette",
      min: 0.08,
      max: 0.34,
      step: 0.01,
    },
    {
      key: "spotlightEdge",
      label: "Edge darkness",
      min: 0.35,
      max: 0.78,
      step: 0.01,
    },
  ],
  ledger: [
    {
      key: "ledgerRowDivisor",
      label: "Line density",
      min: 5,
      max: 11,
      step: 1,
    },
    {
      key: "ledgerMarginPercent",
      label: "Left margin",
      min: 5,
      max: 11,
      step: 1,
    },
  ],
  frame: [
    {
      key: "frameInsetScale",
      label: "Frame inset",
      min: 0.72,
      max: 1.38,
      step: 0.02,
    },
    {
      key: "centerTextWidthPercent",
      label: "Type block width",
      min: 58,
      max: 82,
      step: 1,
    },
  ],
  orbit: [
    {
      key: "orbitRadiusScale",
      label: "Arc size",
      min: 0.82,
      max: 1.18,
      step: 0.02,
    },
    {
      key: "orbitStrokeOpacity",
      label: "Arc visibility",
      min: 0.12,
      max: 0.42,
      step: 0.01,
    },
    {
      key: "orbitColumnPercent",
      label: "Text column width",
      min: 30,
      max: 42,
      step: 1,
    },
  ],
  brutalist: [
    {
      key: "brutalistBarPercent",
      label: "Bottom band height",
      min: 10,
      max: 22,
      step: 1,
    },
  ],
};

function formatTweakDisplay(step: number, value: number): string {
  if (step >= 1) return String(Math.round(value));
  return value.toFixed(2);
}

interface TemplateLayoutTweaksPanelProps {
  templateId: BannerTemplateId;
  tweaks: BannerTemplateTweaks;
  dispatch: React.Dispatch<EditorAction>;
}

function TemplateLayoutTweaksPanel(props: TemplateLayoutTweaksPanelProps) {
  const { templateId, tweaks, dispatch } = props;
  const rows = TWEAK_ROWS_BY_TEMPLATE[templateId];

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border/80 border-dashed bg-muted/15 px-3 py-2.5">
        <p className="text-muted-foreground text-xs leading-relaxed">
          This template uses a full-width layout. Pick another template for
          extra layout sliders (columns, frames, arcs, etc.).
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-lg border border-border/80 bg-muted/15 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-sm">Layout (live)</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            dispatch({
              type: "patch",
              patch: { templateTweaks: { ...DEFAULT_BANNER_TEMPLATE_TWEAKS } },
            })
          }
        >
          Reset layout
        </Button>
      </div>
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`li-tweak-${row.key}`}>{row.label}</Label>
            <span className="text-muted-foreground text-xs tabular-nums">
              {formatTweakDisplay(row.step, tweaks[row.key])}
            </span>
          </div>
          <Slider
            id={`li-tweak-${row.key}`}
            min={row.min}
            max={row.max}
            step={row.step}
            value={[tweaks[row.key]]}
            onValueChange={([v]) =>
              dispatch({
                type: "patchTweak",
                key: row.key,
                value: v ?? row.min,
              })
            }
          />
        </div>
      ))}
    </div>
  );
}

export function LinkedInBannerApp() {
  const [state, dispatch] = React.useReducer(editorReducer, initialEditorState);
  const [exportFmt, setExportFmt] = React.useState<"png" | "jpeg" | "webp">(
    "png",
  );
  const [exportQuality, setExportQuality] = React.useState(90);
  const [logoBitmap, setLogoBitmap] = React.useState<ImageBitmap | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const previewRef = React.useRef<HTMLCanvasElement>(null);
  const previewWrapRef = React.useRef<HTMLDivElement>(null);
  /** Inner width of the preview panel (minus padding), used to size the canvas up to full format width. */
  const [previewSlotPx, setPreviewSlotPx] = React.useState(1200);

  React.useLayoutEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    function measure() {
      const w = el?.getBoundingClientRect()?.width ?? 0;
      setPreviewSlotPx(Math.max(280, Math.floor(w)));
    }
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    return () => {
      logoBitmap?.close();
    };
  }, [logoBitmap]);

  const onLogoFiles = React.useCallback(async (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file for the logo.");
      return;
    }
    try {
      const bmp = await createImageBitmap(file);
      setLogoBitmap((prev) => {
        prev?.close();
        return bmp;
      });
      toast.success("Logo added");
    } catch {
      toast.error("Could not read that image.");
    }
  }, []);

  const design = React.useMemo(() => designSlice(state), [state]);

  React.useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const fmt = LINKEDIN_BANNER_FORMATS[state.formatId];
    const innerPad = 24;
    const available = Math.max(280, previewSlotPx - innerPad);
    const targetW = Math.min(fmt.width, available);
    const scale = targetW / fmt.width;
    const pw = Math.round(fmt.width * scale);
    const ph = Math.round(fmt.height * scale);
    const rendered = renderLinkedInBannerCanvas({
      width: pw,
      height: ph,
      design,
      logo: logoBitmap,
    });
    el.width = pw;
    el.height = ph;
    const ctx = el.getContext("2d");
    if (ctx) ctx.drawImage(rendered, 0, 0);
  }, [state.formatId, design, logoBitmap, previewSlotPx]);

  const onDownload = React.useCallback(async () => {
    const fmt = LINKEDIN_BANNER_FORMATS[state.formatId];
    try {
      const canvas = renderLinkedInBannerCanvas({
        width: fmt.width,
        height: fmt.height,
        design,
        logo: logoBitmap,
      });
      const q = exportQuality / 100;
      let blob: Blob;
      let ext: string;
      if (exportFmt === "png") {
        blob = await canvasToBlob(canvas, "image/png");
        ext = "png";
      } else if (exportFmt === "jpeg") {
        blob = await canvasToBlob(canvas, "image/jpeg", q);
        ext = "jpg";
      } else {
        blob = await canvasToBlob(canvas, "image/webp", q);
        ext = "webp";
      }
      downloadBlob(blob, `linkedin-banner-${fmt.width}x${fmt.height}.${ext}`);
      toast.success("Download started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }, [state.formatId, design, logoBitmap, exportFmt, exportQuality]);

  const fmtMeta = LINKEDIN_BANNER_FORMATS[state.formatId];

  return (
    <div className="container flex max-w-[min(100%,96rem)] flex-col gap-8 py-6 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
          LinkedIn banner maker
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
          Pick a LinkedIn-friendly size, choose a layout, set colors and copy,
          then download a PNG, JPEG, or WebP you can upload as your profile or
          page background. Everything runs in your browser.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6 rounded-xl border border-border/80 bg-card/30 p-4 shadow-xs md:p-6">
          <section className="flex flex-col gap-3">
            <h2 className="font-medium text-sm">Format</h2>
            <Select
              value={state.formatId}
              onValueChange={(v) =>
                dispatch({
                  type: "patch",
                  patch: { formatId: v as BannerFormatId },
                })
              }
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINKEDIN_BANNER_FORMAT_ORDER.map((id) => {
                  const f = LINKEDIN_BANNER_FORMATS[id];
                  return (
                    <SelectItem key={id} value={id}>
                      {f.label} ({f.width}×{f.height})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {fmtMeta.hint}
            </p>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h2 className="font-medium text-sm">Template</h2>
            <Select
              value={state.templateId}
              onValueChange={(v) =>
                dispatch({
                  type: "patch",
                  patch: { templateId: v as BannerTemplateId },
                })
              }
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINKEDIN_BANNER_TEMPLATE_GROUPS.map((g) => (
                  <SelectGroup key={g.label}>
                    <SelectLabel>{g.label}</SelectLabel>
                    {g.ids.map((id) => (
                      <SelectItem key={id} value={id}>
                        {LINKEDIN_BANNER_TEMPLATE_LABELS[id]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <p className="max-w-md text-muted-foreground text-xs leading-relaxed">
              Classic layouts read formal; modern ones add shape, light, or
              structure; minimal keeps the focus on type.
            </p>
            <TemplateLayoutTweaksPanel
              templateId={state.templateId}
              tweaks={state.templateTweaks}
              dispatch={dispatch}
            />
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <h2 className="font-medium text-sm">Content</h2>
            <div className="flex flex-col gap-2">
              <Label htmlFor="li-banner-tag">Tag</Label>
              <div className="flex max-w-lg items-start gap-2">
                <Input
                  id="li-banner-tag"
                  value={state.tag}
                  onChange={(e) =>
                    dispatch({ type: "patch", patch: { tag: e.target.value } })
                  }
                  placeholder="e.g. Hiring, Product, Newsletter"
                  className="min-w-0 flex-1"
                />
                <TextFontSettingsPopover
                  id="li-tag-font"
                  ariaLabel="Tag font settings"
                  field="tagFont"
                  style={state.tagFont}
                  dispatch={dispatch}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="li-banner-headline">Headline</Label>
              <div className="flex max-w-lg items-start gap-2">
                <Input
                  id="li-banner-headline"
                  value={state.headline}
                  onChange={(e) =>
                    dispatch({
                      type: "patch",
                      patch: { headline: e.target.value },
                    })
                  }
                  className="min-w-0 flex-1"
                />
                <TextFontSettingsPopover
                  id="li-headline-font"
                  ariaLabel="Headline font settings"
                  field="headlineFont"
                  style={state.headlineFont}
                  dispatch={dispatch}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="li-banner-sub">Subheadline</Label>
              <div className="flex max-w-lg items-start gap-2">
                <Textarea
                  id="li-banner-sub"
                  value={state.subheadline}
                  onChange={(e) =>
                    dispatch({
                      type: "patch",
                      patch: { subheadline: e.target.value },
                    })
                  }
                  rows={3}
                  className="min-w-0 flex-1 resize-y"
                />
                <TextFontSettingsPopover
                  id="li-sub-font"
                  ariaLabel="Subheadline font settings"
                  field="subheadlineFont"
                  style={state.subheadlineFont}
                  dispatch={dispatch}
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <h2 className="font-medium text-sm">Background</h2>
            <div className="flex flex-col gap-2">
              <Label>Style</Label>
              <Select
                value={state.backgroundMode}
                onValueChange={(v) =>
                  dispatch({
                    type: "patch",
                    patch: { backgroundMode: v as "gradient" | "solid" },
                  })
                }
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="solid">Solid color</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state.backgroundMode === "gradient" ? (
              <div className="flex max-w-lg flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label id="li-gradient-presets-label">Gradient</Label>
                  <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    role="group"
                    aria-labelledby="li-gradient-presets-label"
                  >
                    {LINKEDIN_BANNER_GRADIENT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "patch",
                            patch: {
                              gradientPresetId: p.id,
                              colorA: p.colorA,
                              colorB: p.colorB,
                              angleDeg: p.angleDeg,
                            },
                          })
                        }
                        className={cn(
                          "relative h-14 w-full shrink-0 rounded-lg border-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          state.gradientPresetId === p.id
                            ? "border-primary shadow-md ring-2 ring-primary/25"
                            : "border-border/60 hover:border-border",
                        )}
                        style={{
                          backgroundImage: `linear-gradient(${p.angleDeg}deg, ${p.colorA}, ${p.colorB})`,
                        }}
                        title={p.label}
                        aria-label={p.label}
                        aria-pressed={state.gradientPresetId === p.id}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "patch",
                          patch: { gradientPresetId: "custom" },
                        })
                      }
                      className={cn(
                        "flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-muted-foreground text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        state.gradientPresetId === "custom"
                          ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/25"
                          : "border-border/80 bg-muted/40 hover:bg-muted/60 hover:text-foreground",
                      )}
                      aria-label="Custom gradient colors and angle"
                      aria-pressed={state.gradientPresetId === "custom"}
                    >
                      <SlidersHorizontal className="size-4" aria-hidden />
                      <span>Custom</span>
                    </button>
                  </div>
                  {state.gradientPresetId !== "custom" ? (
                    <p className="text-muted-foreground text-xs">
                      {
                        findLinkedInBannerGradientPreset(state.gradientPresetId)
                          ?.label
                      }
                    </p>
                  ) : null}
                </div>
                {state.gradientPresetId === "custom" ? (
                  <div className="flex flex-col gap-4 rounded-lg border border-border/80 bg-muted/20 p-3">
                    <p className="text-muted-foreground text-xs">
                      Pick two colors and an angle for a custom gradient.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="li-color-a">Color A</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="li-color-a"
                            type="color"
                            value={state.colorA}
                            onChange={(e) =>
                              dispatch({
                                type: "patch",
                                patch: {
                                  gradientPresetId: "custom",
                                  colorA: e.target.value,
                                },
                              })
                            }
                            className="size-9 cursor-pointer rounded-md border border-input bg-background"
                            aria-label="Gradient color A"
                          />
                          <Input
                            value={state.colorA}
                            onChange={(e) =>
                              dispatch({
                                type: "patch",
                                patch: {
                                  gradientPresetId: "custom",
                                  colorA: e.target.value,
                                },
                              })
                            }
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="li-color-b">Color B</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="li-color-b"
                            type="color"
                            value={state.colorB}
                            onChange={(e) =>
                              dispatch({
                                type: "patch",
                                patch: {
                                  gradientPresetId: "custom",
                                  colorB: e.target.value,
                                },
                              })
                            }
                            className="size-9 cursor-pointer rounded-md border border-input bg-background"
                            aria-label="Gradient color B"
                          />
                          <Input
                            value={state.colorB}
                            onChange={(e) =>
                              dispatch({
                                type: "patch",
                                patch: {
                                  gradientPresetId: "custom",
                                  colorB: e.target.value,
                                },
                              })
                            }
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="li-angle">Angle</Label>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {state.angleDeg}°
                        </span>
                      </div>
                      <Slider
                        id="li-angle"
                        min={0}
                        max={360}
                        step={1}
                        value={[state.angleDeg]}
                        onValueChange={([v]) =>
                          dispatch({
                            type: "patch",
                            patch: {
                              gradientPresetId: "custom",
                              angleDeg: v ?? 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex max-w-xs flex-col gap-2">
                <Label htmlFor="li-solid">Solid color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="li-solid"
                    type="color"
                    value={state.solidColor}
                    onChange={(e) =>
                      dispatch({
                        type: "patch",
                        patch: { solidColor: e.target.value },
                      })
                    }
                    className="size-9 cursor-pointer rounded-md border border-input bg-background"
                    aria-label="Solid background color"
                  />
                  <Input
                    value={state.solidColor}
                    onChange={(e) =>
                      dispatch({
                        type: "patch",
                        patch: { solidColor: e.target.value },
                      })
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <h2 className="font-medium text-sm">Text & texture</h2>
            <div className="flex flex-col gap-2">
              <Label>Text contrast</Label>
              <Select
                value={state.textColorMode}
                onValueChange={(v) =>
                  dispatch({
                    type: "patch",
                    patch: { textColorMode: v as "auto" | "custom" },
                  })
                }
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto (pick light or dark)
                  </SelectItem>
                  <SelectItem value="custom">Custom color</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state.textColorMode === "custom" ? (
              <div className="flex max-w-xs flex-col gap-2">
                <Label htmlFor="li-text-custom">Text color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="li-text-custom"
                    type="color"
                    value={state.customTextColor}
                    onChange={(e) =>
                      dispatch({
                        type: "patch",
                        patch: { customTextColor: e.target.value },
                      })
                    }
                    className="size-9 cursor-pointer rounded-md border border-input bg-background"
                    aria-label="Custom text color"
                  />
                  <Input
                    value={state.customTextColor}
                    onChange={(e) =>
                      dispatch({
                        type: "patch",
                        patch: { customTextColor: e.target.value },
                      })
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="li-noise">Film noise</Label>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {state.noiseOpacity.toFixed(2)}
                </span>
              </div>
              <Slider
                id="li-noise"
                min={0}
                max={0.35}
                step={0.01}
                value={[state.noiseOpacity]}
                onValueChange={([v]) =>
                  dispatch({ type: "patch", patch: { noiseOpacity: v ?? 0 } })
                }
                className="max-w-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="li-grid"
                checked={state.showGrid}
                onCheckedChange={(c) =>
                  dispatch({ type: "patch", patch: { showGrid: c === true } })
                }
              />
              <Label
                htmlFor="li-grid"
                className="font-normal text-sm leading-none"
              >
                Grid overlay
              </Label>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h2 className="font-medium text-sm">Logo (optional)</h2>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void onLogoFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => logoInputRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                Upload logo
              </Button>
              {logoBitmap ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive"
                  onClick={() => {
                    setLogoBitmap((prev) => {
                      prev?.close();
                      return null;
                    });
                    toast.message("Logo removed");
                  }}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6">
          <div className="flex flex-col gap-3">
            <h2 className="font-medium text-sm">Preview</h2>
            <div
              ref={previewWrapRef}
              className={cn(
                "w-full min-w-0 overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-4 shadow-inner",
              )}
            >
              <canvas
                ref={previewRef}
                className="mx-auto block h-auto max-w-full rounded-md border border-border/60 bg-background shadow-sm"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Preview fills this panel up to the real export size; download
              always uses the exact pixel dimensions for the format you chose.
            </p>
          </div>

          <section className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/30 p-4 shadow-xs md:p-5">
            <h2 className="font-medium text-sm">Export</h2>
            <div className="flex flex-col gap-2">
              <Label>File type</Label>
              <Select
                value={exportFmt}
                onValueChange={(v) =>
                  setExportFmt(v as "png" | "jpeg" | "webp")
                }
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (recommended)</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {exportFmt !== "png" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="li-quality">Quality</Label>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {exportQuality}%
                  </span>
                </div>
                <Slider
                  id="li-quality"
                  min={50}
                  max={100}
                  step={1}
                  value={[exportQuality]}
                  onValueChange={([v]) => setExportQuality(v ?? 90)}
                  className="w-full max-w-md"
                />
              </div>
            ) : null}
            <Button
              type="button"
              className="w-full max-w-sm gap-2 sm:max-w-none"
              onClick={() => void onDownload()}
            >
              <Download className="size-4" />
              Download image
            </Button>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Export matches the selected format at full resolution (
              {fmtMeta.width}×{fmtMeta.height}
              ). On LinkedIn, open your profile → camera icon on the banner →
              upload.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

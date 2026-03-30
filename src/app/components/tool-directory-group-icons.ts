import {
  ArrowRightLeft,
  Braces,
  FileImage,
  FileSpreadsheet,
  FileText,
  Palette,
  Sparkles,
  Star,
  TableProperties,
  Video,
} from "lucide-react";

export const toolDirectoryGroupIcons = {
  all: Sparkles,
  favorites: Star,
  converters: ArrowRightLeft,
  viewers: TableProperties,
  excel: FileSpreadsheet,
  developer: Braces,
  pdf: FileText,
  video: Video,
  image: FileImage,
  color: Palette,
} as const;

export type ToolDirectoryGroupId = keyof typeof toolDirectoryGroupIcons;

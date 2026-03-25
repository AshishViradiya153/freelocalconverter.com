import BestPalettesGrid from "./best-palettes-grid";
import { readBestPalettesAsync } from "@/lib/best-gallery/best-gallery-data";

export default async function BestPalettesContent({
  locale,
}: {
  locale: string;
}) {
  const palettes = await readBestPalettesAsync();
  return <BestPalettesGrid palettes={palettes} locale={locale} />;
}


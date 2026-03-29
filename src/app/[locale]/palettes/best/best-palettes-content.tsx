import { readBestPalettesAsync } from "@/lib/best-gallery/best-gallery-data";
import BestPalettesGrid from "./best-palettes-grid";

export default async function BestPalettesContent({
  locale,
}: {
  locale: string;
}) {
  const palettes = await readBestPalettesAsync();
  return <BestPalettesGrid palettes={palettes} locale={locale} />;
}

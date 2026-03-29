import { readBestGradientsAsync } from "@/lib/best-gallery/best-gallery-data";
import BestGradientsGrid from "./best-gradients-grid";

export default async function BestGradientsContent({
  locale,
}: {
  locale: string;
}) {
  const gradients = await readBestGradientsAsync();
  return <BestGradientsGrid gradients={gradients} locale={locale} />;
}

import { MeshGradientTrendingGrid } from "./mesh-gradient-trending-grid";
import { readTrendingMeshGradients } from "@/lib/mesh-gradient/trending-mesh-data";

export async function MeshGradientTrendingContent({
  openLabel,
  downloadLabel,
}: {
  openLabel: string;
  downloadLabel: string;
}) {
  const { items } = await readTrendingMeshGradients();
  return (
    <MeshGradientTrendingGrid
      items={items}
      openLabel={openLabel}
      downloadLabel={downloadLabel}
    />
  );
}

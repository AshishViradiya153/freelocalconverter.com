import { readTrendingMeshGradients } from "@/lib/mesh-gradient/trending-mesh-data";
import { MeshGradientTrendingGrid } from "./mesh-gradient-trending-grid";

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

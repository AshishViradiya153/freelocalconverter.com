import type { CircleProps } from "@/lib/mesh-gradient/types";

export function repositionCirclesAvoidOverlap(
  circles: CircleProps[],
  random: () => number = Math.random,
): CircleProps[] {
  return circles.map((circle, index) => {
    const overlapping = circles.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      const distance = Math.hypot(circle.cx - other.cx, circle.cy - other.cy);
      return distance < 20;
    });

    if (!overlapping) return circle;

    let attempts = 0;
    let newCx = circle.cx;
    let newCy = circle.cy;

    while (attempts < 10) {
      newCx = random() * 100;
      newCy = random() * 100;

      const hasOverlap = circles.some((other, otherIndex) => {
        if (index === otherIndex) return false;
        const distance = Math.hypot(newCx - other.cx, newCy - other.cy);
        return distance < 20;
      });

      if (!hasOverlap) break;
      attempts++;
    }

    return { ...circle, cx: newCx, cy: newCy };
  });
}

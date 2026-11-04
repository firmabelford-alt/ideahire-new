// Distinct snap positions: the last card must never leave an empty viewport.
export function projectScrollStops(offsets, maxScroll) {
  const limit = Math.max(0, Number(maxScroll) || 0);
  const origin = Number(offsets[0]) || 0;
  const stops = [0];
  for (const offset of offsets) {
    const next = Math.min(limit, Math.max(0, (Number(offset) || 0) - origin));
    if (next - stops[stops.length - 1] > 2) stops.push(next);
  }
  if (limit - stops[stops.length - 1] > 2) stops.push(limit);
  return stops;
}

export function nearestProjectStop(stops, scrollLeft) {
  let nearest = 0;
  for (let index = 1; index < stops.length; index++) {
    if (Math.abs(stops[index] - scrollLeft) < Math.abs(stops[nearest] - scrollLeft)) nearest = index;
  }
  return nearest;
}

// Reverse at the edge instead of rushing back through the whole reel.
export function nextProjectStep(position, count, direction = 1) {
  if (count < 2) return { position: 0, direction: 1 };
  let step = direction < 0 ? -1 : 1;
  if (position <= 0) step = 1;
  else if (position >= count - 1) step = -1;
  return { position: Math.max(0, Math.min(count - 1, position + step)), direction: step };
}

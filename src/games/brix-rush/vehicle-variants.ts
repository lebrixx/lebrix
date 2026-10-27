export type VehicleKind = "car" | "truck";

/** Art is deterministic per vehicle, without consuming the world's random generator. */
export function vehicleVariant(seed: string, col: number, index: number, carLen: number) {
  const kind: VehicleKind = carLen === 1 ? "car" : "truck";
  let hash = 2166136261;
  const key = `${seed}:${col}:${index}`;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return { kind, variant: (hash >>> 0) % (kind === "car" ? 6 : 3) };
}
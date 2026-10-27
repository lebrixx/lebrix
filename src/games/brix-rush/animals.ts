import deer from "@/assets/brix-rush/animals/deer.png";
import dog from "@/assets/brix-rush/animals/dog.png";
import horse from "@/assets/brix-rush/animals/horse.png";
import kitty from "@/assets/brix-rush/animals/kitty.png";
import pinguin from "@/assets/brix-rush/animals/pinguin.png";
import tiger from "@/assets/brix-rush/animals/tiger.png";

export const ANIMALS = [
  { id: "dog", label: "Chien", url: dog },
  { id: "kitty", label: "Chat", url: kitty },
  { id: "tiger", label: "Tigre", url: tiger },
  { id: "horse", label: "Cheval", url: horse },
  { id: "deer", label: "Cerf", url: deer },
  { id: "pinguin", label: "Pingouin", url: pinguin },
] as const;
export type AnimalId = (typeof ANIMALS)[number]["id"];

const isAnimal = (v: unknown): v is AnimalId => ANIMALS.some((a) => a.id === v);

/** A new random preference for each room launch, never a saved player choice. */
export function randomAnimal(random: () => number = Math.random): AnimalId {
  const index = Math.min(ANIMALS.length - 1, Math.max(0, Math.floor(random() * ANIMALS.length)));
  return ANIMALS[index]?.id ?? "dog";
}

/**
 * Every client runs this on the same ordered player list (by join order), so all agree:
 * the earliest joiner keeps a contested random animal, later ones receive a free one.
 */
export function assignAnimals(players: { id: string; wants?: unknown }[]): Record<string, AnimalId> {
  const out: Record<string, AnimalId> = {};
  const used = new Set<AnimalId>();
  for (const p of players) {
    let a: AnimalId | undefined = isAnimal(p.wants) && !used.has(p.wants) ? p.wants : undefined;
    a ??= ANIMALS.find((x) => !used.has(x.id))?.id;
    if (!a) continue;
    used.add(a);
    out[p.id] = a;
  }
  return out;
}

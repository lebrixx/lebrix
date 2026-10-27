import { useEffect, useState } from "react";
import { getUsername } from '@/utils/localIdentity';
import { resolveBrixUsername } from './username';
import { hueFor } from "./world";
import type { Me } from "./net";

/** Per-tab identity; null until hydrated or if no pseudo saved yet. */
export function useIdentity() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let id = sessionStorage.getItem("brix-id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("brix-id", id); }
    const name = resolveBrixUsername(getUsername());
    if (name) setMe({ id, name, hue: hueFor(id) });
    setReady(true);
  }, []);
  return { me, ready };
}

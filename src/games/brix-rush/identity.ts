import { useEffect, useState } from "react";
import { hueFor } from "./world";
import type { Me } from "./net";

const KEY = "brix-name";

export function saveName(name: string) {
  localStorage.setItem(KEY, name.trim().slice(0, 14));
}

/** Per-tab identity; null until hydrated or if no pseudo saved yet. */
export function useIdentity() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let id = sessionStorage.getItem("brix-id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("brix-id", id); }
    const name = localStorage.getItem(KEY);
    if (name) setMe({ id, name, hue: hueFor(id) });
    setReady(true);
  }, []);
  const setName = (name: string) => {
    saveName(name);
    const id = sessionStorage.getItem("brix-id") ?? crypto.randomUUID();
    sessionStorage.setItem("brix-id", id);
    setMe({ id, name: name.trim().slice(0, 14), hue: hueFor(id) });
  };
  return { me, ready, setName };
}

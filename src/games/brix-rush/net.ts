import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { MAX_PLAYERS } from "./world";
import { assignAnimals, randomAnimal, type AnimalId } from "./animals";

export type Me = { id: string; name: string; hue: number };
export type RemoteState = { id: string; name: string; hue: number; x: number; y: number; dead: boolean; best: number; t: number };
export type PresencePlayer = { id: string; name: string; hue: number; joinedAt: number; wants?: string | undefined };

const LOBBY = "brix-lobby";

export function randomCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => a[Math.floor(Math.random() * a.length)]).join("");
}

/** Finds a public room that has players but isn't full; returns null if none. */
export function findPublicRoom(): Promise<string | null> {
  return new Promise((resolve) => {
    const ch = supabase.channel(LOBBY, { config: { presence: { key: `scout-${Math.random()}`, enabled: true } } });
    let done = false;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      if (settle) clearTimeout(settle);
      clearTimeout(timeout);
      const counts = new Map<string, number>();
      console.debug('Brix discovery state', ch.presenceState());
      for (const metas of Object.values(ch.presenceState<{ room?: string }>())) {
        const room = metas[0]?.room;
        if (room) counts.set(room, (counts.get(room) ?? 0) + 1);
      }
      let best: string | null = null;
      let bestN = 0;
      counts.forEach((n, room) => {
        if (n < MAX_PLAYERS && n > bestN) { best = room; bestN = n; }
      });
      supabase.removeChannel(ch);
      resolve(best);
    };
    ch.on("presence", { event: "sync" }, () => {
      if (settle) clearTimeout(settle);
      settle = setTimeout(finish, 1000);
    }).subscribe();
    const timeout = setTimeout(finish, 6000);
  });
}

export function useRoom(code: string, me: Me | null, isPublic: boolean, solo = false) {
  const [players, setPlayers] = useState<PresencePlayer[]>([]);
  const [status, setStatus] = useState<"connecting" | "ok" | "full" | "error">("connecting");
  const remote = useRef<Record<string, RemoteState>>({});
  const chRef = useRef<RealtimeChannel | null>(null);
  const animalsRef = useRef<Record<string, AnimalId>>({});

  useEffect(() => {
    remote.current = {};
    animalsRef.current = {};
    setPlayers([]);
    setStatus("connecting");
    if (!me) return;
    const joinedAt = Date.now();
    const wants = randomAnimal();
    animalsRef.current = { [me.id]: wants };
    if (solo) {
      setPlayers([{ ...me, joinedAt, wants }]);
      setStatus("ok");
      return;
    }
    const ch = supabase.channel(`brix-room:${code}`, {
      config: { presence: { key: me.id }, broadcast: { self: false } },
    });
    let lobby: RealtimeChannel | null = null;
    let full = false;
    let active = true;
    let ids = new Set<string>();
    chRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      if (!active) return;
      const list: PresencePlayer[] = Object.entries(ch.presenceState<PresencePlayer>())
        .map(([id, metas]) => ({ name: metas[0]?.name ?? "?", hue: metas[0]?.hue ?? 0, joinedAt: metas[0]?.joinedAt ?? 0, wants: metas[0]?.wants, id }))
        .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
      const allowed = list.slice(0, MAX_PLAYERS);
      if (list.some((p) => p.id === me.id) && !allowed.some((p) => p.id === me.id)) {
        full = true;
        setStatus("full");
        supabase.removeChannel(ch);
        if (lobby) supabase.removeChannel(lobby);
        return;
      }
      ids = new Set(allowed.map((p) => p.id));
      for (const id of Object.keys(remote.current)) if (!ids.has(id)) delete remote.current[id];
      setPlayers(allowed);
      const a = assignAnimals(allowed);
      animalsRef.current = a;
    });
    ch.on("broadcast", { event: "pos" }, ({ payload }) => {
      const p = payload as RemoteState;
      if (!active || !p || p.id === me.id || !ids.has(p.id) || typeof p.name !== "string" || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.best) || !Number.isFinite(p.hue) || typeof p.dead !== "boolean") return;
      remote.current[p.id] = { ...p, t: performance.now() };
    });
    ch.subscribe(async (s) => {
      if (!active || full) return;
      if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") { setStatus("error"); return; }
      if (s !== "SUBSCRIBED") return;
      await ch.track({ name: me.name, hue: me.hue, joinedAt, wants });
      if (!active || full) return;
      setStatus((st) => (st === "full" ? st : "ok"));
      if (isPublic && !lobby) {
        lobby = supabase.channel(LOBBY, { config: { presence: { key: me.id, enabled: true } } });
        lobby.subscribe(async (ls) => {
          if (ls === "SUBSCRIBED" && !full && active) await lobby?.track({ room: code });
        });
      }
    });

    return () => {
      active = false;
      chRef.current = null;
      supabase.removeChannel(ch);
      if (lobby) supabase.removeChannel(lobby);
    };
  }, [code, me, isPublic, solo]);

  const send = useCallback((s: Omit<RemoteState, "t">) => {
    chRef.current?.send({ type: "broadcast", event: "pos", payload: s });
  }, []);

  return { players, status, remote, send, animalsRef };
}

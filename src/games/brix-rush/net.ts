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

/** One lobby connection survives menu-to-room transitions. */
export function usePublicLobby(me: Me | null, room: string | null) {
  const lobbyRef = useRef<RealtimeChannel | null>(null);
  const roomRef = useRef(room);
  roomRef.current = room;
  const playerId = me?.id;
  useEffect(() => {
    if (!playerId) return;
    let active = true;
    const ch = supabase.channel(LOBBY, { config: { presence: { key: playerId, enabled: true } } });
    lobbyRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {}).subscribe(async state => {
      if (state === "SUBSCRIBED" && active) await ch.track({ room: roomRef.current });
    });
    return () => { active = false; lobbyRef.current = null; supabase.removeChannel(ch); };
  }, [playerId]);
  useEffect(() => {
    const ch = lobbyRef.current;
    if (ch?.state === "joined") void ch.track({ room });
  }, [room]);
  return useCallback(async () => {
    const ch = lobbyRef.current;
    if (!ch) return null;
    const counts = new Map<string, number>();
    for (const metas of Object.values(ch.presenceState<{ room?: string }>())) {
      const code = metas[0]?.room;
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return [...counts].filter(([, n]) => n < MAX_PLAYERS).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, []);
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
    });

    return () => {
      active = false;
      chRef.current = null;
      supabase.removeChannel(ch);
    };
  }, [code, me, isPublic, solo]);

  const send = useCallback((s: Omit<RemoteState, "t">) => {
    chRef.current?.send({ type: "broadcast", event: "pos", payload: s });
  }, []);

  return { players, status, remote, send, animalsRef };
}

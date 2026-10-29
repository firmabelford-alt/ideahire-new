import { useCallback, useEffect, useRef, useState } from "react";
import { LUCYNA_NOTICE_VERSION, packConversation } from "./LucynaCore";

const historyError = error => /stale/.test(error?.message || "") ? "Rozmowa zmieniła się w innej karcie. Odśwież stronę przed dalszym zapisem."
  : /thread_limit/.test(error?.message || "") ? "Masz już 12 zapisanych rozmów. Usuń wybraną rozmowę, aby zapisać nową."
  : /capacity/.test(error?.message || "") ? "Osiągnięto limit miejsca na historię. Ta zmiana pozostaje w bieżącej sesji; możesz wyeksportować rozmowę."
  : "Nie udało się zapisać historii na koncie. Zmiany pozostają w tej sesji. Możesz pobrać ich kopię.";

export function useLucynaMemory({ supabase, user, conversations, setConversations, handoffThread = null }) {
  const [ready, setReady] = useState(false), [acknowledged, setAcknowledged] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(false), [memoryError, setMemoryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [ackSaving,setAckSaving] = useState(false); const ackInFlight = useRef(false);
  const context = useRef({ uid: null, epoch: 0, loaded: false });
  const revisions = useRef(new Map()), hashes = useRef(new Map()), pending = useRef(new Map());
  const removed = useRef(new Set()), worker = useRef(null), all = useRef(conversations);
  const inFlight = useRef(new Map()), writeAllowed = useRef(false);
  all.current = conversations;
  const request = useCallback(async (name, args, uid, epoch) => {
    const { data, error } = await supabase.auth.getSession();
    if (error || data?.session?.user?.id !== uid || context.current.epoch !== epoch) throw new Error("auth");
    const response = await fetch(String(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, "") + "/rest/v1/rpc/" + name, {
      method: "POST", headers: { "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + data.session.access_token },
      body: JSON.stringify(args), cache: "no-store",
    });
    if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.message || "save"); }
    return response.status === 204 ? null : response.json();
  }, [supabase]);
  useEffect(() => {
    const epoch = context.current.epoch + 1, uid = user?.id;
    context.current = { uid, epoch, loaded: false };
    revisions.current = new Map(); hashes.current = new Map(); pending.current = new Map(); removed.current = new Set();
    inFlight.current.clear(); writeAllowed.current = false;
    setReady(false); setAcknowledged(false); setHistoryEnabled(false); setMemoryError("");
    let alive = true;
    if (!uid) { context.current.loaded=true;setReady(true); return () => { alive = false; }; }
    (async () => {
      try {
        const [prefs, threads] = await Promise.all([
          supabase.from("ideahire_lucyna_v2_preferences").select("notice_version,history_enabled").eq("user_id", uid).maybeSingle(),
          supabase.from("ideahire_lucyna_v2_threads").select("id,title,mode,messages,revision,source_delivery_id,source_conversation_id,expires_at")
            .eq("user_id", uid).order("updated_at", { ascending: false }).limit(12),
        ]);
        if (!alive || context.current.epoch !== epoch) return;
        if (prefs.error || threads.error) throw new Error("load");
        setAcknowledged(prefs.data?.notice_version === LUCYNA_NOTICE_VERSION);
        setHistoryEnabled(prefs.data?.history_enabled ?? false);
        writeAllowed.current = prefs.data?.notice_version === LUCYNA_NOTICE_VERSION && !!prefs.data?.history_enabled;
        const restored = (threads.data || []).map(row => ({ id: row.id, title: row.title, mode: row.mode,
          messages: Array.isArray(row.messages) ? row.messages : [], sourceDeliveryId: row.source_delivery_id,
          sourceConversationId: row.source_conversation_id, expiresAt: row.expires_at }));
        for (let i = 0; i < restored.length; i++) {
          revisions.current.set(restored[i].id, threads.data[i].revision);
          hashes.current.set(restored[i].id, JSON.stringify(packConversation(restored[i])));
        }
        const merged = handoffThread ? [handoffThread, ...restored.filter(row => row.id !== handoffThread.id)].slice(0, 12) : restored;
        if (merged.length) setConversations(merged);
      } catch { if (alive && context.current.epoch === epoch) setMemoryError("Historia na koncie jest chwilowo niedostępna. Nie wysłaliśmy treści rozmów do AI."); }
      finally { if (alive && context.current.epoch === epoch) {context.current.loaded=true;setReady(true);} }
    })();
    return () => { alive = false; };
  }, [supabase, user?.id, setConversations, handoffThread]);

  const flush = useCallback(() => {
    if (worker.current) return worker.current;
    const owner = { ...context.current };
    worker.current = (async () => {
      setSaving(true);
      while (pending.current.size && context.current.epoch === owner.epoch) {
        const [id, task] = pending.current.entries().next().value;
        pending.current.delete(id);
        if (!writeAllowed.current || removed.current.has(id) || task.epoch !== owner.epoch) continue;
        inFlight.current.set(id, task.hash);
        try {
          const value = task.snapshot;
          const revision = await request("ideahire_lucyna_v2_save_thread", {
            p_id: value.id, p_title: value.title, p_mode: value.mode, p_messages: value.messages,
            p_revision: revisions.current.get(id) || 0, p_source_delivery_id: value.sourceDeliveryId,
            p_source_conversation_id: value.sourceConversationId,
          }, owner.uid, owner.epoch);
          if (context.current.epoch !== owner.epoch) break;
          revisions.current.set(id, revision); hashes.current.set(id, task.hash); setMemoryError("");
        } catch (error) {
          if (context.current.epoch !== owner.epoch) break;
          hashes.current.set(id, task.hash);
          setMemoryError(historyError(error));
        } finally {
          if (context.current.epoch === owner.epoch) inFlight.current.delete(id);
        }
      }
    })().finally(() => {
      worker.current = null;
      setSaving(false);
    });
    return worker.current;
  }, [request]);
  useEffect(() => {
    // Stan React z poprzedniego renderu nie może włączyć zapisu po zmianie właściciela.
    if (!context.current.loaded || !ready || !acknowledged || !historyEnabled || context.current.uid !== user?.id) return;
    for (const conversation of conversations) {
      const snapshot = packConversation(conversation), hash = JSON.stringify(snapshot);
      if (!snapshot.messages.length || removed.current.has(snapshot.id) || hashes.current.get(snapshot.id) === hash
        || inFlight.current.get(snapshot.id) === hash) continue;
      pending.current.set(snapshot.id, { snapshot, hash, epoch: context.current.epoch });
    }
    if (pending.current.size) flush();
  }, [ready, acknowledged, historyEnabled, conversations, user?.id, flush, saving,ackSaving]);

  const acknowledge = useCallback(async (enabled) => {
    if (ackInFlight.current) throw new Error("busy");
    ackInFlight.current=true;setAckSaving(true);
    const owner = { ...context.current };
    const previous = writeAllowed.current;
    try {
      if (!enabled) { writeAllowed.current = false; pending.current.clear(); await worker.current?.catch(() => {}); }
      await request("ideahire_lucyna_v2_acknowledge", { p_version: LUCYNA_NOTICE_VERSION, p_history_enabled: enabled }, owner.uid, owner.epoch);
      if (context.current.epoch !== owner.epoch) return;
      writeAllowed.current = enabled; setHistoryEnabled(enabled); setAcknowledged(true);
    } catch(error) { if(context.current.epoch===owner.epoch) writeAllowed.current=previous;throw error; }
    finally {ackInFlight.current=false;setAckSaving(false);}
  }, [request]);
  const remove = useCallback(async id => {
    const owner = { ...context.current };
    removed.current.add(id); pending.current.delete(id);
    try {
      await worker.current?.catch(() => {});
      await request("ideahire_lucyna_v2_delete_thread", { p_id: id }, owner.uid, owner.epoch);
      if (context.current.epoch !== owner.epoch) return;
      revisions.current.delete(id); hashes.current.delete(id); setMemoryError("");
    } catch (error) { removed.current.delete(id); throw error; }
  }, [request]);
  const clear = useCallback(async () => {
    const owner = { ...context.current };
    const ids = all.current.map(c => c.id);
    ids.forEach(id => removed.current.add(id)); pending.current.clear();
    try {
      await worker.current?.catch(() => {});
      await request("ideahire_lucyna_v2_delete_history", {}, owner.uid, owner.epoch);
      if (context.current.epoch !== owner.epoch) return;
      revisions.current.clear(); hashes.current.clear(); setMemoryError("");
    } catch (error) { if (context.current.epoch === owner.epoch) ids.forEach(id => removed.current.delete(id)); throw error; }
  }, [request]);
  return { ready, acknowledged, historyEnabled, memoryError, saving,ackSaving, acknowledge, remove, clear, flush };
}

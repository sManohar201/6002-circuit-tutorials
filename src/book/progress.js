/* Progress store shared by the contents page and every chapter page.
   Each chapter's state is { done: {p1: true}, last: {part, step} | null, say: {key: text}, t: ms }.
   It lives in two places:
     - localStorage "course-<id>": instant first paint, and the fallback when nothing else works.
     - the artifact's db, at data/users/<viewer id>/<chapter id>: private to the viewer, follows them
       across browsers and sessions. Only available when the page runs inside the claude.ai viewer. */
window.Progress = (function () {
  const LKEY = (id) => "course-" + id;
  const local = {
    get(id) { try { const v = localStorage.getItem(LKEY(id)); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(id, v) { try { localStorage.setItem(LKEY(id), JSON.stringify(v)); } catch (e) {} },
  };
  const blank = () => ({ done: {}, last: null, say: {}, t: 0 });
  const norm = (s) => Object.assign(blank(), s || {}, { done: Object.assign({}, s && s.done), say: Object.assign({}, s && s.say) });

  /* Combine two copies: parts finished anywhere stay finished; the newer copy wins for position and text. */
  function merge(a, b) {
    a = norm(a); b = norm(b);
    const [old, neu] = a.t >= b.t ? [b, a] : [a, b];
    return { done: Object.assign({}, old.done, neu.done), last: neu.last, say: Object.assign({}, old.say, neu.say), t: neu.t };
  }
  const same = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

  /* ---------- cloud ---------- */
  let status = "local"; // "local" | "cloud"
  const statusFns = [];
  const setStatus = (s) => { status = s; statusFns.forEach((f) => f(s)); };
  const cloud = (async () => {
    try {
      if (!window.claude || !window.claude.use) return null;
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) return null;
      const uid = await user.id();
      if (!uid) return null;
      const col = db.collection("data/users/" + uid);
      await col.limit(1).get(); // proves the store answers before we claim "saved to your account"
      setStatus("cloud");
      return col;
    } catch (e) { return null; }
  })();

  /* One write in flight per chapter; bursts collapse into the latest state. */
  const pending = {}, busy = {};
  async function flush(id) {
    const col = await cloud;
    if (!col || busy[id] || !pending[id]) return;
    busy[id] = true;
    const body = pending[id]; pending[id] = null;
    try { await col.doc(id).set(body); }
    catch (e) {
      if (e && e.code === "unavailable") { pending[id] = pending[id] || body; setTimeout(() => flush(id), 1500 + Math.random() * 1500); }
      else if (e && (e.code === "invalid_argument" || e.code === "revoked" || e.code === "not_granted")) setStatus("local");
    }
    busy[id] = false;
    if (pending[id]) flush(id);
  }
  const timers = {};
  function push(id, state, delay) {
    pending[id] = JSON.parse(JSON.stringify(norm(state)));
    clearTimeout(timers[id]);
    timers[id] = setTimeout(() => flush(id), delay);
  }

  return {
    /* Synchronous best guess from this browser. */
    load(id) { return norm(local.get(id)); },
    /* Save locally now, to the account shortly after. `delay` batches typing. */
    save(id, state, delay = 400) {
      state.t = Date.now();
      local.set(id, state);
      push(id, state, delay);
    },
    /* Once the account copy arrives, merge it into `state` (mutating it) and call onChange if anything moved. */
    async sync(id, state, onChange) {
      const col = await cloud;
      if (!col) return;
      let remote = null;
      try { const snap = await col.doc(id).get(); remote = snap.exists ? snap.data() : null; } catch (e) { return; }
      const m = merge(state, remote);
      const changed = !same(m, state);
      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, m);
      local.set(id, state);
      if (!same(m, remote)) push(id, state, 0); // this browser had something the account didn't
      if (changed && onChange) onChange();
    },
    /* Contents page: every chapter's state, local first, then merged with the account. */
    async all(ids, onReady) {
      const out = {};
      ids.forEach((id) => (out[id] = norm(local.get(id))));
      onReady(out);
      const col = await cloud;
      if (!col) return;
      let snap;
      try { snap = await col.get(); } catch (e) { return; }
      const remote = {};
      snap.docs.forEach((d) => (remote[d.id] = d.data()));
      let changed = false;
      ids.forEach((id) => {
        const m = merge(out[id], remote[id]);
        if (!same(m, out[id])) { changed = true; out[id] = m; local.set(id, m); }
        if (!same(m, remote[id]) && (m.t || Object.keys(m.done).length)) push(id, m, 0);
      });
      if (changed) onReady(out);
    },
    status: () => status,
    onStatus(fn) { statusFns.push(fn); fn(status); },
  };
})();

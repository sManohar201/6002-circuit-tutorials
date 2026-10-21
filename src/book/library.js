/* Library page: overall progress, a Resume card that follows the suggested orders, a small tile per book,
   then the two suggested orders themselves. */
(function () {
  const books = Object.values(window.BOOKS);
  /* id -> { B, c }. Math modules that reuse a 6.002 appendix (`ref`) share its id, so the owning book wins. */
  const ITEMS = {};
  books.forEach((B) => B.all().filter((c) => c.file).forEach((c) => { if (!ITEMS[c.id] || ITEMS[c.id].c.ref) ITEMS[c.id] = { B, c }; }));
  const ids = Object.keys(ITEMS);
  let saved = {};

  const doneParts = (id) => Math.min(ITEMS[id].c.parts, Object.values((saved[id] || {}).done || {}).filter(Boolean).length);
  const finished = (id) => doneParts(id) >= ITEMS[id].c.parts;
  const sum = (list, f) => list.reduce((n, id) => n + f(id), 0);
  const pct = (a, b) => (b ? Math.floor((100 * a) / b) : 0);
  const href = (id) => { const { B, c } = ITEMS[id]; return c.file.startsWith("../") ? c.file.slice(3) : `${B.dir}/${c.file}`; };
  const name = (id) => { const { B, c } = ITEMS[id]; return `${B.short} ${typeof c.n === "number" ? B.unit || "Chapter" : "Appendix"} ${c.n}`; };

  /* Each step: [first, then, why, math to do first, ids in the order Resume walks them (math, first, then)]. */
  const PATH = [
    ["6.002 Chapters 1–4 and Appendix A", "Boylestad Chapters 1–2", "Circuit laws first, then diodes in depth.", "Math 1–3, 5, 6, 8",
      "m1 m2 m3 m5 appD m8 ch1 appA ch2 ch3 ch4 edc1 edc2"],
    ["6.002 Chapters 5–8", "Boylestad Chapters 3–8 and Appendix A", "The MOSFET's ideas, then BJTs and FETs in practice. Boylestad's Appendix A goes with its Chapter 5.", "Math 4, 7, 13, 17",
      "m4 m7 m13 m17 ch5 ch6 ch7 ch8 edc3 edc4 edc5 edcA edc6 edc7 edc8"],
    ["6.002 Chapters 9–13", "Boylestad Chapter 9", "Capacitors and frequency response, then amplifiers' cutoffs.", "Math 9–12, 14–16",
      "m9 m10 appB appC m14 m15 m16 ch9 ch10 ch11 ch12 ch13 edc9"],
    ["6.002 Chapters 14–15", "Boylestad Chapters 10, 11, 14", "Resonance and op amps, then real op amps and oscillators.", "",
      "ch14 ch15 edc10 edc11 edc14"],
    ["6.002 Chapter 16", "Boylestad Chapters 12, 13, 15–17 and Appendices B–C", "Diodes wrap up 6.002. The rest of Boylestad is new devices and systems; Appendix B goes with its Chapter 15.", "",
      "ch16 edc12 edc13 edc15 edcB edc16 edc17 edcC"],
    ["Laplace (optional)", "Math 18–23", "Another way to solve the circuits of 6.002 Chapters 10–14. Do it any time after step 3; Resume brings it up here.", "",
      "m18 m19 m20 m21 m22 m23"],
    ["Chip-design math", "Math 24–39, in order", "Matrices and simulators, sensitivity, signals and sampling, probability and noise, feedback and stability, device fields.", "",
      "m24 m25 m26 m27 m28 m29 m30 m31 m32 m33 m34 m35 m36 m37 m38 m39"],
  ];
  /* Digital and chip design: Patt & Patel gives the idea, Harris & Harris the design, CMOS VLSI the transistors and wires. */
  const CHIP = [
    ["Patt & Patel 1–2 and Appendix E", "Harris & Harris 1", "Levels of a computer and bits (Appendix E has the ASCII and powers-of-2 tables), then gates, noise margins and the CMOS transistors under them.", "Math 17",
      "m17 pp1 pp2 ppE hh1"],
    ["Patt & Patel 3", "Harris & Harris 2–3", "Gates, latches and memory as ideas, then combinational and sequential design in depth.", "",
      "pp3 hh2 hh3"],
    ["Harris & Harris 4–5", "CMOS VLSI 1", "Write hardware in SystemVerilog and build the standard blocks, then see a whole chip from logic to silicon.", "",
      "hh4 hh5 vlsi1"],
    ["Boylestad 6 (circuits track step 2)", "CMOS VLSI 2–3", "The MOSFET model a chip designer uses, then how chips are made and laid out.", "Math 39",
      "m39 edc6 vlsi2 vlsi3"],
    ["CMOS VLSI 4–5", "CMOS VLSI 6–7", "Delay and power, then wires and variation: the four things every chip designer budgets.", "Math 26, 27, 34, 35",
      "m26 m27 m34 m35 vlsi4 vlsi5 vlsi6 vlsi7"],
    ["Patt & Patel 4–6", "Harris & Harris 6 and Appendix B", "The von Neumann machine and the LC-3, then a real instruction set: MIPS and its opcode tables. Then Patt & Patel Appendix B sets the LC-3 next to x86.", "",
      "pp4 pp5 pp6 hh6 hhB ppB"],
    ["Patt & Patel 7–10", "Patt & Patel Appendix A", "Programs in assembly: subroutines, stacks, I/O and interrupts.", "",
      "pp7 pp8 pp9 pp10 ppA"],
    ["Harris & Harris 7–8", "Patt & Patel Appendix C", "Build processors (single-cycle, multicycle, pipelined) and their caches, then the LC-3's own control.", "",
      "hh7 hh8 ppC"],
    ["CMOS VLSI 8", "CMOS VLSI 9–10", "SPICE, then how real gates and flip-flops are built and timed.", "Math 25, 28",
      "m25 m28 vlsi8 vlsi9 vlsi10"],
    ["CMOS VLSI 11–12", "CMOS VLSI 13", "Adders, multipliers and memories, then clocks, PLLs, power grids and I/O.", "Math 33, 37, 38",
      "m33 m37 m38 vlsi11 vlsi12 vlsi13"],
    ["CMOS VLSI 14–15", "CMOS VLSI Appendix A", "How chips are designed and tested in practice, then the HDL reference.", "",
      "vlsi14 vlsi15 vlsiA"],
    ["Patt & Patel 11–20 and Appendix D (any time after step 7)", "Harris & Harris Appendices C and A", "Programming in C (both appendices are C references), then how designs become FPGAs and real boards. Optional for chip design.", "",
      "pp11 pp12 pp13 pp14 pp15 pp16 pp17 pp18 pp19 pp20 ppD hhC hhA"],
  ];
  const TRACKS = [
    { key: "circuits", name: "Circuits", rows: PATH },
    { key: "chip", name: "Digital & chip design", rows: CHIP },
  ];
  TRACKS.forEach((T) => {
    T.rows.forEach((r) => (r.ids = r[4].split(" ")));
    T.ids = [...new Set(T.rows.flatMap((r) => r.ids))];
  });

  /* Where a track stands: the first unfinished item in order, its step, and the track's share of parts done. */
  function where(T) {
    const total = sum(T.ids, (id) => ITEMS[id].c.parts), done = sum(T.ids, doneParts);
    const next = T.ids.find((id) => !finished(id));
    const step = next ? T.rows.findIndex((r) => r.ids.includes(next)) : T.rows.length;
    const latest = Math.max(0, ...T.ids.map((id) => (saved[id] || {}).t || 0));
    return { total, done, next, step, latest };
  }

  const TKEY = "library-track";
  const pickTrack = () => {
    try { const k = localStorage.getItem(TKEY); const T = TRACKS.find((t) => t.key === k); if (T) return T; } catch (e) {}
    /* No choice yet: the track studied most recently, else circuits. */
    return TRACKS.reduce((a, b) => (where(b).latest > where(a).latest ? b : a));
  };
  let track = null;

  function overall() {
    const total = sum(ids, (id) => ITEMS[id].c.parts), done = sum(ids, doneParts), p = pct(done, total);
    const fin = ids.filter(finished).length;
    return `<section class="overall" aria-label="Overall progress">
      <div class="big">${p}<small>%</small></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="All books"><i style="width:${(100 * done) / (total || 1)}%"></i></div>
      <p class="aside">${done} of ${total} parts done · ${fin} of ${ids.length} chapters and modules finished</p>
    </section>`;
  }

  function resume() {
    const w = where(track), stepNo = w.step + 1;
    const tabs = TRACKS.map((T) => { const x = where(T); return `<button type="button" class="tab" data-track="${T.key}" aria-pressed="${T === track}">${T.name} <span>${pct(x.done, x.total)}%</span></button>`; }).join("");
    let body;
    if (!w.next) {
      body = `<h2>Track complete</h2><p class="aside">Every tutorial in this order is done. Switch tracks, or revisit a book from its contents.</p>`;
    } else {
      const { B, c } = ITEMS[w.next], s = saved[w.next] || {}, d = doneParts(w.next);
      const partNo = s.last && s.last.part != null ? s.last.part + 1 : d + 1;
      const started = d > 0 || (s.last && (s.last.part || s.last.step));
      body = `<p class="lbl">${track.name} · step ${stepNo} of ${track.rows.length}</p>
        <h2><a href="${href(w.next)}#resume">${name(w.next)}: ${c.title}</a></h2>
        <div class="row">
          <span class="meter" role="img" aria-label="${d} of ${c.parts} parts done"><i style="width:${pct(d, c.parts)}%"></i></span>
          <span class="aside">Part ${Math.min(partNo, c.parts)} of ${c.parts}${B.key === "math" || ITEMS[w.next].c.ref ? "" : " · then that chapter's problems in the book"}</span>
        </div>
        <div class="row"><a class="btn primary" href="${href(w.next)}#resume">${started ? "Resume" : "Start"} →</a><a class="btn ghost" href="${B.home}">${B.short} contents</a></div>`;
    }
    return `<section class="resume" aria-label="Resume">
      <div class="tabs" role="group" aria-label="Reading order">${tabs}</div>
      ${body}
    </section>`;
  }

  function tile(B) {
    const list = B.all().filter((c) => c.file && ITEMS[c.id].B === B).map((c) => c.id);
    const total = sum(list, (id) => ITEMS[id].c.parts), done = sum(list, doneParts), p = pct(done, total);
    const open = list.find((id) => !finished(id));
    return `<a class="tile" href="${B.home}">
      <span class="lbl">${B.short}</span>
      <b>${B.title}</b>
      <span class="meter" role="img" aria-label="${done} of ${total} parts done"><i style="width:${(100 * done) / (total || 1)}%"></i></span>
      <span class="aside">${p}% · ${open ? `next: ${typeof ITEMS[open].c.n === "number" ? B.unit || "Chapter" : "Appendix"} ${ITEMS[open].c.n}` : "all done"}</span>
    </a>`;
  }

  const pathList = (T) => {
    const w = where(T);
    return `<ol class="path">${T.rows.map(([a, b, why, m], i) => {
      const cls = i < w.step ? "done" : i === w.step ? "now" : "";
      return `<li class="${cls}"><span class="a">${a}</span><span class="arr" aria-hidden="true">→</span><span class="b">${b}</span><span class="why">${cls === "now" ? "<b>You are here.</b> " : cls === "done" ? "Done. " : ""}${why}${m ? ` <a href="math.html">Math first: ${m}.</a>` : ""}</span></li>`;
    }).join("")}</ol>`;
  };

  function render() {
    track = track || pickTrack();
    document.getElementById("app").innerHTML = `<div class="wrap cover">
      <header class="top">
        <div class="eyebrow">Your library</div>
        <h1>Circuits Library</h1>
        <p class="sub">Five books and a math toolkit: circuits, then digital logic, computers and chip design. Do a chapter's tutorial, then that chapter's problems in the real book.</p>
      </header>
      ${overall()}
      ${resume()}
      <section class="group" aria-label="Books">
        <h2>Books</h2>
        <div class="tiles">${books.map(tile).join("")}</div>
      </section>
      <section class="group" aria-label="Suggested order: circuits">
        <h2>Suggested order 1: circuits</h2>
        <p>6.002 gives the ideas, Boylestad the real devices. Alternate like this, and do the listed Math Toolkit modules before each step (or as soon as a step feels shaky).</p>
        ${pathList(TRACKS[0])}
      </section>
      <section class="group" aria-label="Suggested order: digital and chip design">
        <h2>Suggested order 2: digital and chip design</h2>
        <p>Patt & Patel gives the idea, Harris & Harris the logic design, CMOS VLSI the transistors and wires. Start any time: steps 1–3 need no circuits. Step 4 needs the circuits track up to Boylestad Chapter 6.</p>
        ${pathList(TRACKS[1])}
      </section>
      <p class="aside">Resume walks each order top to bottom: the math listed for a step, then the left book, then the right one, skipping anything you've already finished.</p>
      <footer class="foot"><p><span class="save-note"></span></p></footer>
    </div>`;
    document.querySelectorAll(".resume .tab").forEach((b) => b.addEventListener("click", () => {
      track = TRACKS.find((t) => t.key === b.dataset.track);
      try { localStorage.setItem(TKEY, track.key); } catch (e) {}
      render();
      const t = document.querySelector(`.resume .tab[data-track="${track.key}"]`);
      if (t) t.focus();
    }));
    Progress.onStatus((st) => { const n = document.querySelector(".save-note"); if (n) n.textContent = st === "cloud" ? "Progress saves to your Claude account, so it follows you to any browser." : "Progress saves in this browser only."; });
  }

  Progress.all(ids, (s) => { saved = s; render(); });
})();

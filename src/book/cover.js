/* Contents page: reads window.BOOK and each chapter's saved progress (window.Progress: this browser, then the account). */
(function () {
  const B = window.BOOK;
  let saved = {};
  const range = (p) => p.replace("-", "–");

  function progress(c) {
    if (!c.file) return { state: "later", done: 0 };
    const s = saved[c.id];
    const done = s && s.done ? Object.values(s.done).filter(Boolean).length : 0;
    const started = done > 0 || !!(s && s.last);
    return { state: done >= c.parts ? "done" : started ? "going" : "ready", done };
  }

  function chip(c, p) {
    if (p.state === "later") return `<span class="chip">${typeof c.n === "number" ? "Not built yet" : "Inside chapters"}</span>`;
    if (p.state === "done") return `<span class="chip done">Done ✓</span>`;
    if (p.state === "going") return `<span class="chip going">${p.done} of ${c.parts} parts</span>`;
    return `<span class="chip ready">${c.parts} parts</span>`;
  }

  function row(c) {
    const p = progress(c);
    const pages = B.noPdf ? (c.ref ? `<span class="pp">a 6.002 appendix</span>` : "") : (c.pdf ? `<span class="pp">${B.pagesLabel(c)}</span>` : `<span class="pp">not in PDFs</span>`) + (c.probs ? `<span class="pp">problems: PDF p. ${c.probs}</span>` : "");
    const inner = `<span class="n">${c.n}</span><span class="t">${c.title}</span><span class="d">${c.blurb}</span><span class="s">${chip(c, p)}${pages}</span>`;
    const cls = p.state === "later" ? "later" : p.state === "done" ? "done" : "ready";
    return c.file
      ? `<li class="${cls}"><a class="ch" href="${B.dir}/${c.file}">${inner}</a></li>`
      : `<li class="${cls}"><div class="ch" aria-disabled="true">${inner}</div></li>`;
  }

  const U = B.unit || "Chapter";
  function upNext() {
    const list = B.chapters();
    const built = list.filter((c) => c.file);
    const open = built.find((c) => progress(c).state !== "done");
    if (open) {
      const p = progress(open);
      const pct = Math.round((100 * p.done) / open.parts);
      const verb = p.state === "going" ? "Continue" : "Start";
      return `<section class="next-card" aria-label="Up next">
        <span class="big">${open.n}</span>
        <span class="lbl">Up next · ${U} ${open.n}</span>
        <h2>${open.title}</h2>
        <div class="row"><a class="btn primary" href="${B.dir}/${open.file}">${verb} ${U} ${open.n} →</a>
          <span class="meter" role="img" aria-label="${p.done} of ${open.parts} parts done"><i style="width:${pct}%"></i></span>
          <span class="aside">${p.done} of ${open.parts} parts</span></div>
      </section>`;
    }
    const nx = list.find((c) => !c.file);
    const none = !built.length;
    return `<section class="next-card" aria-label="Up next">
      <span class="big">${nx ? nx.n : "✓"}</span>
      <span class="lbl">${nx ? "Up next · " + U + " " + nx.n : "Finished"}</span>
      <h2>${nx ? nx.title : "Every " + U.toLowerCase() + " is done"}</h2>
      <div class="row"><span class="aside">${!nx ? "Nice work." : none ? "Its tutorial is being built. Ask Claude for it." : "Every built chapter is done. Ask Claude to build this one when you've finished the last chapter's problems."}</span></div>
    </section>`;
  }

  function render() {
  const builtCount = B.chapters().filter((c) => c.file).length;
  const html = `<div class="wrap cover">
    <header class="top">
      <div class="eyebrow"><a class="book-link" href="index.html">← Library</a> · ${B.source.replace(", Foundations", " · Foundations")}</div>
      <h1>${B.title}</h1>
      <p class="sub">${B.sub || "One tutorial per chapter, so you don't have to read the chapter. Finish the tutorial, then go straight to the book's problems."}</p>
    </header>
    ${B.intro ? `<section class="card">${B.intro}</section>` : ""}
    ${upNext()}
    <ol class="flow" aria-label="How each ${U.toLowerCase()} works">${B.flow ? B.flow.map(([b, t]) => `<li><b>${b}</b><span>${t}</span></li>`).join("") : `
      <li><b>Tutorial</b><span>Do the parts in order. About 20 minutes each, with a break after every part.</span></li>
      <li><b>Book problems</b><span>Open that chapter's PDF and do the exercises and problems at the end. They're the real test.</span></li>
      <li><b>Check</b><span>Commit to your answer first. Then check it against the book's answers to selected problems (the PDF file ending “-${B.answers.pdf}.pdf”).</span></li>`}
    </ol>
    ${B.groups.map((g) => `<section class="group" aria-label="${g.name}">
      <h2>${g.name}</h2><p>${g.note}</p>
      <ol class="toc">${g.items.map(row).join("")}</ol>
    </section>`).join("")}
    <footer class="foot">
      <p>${builtCount} of ${B.chapters().length} ${U.toLowerCase()} tutorials built.${builtCount < B.chapters().length ? " New ones get added here as you go." : ""}</p>
      ${B.pdfFolder ? `<p>${B.pdfFile ? `PDF: “${B.pdfFile}” in your “${B.pdfFolder}” folder. Page numbers here are PDF pages.` : `PDFs: the files in your “${B.pdfFolder}” folder, named “…-&lt;pages&gt;.pdf”.`}</p>` : ""}
      <p><span class="save-note"></span> Stuck on a problem? Ask Claude. You'll get a guiding question first, not the answer.</p>
    </footer>
  </div>`;
  document.getElementById("app").innerHTML = html;
  Progress.onStatus((st) => { const n = document.querySelector(".save-note"); if (n) n.textContent = st === "cloud" ? "Progress saves to your Claude account, so it follows you to any browser." : "Progress saves in this browser only."; });
  }

  Progress.all(B.all().filter((c) => c.file).map((c) => c.id), (s) => { saved = s; render(); });
})();

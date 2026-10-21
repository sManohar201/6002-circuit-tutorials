(function () {
  const { S, plot, slider, toggle, readout, el } = Course;
  const { code, trace, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const lc3 = (t) => Digital.listing(t, { comment: ";" });
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const field = "font:inherit;font-family:var(--mono);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink)";

  /* ---------- flow diagrams (Figures 13.1, 13.2, 13.6, 13.9, 13.13) ---------- */
  function flow(kind) {
    const dia = (x, y, t) => `<polygon points="${x},${y - 22} ${x + 60},${y} ${x},${y + 22} ${x - 60},${y}" style="fill:var(--accent-soft);stroke:var(--ink)"/>` + S.t(x, y + 5, t);
    const box = (x, y, t) => S.box(x - 60, y - 16, 120, 32, "") + S.t(x, y + 5, t);
    const a = (x1, y1, x2, y2, t) => S.arrow(x1, y1, x2, y2, "") + (t ? S.t((x1 + x2) / 2 + 8, (y1 + y2) / 2, t, { a: "start", cls: "lab" }) : "");
    let s = "", H = 260;
    if (kind === "if") s = dia(110, 50, "condition") + a(110, 72, 110, 112, "T") + box(110, 128, "action") + a(110, 144, 110, 200) + S.wire([170, 50], [230, 50], [230, 190], [114, 190]) + S.t(238, 120, "F", { a: "start", cls: "lab" }) + S.t(110, 220, "next statement", { cls: "lab" });
    if (kind === "while") s = a(120, 10, 120, 28) + dia(120, 50, "test") + a(120, 72, 120, 112, "T") + box(120, 128, "loop body") + S.wire([120, 144], [120, 165], [30, 165], [30, 50], [60, 50]) + S.wire([180, 50], [240, 50], [240, 210], [124, 210]) + S.t(248, 130, "F", { a: "start", cls: "lab" }) + S.t(120, 232, "after the loop", { cls: "lab" });
    if (kind === "for") { H = 330; s = box(120, 24, "init") + a(120, 40, 120, 62) + dia(120, 84, "test") + a(120, 106, 120, 138, "T") + box(120, 154, "loop body") + a(120, 170, 120, 196) + box(120, 212, "update") + S.wire([120, 228], [120, 248], [30, 248], [30, 84], [60, 84]) + S.wire([180, 84], [240, 84], [240, 290], [124, 290]) + S.t(248, 190, "F", { a: "start", cls: "lab" }) + S.t(120, 312, "after the loop", { cls: "lab" }); }
    if (kind === "do") s = a(120, 6, 120, 28) + box(120, 44, "loop body") + a(120, 60, 120, 92) + dia(120, 114, "test") + S.wire([60, 114], [30, 114], [30, 30], [60, 30]) + S.t(22, 80, "T", { a: "end", cls: "lab" }) + a(120, 136, 120, 190, "F") + S.t(120, 210, "after the loop", { cls: "lab" });
    return S.svg(280, H, s, { max: 280, label: `Flow of the C ${kind} statement` });
  }
  function flows(host) {
    const K = [["if", "if"], ["while", "while"], ["for", "for"], ["do-while", "do"]];
    const out = el(`<div></div>`);
    const draw = (i) => { out.innerHTML = fig(flow(K[i][1])); };
    host.append(toggle(K.map((k) => k[0]), draw, 0), out); draw(0);
  }

  /* ---------- Figure 13.4: days in a month ---------- */
  const FIG134 = `if (month==4 || month==6 || month==9 || month==11)
   printf("The month has 30 days\\n");
else if (month==1 || month==3 || month==5 ||
         month==7 || month==8 || month==10 || month==12)
   printf("The month has 31 days\\n");
else if (month==2)
   printf("The month has either 28 days or 29 days\\n");
else
   printf("Don't know that month\\n");`;
  function monthWidget(host) {
    let m = 4;
    const out = el(`<div></div>`);
    const draw = () => {
      const r = [4, 6, 9, 11].includes(m) ? [2, "The month has 30 days"] : [1, 3, 5, 7, 8, 10, 12].includes(m) ? [5, "The month has 31 days"] : m === 2 ? [7, "The month has either 28 days or 29 days"] : [9, "Don't know that month"];
      const tested = { 2: [1], 5: [1, 3], 7: [1, 3, 6], 9: [1, 3, 6] }[r[0]];
      out.innerHTML = code(FIG134, { hl: r[0] }) + `<pre class="code">${r[1]}</pre><p class="aside">Conditions tested on the way: ${tested.length}. Once one branch runs, the rest are skipped.</p>`;
    };
    host.append(slider({ id: "pp13m", label: "month you type", min: 0, max: 13, step: 1, value: m, show: String }, (x) => { m = x; draw(); }).el, out); draw();
  }

  /* ---------- dangling else ---------- */
  function danglingElse(host) {
    let x = 5, y = 7;
    const A = `if (x != 10)
   if (y > 3)
      z = z / 2;
   else
      z = z * 2;`, B = `if (x != 10) {
   if (y > 3)
      z = z / 2;
}
else
   z = z * 2;`;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const draw = () => {
      const za = x !== 10 ? (y > 3 ? "z / 2" : "z * 2") : "unchanged", zb = x !== 10 ? (y > 3 ? "z / 2" : "unchanged") : "z * 2";
      out.innerHTML = `<div class="two"><div class="tile" style="min-width:0"><h3>No braces</h3>${code(A, { nums: false })}<p>z becomes: <b>${za}</b></p></div><div class="tile" style="min-width:0"><h3>Braces</h3>${code(B, { nums: false })}<p>z becomes: <b>${zb}</b></p></div></div>`;
    };
    const tx = toggle(["x = 5", "x = 10"], (i) => { x = i ? 10 : 5; draw(); }, 0), ty = toggle(["y = 7", "y = 2"], (i) => { y = i ? 2 : 7; draw(); }, 0);
    row.append(tx, ty); host.append(row, out); draw();
  }

  /* ---------- while: count to 9 ---------- */
  const WHILE = `int main(void)
{
   int x = 0;
   while (x < 10) {
      printf("%d ", x);
      x = x + 1;
   }
}`;
  function whileFrames() {
    const f = [{ l: 3, v: [["x", 0]], out: "" }]; let out = "";
    for (let x = 0; x <= 10; x++) {
      f.push({ l: 4, v: [["x", x], ["x < 10", x < 10 ? 1 : 0]], out, note: x < 10 ? "Test is true: run the body." : "Test is false: leave the loop." });
      if (x === 10) break;
      out += x + " ";
      f.push({ l: 5, v: [["x", x]], out });
      f.push({ l: 6, v: [["x", x + 1]], out, note: x === 0 ? "Then branch back up to the test." : "" });
    }
    f.push({ l: 8, v: [["x", 10]], out, note: "11 tests, 10 trips through the body." });
    return f;
  }
  const whileTrace = (host) => trace(host, { code: WHILE, frames: whileFrames() });

  /* ---------- for: sum 0..9, by phase ---------- */
  const FOR = `int main(void)
{
   int x;
   int sum = 0;
   for (x = 0; x < 10; x++)
      sum = sum + x;
}`;
  function forFrames() {
    const f = [{ l: 4, v: [["x", "?"], ["sum", 0]], note: "Before the loop." }, { l: 5, v: [["x", 0], ["sum", 0]], note: "<b>init</b>: x = 0, once." }];
    let sum = 0;
    for (let x = 0; x <= 10; x++) {
      f.push({ l: 5, v: [["x", x], ["sum", sum]], note: `<b>test</b>: x < 10 is ${x < 10 ? "true" : "false"}${x < 10 ? "." : ": the loop ends."}` });
      if (x === 10) break;
      sum += x;
      f.push({ l: 6, v: [["x", x], ["sum", sum]], note: "<b>body</b>." });
      f.push({ l: 5, v: [["x", x + 1], ["sum", sum]], note: "<b>update</b>: x++." });
    }
    f.push({ l: 7, v: [["x", 10], ["sum", 45]] });
    return f;
  }
  const forTrace = (host) => trace(host, { code: FOR, frames: forFrames() });

  /* ---------- the misplaced semicolon ---------- */
  const SEMI = `sum = 0;
for (x = 0; x < 10; x++);
   sum = sum + x;
printf("sum = %d\\n", sum);
printf("x = %d\\n", x);`;
  const semiTrace = (host) => trace(host, { code: SEMI, frames: [
    { l: 1, v: [["x", "?"], ["sum", 0]], out: "" },
    { l: 2, v: [["x", "0 → 10"], ["sum", 0]], out: "", note: "The <code>;</code> right after the parentheses is an empty statement, and it is the whole loop body. The loop counts x up to 10 doing nothing." },
    { l: 3, v: [["x", 10], ["sum", 10]], out: "", note: "The indented line is not in the loop. It runs once, with x = 10." },
    { l: 4, v: [["x", 10], ["sum", 10]], out: "sum = 10\n" },
    { l: 5, v: [["x", 10], ["sum", 10]], out: "sum = 10\nx = 10\n" },
  ] });

  /* ---------- multiplication table (Figure 13.11) ---------- */
  function multTable(host) {
    let o = 3;
    const out = el(`<div></div>`);
    const draw = () => {
      let h = `<div class="tbl"><table style="font-family:var(--mono);font-size:13px;text-align:center"><tbody>`;
      for (let a = 0; a < 10; a++) h += `<tr style="${a === o ? "background:var(--accent-soft)" : a > o ? "opacity:.25" : ""}">${Array.from({ length: 10 }, (_, b) => `<td>${a * b}</td>`).join("")}</tr>`;
      out.innerHTML = h + `</tbody></table></div><p>Outer iteration multiplicand = ${o}: the inner loop runs multiplier = 0…9, printing ${o}×0 … ${o}×9 separated by tabs (<code>\\t</code>), then <code>printf("\\n")</code> ends the row. ${(o + 1) * 10} products printed so far.</p>`;
    };
    host.append(slider({ id: "pp13o", label: "outer loop iteration", min: 0, max: 9, step: 1, value: o, show: (x) => "multiplicand = " + x }, (x) => { o = x; draw(); }).el, out); draw();
  }

  /* ---------- Figure 13.23: e-mail check ---------- */
  function emailCheck(host) {
    const inp = el(`<input type="text" value="ben@lc3.org" aria-label="e-mail address" style="${field};width:16em">`), out = el(`<div></div>`);
    const draw = () => {
      const s = inp.value + "\n"; let at = false, dot = false; const rows = [];
      for (const c of s) {
        if (c === "@") at = true;
        if (c === "." && at) dot = true;
        rows.push([c === "\n" ? "\\n" : c === " " ? "' '" : c, at, dot]);
        if (c === " " || c === "\n") break;
      }
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);font-size:13px;text-align:center"><tbody><tr><th>nextChar</th>${rows.map((r) => `<td>${esc(r[0])}</td>`).join("")}</tr><tr><th>gotAt</th>${rows.map((r) => `<td style="${r[1] ? "background:var(--good-soft)" : ""}">${r[1] ? 1 : 0}</td>`).join("")}</tr><tr><th>gotDot</th>${rows.map((r) => `<td style="${r[2] ? "background:var(--good-soft)" : ""}">${r[2] ? 1 : 0}</td>`).join("")}</tr></tbody></table></div>` +
        `<pre class="code">${at && dot ? "Your e-mail address appears to be valid." : "Your e-mail address is not valid!"}</pre><p class="aside">The do-while reads one character per pass and stops after a space or newline. A dot only counts once an @ has been seen.</p>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>Type an address: </label>`); lab.append(inp);
    host.append(lab, out); draw();
  }

  /* ---------- Figure 13.17: pi ---------- */
  function piWidget(host) {
    let n = 10;
    const out = el(`<div></div>`);
    const draw = () => {
      const pts = []; let pi = 0;
      for (let c = 1; c <= n; c++) { pi += (c % 2 ? 1 : -1) * 4 / (2 * c - 1); pts.push([c, pi]); }
      const step = pts.flatMap(([c, v], i) => (i ? [[c, pts[i - 1][1]], [c, v]] : [[c, v]]));
      out.innerHTML = fig(plot({ x: [0, n + 1], y: [2.6, 4.1], xt: n <= 20 ? [0, 5, 10, 15, 20].filter((v) => v <= n + 1) : [0, Math.round(n / 4), Math.round(n / 2), Math.round(3 * n / 4), n], yt: [2.8, 3, 3.2, 3.4, 3.6, 3.8, 4], xl: "terms", yl: "approximation", h: 230, series: [{ f: () => Math.PI, cls: "s4" }, { pts: step, cls: "s1" }], label: "Partial sums of 4 − 4/3 + 4/5 − …" })) +
        readout([["After " + n + " terms", pi.toFixed(6)], ["Error", (pi - Math.PI).toExponential(2)], ["Last term", (n % 2 ? "+" : "−") + "4/" + (2 * n - 1)]]);
    };
    host.append(slider({ id: "pp13n", label: "numOfTerms", min: 1, max: 500, log: true, value: n, show: (x) => String(Math.round(x)) }, (x) => { n = Math.round(x); draw(); }).el, out); draw();
  }

  /* ---------- Figure 13.21: primes ---------- */
  function primeGrid(host) {
    let pick = 91;
    const out = el(`<div></div>`), grid = el(`<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;max-width:420px"></div>`);
    const isPrime = (n) => { for (let d = 2; d <= 10; d++) if (n % d === 0 && n !== d) return false; return true; };
    const cells = [];
    for (let n = 1; n <= 100; n++) {
      const b = el(`<button type="button" class="btn small" style="padding:4px 0;font-family:var(--mono);${n === 1 ? "visibility:hidden" : ""}">${n}</button>`);
      b.addEventListener("click", () => { pick = n; draw(); }); grid.append(b); cells.push(b);
    }
    const draw = () => {
      cells.forEach((b, i) => { const n = i + 1; b.style.background = n === pick ? "var(--accent)" : n > 1 && isPrime(n) ? "var(--good-soft)" : ""; b.style.color = n === pick ? "var(--paper)" : ""; });
      const tests = []; for (let d = 2; d <= 10; d++) tests.push(`<td style="${pick % d === 0 && pick !== d ? "background:var(--bad-soft)" : ""}">${pick} % ${d} = ${pick % d}</td>`);
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);font-size:13px"><tbody><tr>${tests.slice(0, 5).join("")}</tr><tr>${tests.slice(5).join("")}</tr></tbody></table></div><p>${pick} is <b>${isPrime(pick) ? "prime" : "not prime"}</b>${isPrime(pick) ? ": no divisor from 2 to 10 (other than itself) leaves remainder 0." : ": a red cell divides it evenly."}</p>`;
    };
    host.append(el(`<p class="aside">Green = prime. Click any number to see the inner loop's tests.</p>`), grid, out); draw();
  }

  /* ---------- switch with and without break ---------- */
  function switchWidget(host) {
    let key = 0; const brk = [1, 1, 1, 1];
    const KEYS = ["a", "b", "x", "y", "q"], ST = ["A", "B", "C", "D"];
    const out = el(`<div></div>`), brow = el(`<div class="row"></div>`);
    const draw = () => {
      const src = `switch (keyPress) {\n` + ["a", "b", "x", "y"].map((k, i) => `case '${k}':\n   // Do statement ${ST[i]}\n` + (brk[i] ? "   break;\n" : "")).join("") + "}";
      const ran = []; if (key < 4) for (let i = key; i < 4; i++) { ran.push(ST[i]); if (brk[i]) break; }
      out.innerHTML = code(src, { nums: false }) + `<p>keyPress = '${KEYS[key]}' → ${ran.length ? `runs statement${ran.length > 1 ? "s" : ""} <b>${ran.join(", ")}</b>${ran.length > 1 ? ": without a break, control falls through into the next case" : ""}` : "no case matches and there's no default: nothing runs"}.</p>`;
    };
    ST.forEach((s, i) => { const b = btn(""); const show = () => { b.textContent = `break after ${s}: ${brk[i] ? "on" : "off"}`; }; b.addEventListener("click", () => { brk[i] ^= 1; show(); draw(); }); show(); brow.append(b); });
    host.append(el(`<p class="aside" style="margin:0">keyPress</p>`), toggle(KEYS.map((k) => `'${k}'`), (i) => { key = i; draw(); }, 0), brow, out); draw();
  }

  /* ---------- Figure 13.24: calculator ---------- */
  function calcWidget(host) {
    let a = 12, b = 4, op = 0;
    const OPS = ["+", "-", "*", "/", "%"];
    const out = el(`<div></div>`);
    const draw = () => {
      const o = OPS[op]; let result = 0; const lines = [];
      if (o === "+") result = a + b; else if (o === "-") result = a - b; else if (o === "*") result = a * b;
      else if (o === "/") { if (b !== 0) result = Math.trunc(a / b); else lines.push("Divide by 0 error!"); }
      else lines.push("Invalid operation!");
      lines.push("The answer is " + result);
      out.innerHTML = `<pre class="code">Enter first operand: ${a}\nEnter operation to perform (+, -, *, /): ${o}\nEnter second operand: ${b}\n${lines.join("\n")}</pre>`;
    };
    host.append(slider({ id: "pp13a", label: "operand1", min: -20, max: 20, step: 1, value: a, show: String }, (x) => { a = x; draw(); }).el,
      toggle(OPS.map((o) => `'${o}'`), (i) => { op = i; draw(); }, 0),
      slider({ id: "pp13b", label: "operand2", min: -5, max: 5, step: 1, value: b, show: String }, (x) => { b = x; draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The if statement", mins: 20,
    blurb: "Run a statement only when a condition is nonzero. Plus two classic traps: indentation that lies, and = where you meant ==.",
    takeaway: "Chapter 6's three constructs (sequential, conditional, iteration) in C: if and if-else; while, for, do-while; plus switch, break, continue. if (condition) action; executes the action (a simple or compound statement) only if the condition expression is nonzero (true); parentheses separate the condition. A compound statement { } lets several statements depend on one condition. Indentation doesn't change behaviour: without braces only the first statement belongs to the if. Common mistake: if (x = 2) assigns 2 to x; an assignment expression has the assigned value, so the condition is always true. Correct: if (x == 2). The LC-3 compiler tests the opposite condition and branches around the action (LDR x; ADD #-2; BRnp past the assignment). if is a statement, so ifs can nest; if (x == 3) if (y != 6) {…} equals if ((x == 3) && (y != 6)) {…}.",
    steps: [
      { k: "learn", title: "Back to Chapter 6", b: [
        `<p>Top-down decomposition used three constructs: <b>sequential</b>, <b>conditional</b> and <b>iteration</b>. Chapter 12 only needed the first. This chapter gives you C's versions of the other two.</p>`,
        flows,
        seenPP("The three constructs and their LC-3 branch patterns.", "06-programming.html", "Chapter 6"),
      ]},
      { k: "learn", title: "if", b: [
        `<pre class="code" style="font-variant-ligatures:none">if (x <= 10)
   y = x * x + 5;</pre>`,
        `<p>The condition is any expression; nonzero means true. The action is <b>one</b> statement. To make several statements depend on the condition, wrap them in braces to form a compound statement.</p>`,
      ]},
      { k: "check", title: "Indentation lies", b: [
        `<pre class="code" style="font-variant-ligatures:none">if (x <= 10)
     y = x * x + 5;
     z = (2 * y) / 3;</pre>`,
        { t: "mcq", q: "x is 50. Which assignments happen?", opts: [["Only z = (2 * y) / 3", true, "Without braces, the if controls just the first statement. The indentation is decoration; the compiler ignores it."], ["Neither", false, "The second line isn't part of the if."], ["Both", false, "x <= 10 is false."]] },
      ]},
      { k: "learn", title: "= is not ==", b: [
        `<pre class="code">if (x = 2)   <span class="cm">// This condition is always true. Why?</span>
   y = 5;</pre>`,
        `<p><code>x = 2</code> is an assignment, and an assignment expression has the value that was assigned: 2, which is nonzero, so the condition is always true. It also clobbers x. What was meant: <code>if (x == 2)</code>. The LC-3 code tests the <i>opposite</i> and jumps around the action:</p>`,
        lc3(`          LDR R0, R5, #0    ; load x into R0
          ADD R0, R0, #-2   ; subtract 2 from x
          BRnp NOT_TRUE     ; if condition is not true, skip
          AND R0, R0, #0    ; R0 <- 0
          ADD R0, R0, #5    ; R0 <- 5
          STR R0, R5, #-1   ; y = 5;
NOT_TRUE  ...               ; the rest of the program`),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which single if is the same as <code>if (a > 0) if (b > 0) count++;</code>?", opts: [["if ((a > 0) && (b > 0)) count++;", true, "The inner if only runs when the outer condition holds: both must be true."], ["if ((a > 0) || (b > 0)) count++;", false, "That counts when either is positive."], ["if (a > 0 & b > 0) count++;", false, "It happens to work here since both sides are 0 or 1, but && is the logical operator to use."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is if (x = 2) almost always a bug?", model: "It assigns 2 to x instead of comparing. The value of an assignment expression is the value assigned, 2, which is nonzero, so the condition is always true, and x has been overwritten as a side effect. The comparison needs ==." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "if-else and chains of decisions", mins: 20,
    blurb: "Pick one of two actions, chain else-ifs into multi-way decisions, and learn which if an else belongs to.",
    takeaway: "if (condition) <code>action_if</code>; else <code>action_else</code>; replaces two ifs with opposite conditions; each action may be compound (Figure 13.2). LC-3 (Figure 13.3): load x; BRz ELSE; then-part; BR DONE; ELSE: else-part; DONE. Chains: if … else if … else if … else (Figure 13.4: days in a month; 30 for 4, 6, 9, 11; 31 for 1, 3, 5, 7, 8, 10, 12; 28 or 29 for 2; else don't know). An else belongs to the closest unassociated if: in if (x != 10) if (y > 3) z = z / 2; else z = z * 2; the else pairs with the inner if; braces change the association. Figure 13.5: if (divisor != 0) {divide and print} else print an error; put the common, non-error case first.",
    steps: [
      { k: "learn", title: "Two ways", b: [
        `<pre class="code" style="font-variant-ligatures:none">if (temperature <= 0)
   printf("At or below freezing point.\\n");
else
   printf("Above freezing.\\n");</pre>`,
        `<p>Exactly one of the two runs. The LC-3 version (Figure 13.3) needs two branches: one to skip to the else part, one at the end of the then part to jump over the else part.</p>`,
        lc3(`      LDR R0, R5, #0   ; load the value of x
      BRz ELSE         ; if x equals 0, perform else part
      ...              ; y++; z--;
      BR DONE
ELSE  ...              ; y--; z++;
DONE  ...`),
      ]},
      { k: "play", title: "A chain of decisions", b: [
        `<p>Figure 13.4 chains else-ifs. Predict the output for month 2, then for 13.</p>`,
        monthWidget,
      ]},
      { k: "play", title: "Which if owns the else?", b: [
        `<p>Rule: an <b>else belongs to the closest if that doesn't already have one</b>. Indentation doesn't matter. Before toggling, predict whether the two versions ever disagree.</p>`,
        danglingElse,
        `<p>They disagree whenever x is 10, and when x isn't 10 but y is small. Braces are the only way to pair the else with the outer if.</p>`,
      ]},
      { k: "learn", title: "Guarding against bad input", b: [
        code(`if (divisor != 0) {
   result = dividend / divisor;
   printf("The result of the division is %d\\n", result);
}
else
   printf("A divisor of zero is not allowed\\n");`, { nums: false }),
        `<p>Style: put the common case first, so a reader sees at a glance that the error case is the unusual one.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In a nested if without braces, how does C decide which if an else belongs to?", model: "The else attaches to the closest preceding if that doesn't already have an else, no matter how the code is indented. To attach it to an outer if instead, put braces around the inner if so it's closed off." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The while loop", mins: 20,
    blurb: "Repeat while a test is true: the natural loop when you don't know in advance how many times, and the classic infinite-loop bug.",
    takeaway: "C has three iteration constructs: while, for, do-while. while (test) <code>loop_body</code>; checks the test before each iteration and runs the body while it is nonzero (Figure 13.6); two branches: a conditional exit after the test and an unconditional branch back after the body (Figure 13.7: x from 0 printing 0…9; LDR x; ADD #-10; BRpz DONE; body; x = x + 1; BR LOOP). while suits sentinel-controlled loops, where the number of iterations isn't known but an event ends the loop (Chapters 5/7 character count with EOT): Figure 13.8 echoes characters until '\\n' (C delivers keyboard input only after Enter: Chapter 18). Infinite loop: the body never changes the condition (while (x < 10) printf(...); with no update).",
    steps: [
      { k: "learn", title: "while", b: [
        `<pre class="code" style="font-variant-ligatures:none">while (test)
   loop_body;</pre>`,
        `<p>The test is checked <b>before</b> every iteration. If it's false the first time, the body never runs at all.</p>`,
      ]},
      { k: "play", title: "Step through it", b: [
        `<p>Before stepping: how many times will the test be evaluated?</p>`,
        whileTrace,
        lc3(`      AND R0, R0, #0   ; x = 0;
      STR R0, R5, #0
LOOP  LDR R0, R5, #0   ; while (x < 10)
      ADD R0, R0, #-10
      BRpz DONE        ; x is not less than 10
      ...              ; call printf
      LDR R0, R5, #0
      ADD R0, R0, #1
      STR R0, R5, #0   ; x = x + 1;
      BR LOOP          ; end of iteration
DONE  ...`),
      ]},
      { k: "learn", title: "When to use while: a sentinel", b: [
        `<p>Use while when you don't know the count, only the event that ends the loop (the <b>sentinel</b>). Figure 13.8 echoes keystrokes until a newline:</p>`,
        code(`char echo = 'A';    // Initialize char variable echo

while (echo != '\\n') {
   scanf("%c", &echo);
   printf("%c", echo);
}`, { nums: false }),
        `<p>Why initialize echo to 'A'? So the very first test passes. (C actually hands the program your keystrokes only after you press Enter; Chapter 18 explains.)</p>`,
        seenPP("The character-counting program's sentinel loop in LC-3 assembly.", "07-assembly.html", "Chapter 7"),
      ]},
      { k: "check", title: "Spot the mistake", b: [
        code(`int x = 0;
while (x < 10)
   printf("%d ", x);`, { nums: false }),
        { t: "mcq", q: "What happens?", opts: [["It prints 0 forever: nothing in the body changes x", true, "An infinite loop. The test can never become false."], ["It prints 0 to 9", false, "Nothing increments x."], ["It prints nothing", false, "0 < 10 is true."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What has to be true of a while loop's body for the loop to ever end?", model: "Something in the body (or something it calls, or an input it reads) must eventually change the values the test depends on, so that the test becomes false. If nothing can change them, the test stays true and the loop runs forever." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The for loop", mins: 25,
    blurb: "init, test, update, body: the counter-controlled loop. Watch each phase, see the LC-3 it becomes, and catch a semicolon that eats the loop.",
    takeaway: "for (init; test; update) <code>loop_body</code>; is a special case of while suited to counter-controlled loops. init is evaluated once before the first iteration (may be a declaration, whose scope is then the for statement only, keeping loop variables local); test before every iteration (zero ends the loop); update at the end of every iteration; the body may be compound (Figure 13.9). for (x = 0; x < 10; x++) prints 0…9, exactly ten times. Figure 13.10: LC-3 for sum = sum + x over x = 0…9 (init; LOOP test BRpz DONE; body; reinit x++; BR LOOP). (Book slip: line 17 stores R0, which holds x, but the sum is in R1: it should be STR R1, R5, #-1.) Misplaced semicolon: for (x = 0; x < 10; x++); makes the empty statement the body, so sum = sum + x runs once after the loop: prints sum = 10 and x = 10. Rule of thumb: while for sentinel loops, for for known iteration counts; they are largely interchangeable.",
    steps: [
      { k: "learn", title: "Four parts", b: [
        `<pre class="code" style="font-variant-ligatures:none">for (init; test; update)
   loop_body;</pre>`,
        `<ul><li><b>init</b>: once, before anything else.</li><li><b>test</b>: before every iteration; 0 ends the loop.</li><li><b><code>loop_body</code></b>: the work.</li><li><b>update</b>: after every iteration, then back to the test.</li></ul>`,
        `<p>It's a while loop with the counter bookkeeping gathered into one line, perfect when you know how many iterations you want.</p>`,
      ]},
      { k: "play", title: "Watch the phases", b: [
        `<p>Sum 0 through 9. Predict the order of phases for the first two iterations, then step.</p>`,
        forTrace,
      ]},
      { k: "learn", title: "The LC-3 version", b: [
        lc3(`      AND R0, R0, #0   ; clear out R0
      STR R0, R5, #-1  ; sum = 0;
      AND R0, R0, #0   ; init (x = 0)
      STR R0, R5, #0
LOOP  LDR R0, R5, #0   ; test
      ADD R0, R0, #-10
      BRpz DONE        ; x is not less than 10
      LDR R0, R5, #0   ; get x
      LDR R1, R5, #-1  ; get sum
      ADD R1, R1, R0   ; sum + x
      STR R1, R5, #-1  ; sum = sum + x;
      LDR R0, R5, #0   ; update: x++
      ADD R0, R0, #1
      STR R0, R5, #0
      BR LOOP
DONE  ...`),
        `<p class="aside">Book slip: Figure 13.10's line 17 reads <code>STR R0, R5, #-1</code>, which would store x into sum. The new sum is in R1, as above.</p>`,
      ]},
      { k: "learn", title: "Declaring the counter in the loop", b: [
        `<pre class="code" style="font-variant-ligatures:none">for (int x = 0; x < 10; x++)
   printf("%d ", x);</pre>`,
        `<p>Same output as before. The difference: this x exists <b>only inside the for statement</b>. No stray loop variables cluttering the rest of the function.</p>`,
      ]},
      { k: "play", title: "The book's puzzle", b: [
        `<p>The book asks: what do these printfs output, and why? Predict, then step.</p>`,
        semiTrace,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In what order do the four parts of a for loop run?", model: "init runs once at the start. Then the test is checked; if it is nonzero the body runs, then the update, and control goes back to the test. This repeats until the test is zero, at which point the loop ends without running the body or the update again." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Nested loops", mins: 15,
    blurb: "A loop inside a loop: the inner one runs completely on every pass of the outer one.",
    takeaway: "A nested loop has a loop body containing another loop. Figure 13.11 prints a 10 × 10 multiplication table: the outer loop picks multiplicand 0…9, the inner loop prints multiplier × multiplicand for multiplier 0…9 with \\t (tab) for alignment, then printf(\"\\n\") ends the row; the inner loop iterates ten times per outer iteration (100 products). Inner loop counts can depend on the outer loop's variable (Figure 13.12: inner runs 0, 1, 2, … times).",
    steps: [
      { k: "learn", title: "A loop in a loop", b: [
        code(`for (int multiplicand = 0; multiplicand < 10; multiplicand++) {
   // Inner Loop
   for (int multiplier = 0; multiplier < 10; multiplier++)
      printf("%d\\t", multiplier * multiplicand);
   printf("\\n");
}`, { nums: false }),
        `<p><code>\\t</code> prints a tab, lining up the columns.</p>`,
      ]},
      { k: "play", title: "One row per outer pass", b: [
        multTable,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An outer loop runs 6 times and its inner loop runs 4 times per pass. How many times does the inner loop's body run in total?", a: 24, tol: 0, why: "6 × 4 = 24." },
      ]},
      { k: "learn", title: "Inner loops that depend on the outer", b: [
        `<p>The inner loop's bounds can use the outer variable. In Figure 13.12, the inner loop runs <code>outer</code> times: 0 times, then 1, then 2, …. That triangular shape shows up in many algorithms later in the book.</p>`,
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "do-while, and choosing a loop", mins: 20,
    blurb: "Test at the bottom, so the body always runs at least once. Then the book's e-mail checker, which needs exactly that.",
    takeaway: "do <code>loop_body</code>; while (test); evaluates the test after each iteration, so the body runs at least once (Figure 13.13: body and test swapped compared with while; the conditional branch goes back to the top of the body). x = 0; do { printf; x = x + 1; } while (x < 10); prints 0…9. The three loops are largely interchangeable; the choice conveys intent: while/do-while for sentinel loops, for for counter loops. Figure 13.23 (Problem 3): read an e-mail address one char at a time with scanf(\"%c\") in a do-while that stops at a space or '\\n'; set gotAt on '@' and gotDot on '.' only once gotAt; valid if both (simple definition: an @ followed later by a period). A string (array of chars) would be better (Chapter 16).",
    steps: [
      { k: "learn", title: "Test at the bottom", b: [
        `<pre class="code" style="font-variant-ligatures:none">x = 0;
do {
   printf("%d \\n", x);
   x = x + 1;
} while (x < 10);</pre>`,
        `<p>Same 0…9 output as the while version. The difference: the body runs <b>before</b> the first test.</p>`,
        fig(flow("do")),
      ]},
      { k: "play", title: "The e-mail checker (Figure 13.23)", b: [
        `<p>The program has to read a character before it can test it, so a test-at-the-bottom loop fits. The book's simple rule: valid if there's an @ and, somewhere after it, a period. Try to fool it: what does it accept that isn't really an address?</p>`,
        emailCheck,
        `<p>It accepts <code>@.</code> on its own. The book keeps the rule simple on purpose; better checks need strings (Chapter 16).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which loop says what you mean?", bins: ["for", "while", "do-while"], items: [
          ["Print the first 50 squares", 0, "Known count: counter-controlled."],
          ["Keep reading numbers until the user types −1, which shouldn't be processed", 1, "Sentinel loop; test before processing."],
          ["Show a menu, act on the choice, and repeat until the user picks Quit; the menu must appear at least once", 2, "The body has to run before there's anything to test."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between a while loop and a do-while loop?", model: "A while loop checks its test before each iteration, so if the test is false at the start the body never runs. A do-while runs the body first and checks the test afterwards, so the body always runs at least once." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Problem solving: π and primes", mins: 25,
    blurb: "Two of the book's worked problems: a series that slowly converges to π, and a nested loop that finds the primes below 100.",
    takeaway: "Problem 1: π = 4 − 4/3 + 4/5 − 4/7 + … + (−1)^(n−1)·4/(2n − 1), for a user-given number of terms. Step 0: choose the representation: double. Stepwise refinement: initialize, get input, evaluate series, output (Figure 13.14); evaluate series = counter-controlled loop (Figure 13.15, shaped like a for); evaluate another term = decision: add odd terms, subtract even ones (Figure 13.16). Figure 13.17: for (int count = 1; count <= numOfTerms; count++) if (count % 2) pi += 4.0/(2.0*count − 1); else pi −= …; printf(\"%f\", pi). Converges slowly. Problem 2: primes < 100 (Figures 13.18–13.21). ints; outer for num = 2…100; assume prime; inner for divisor = 2…10: if num % divisor == 0 and num != divisor, not prime; any composite ≤ 100 has a divisor 2…10. bool from stdbool.h.",
    steps: [
      { k: "learn", title: "Refine until it's code", b: [
        `<p>Both problems follow the same recipe: <b>step 0</b>, choose the data types; then refine top-down until every box maps to a C construct. A box that says “do this N times” becomes a for loop; “add or subtract depending on…” becomes an if-else.</p>`,
      ]},
      { k: "play", title: "Problem 1: approximate π", b: [
        `<p>π = 4 − 4/3 + 4/5 − 4/7 + …  Odd-numbered terms are added, even ones subtracted, hence <code>if (count % 2)</code>. Fractions mean <b>double</b>.</p>`,
        code(`for (int count = 1; count <= numOfTerms; count++) {
   if (count % 2)
      pi = pi + (4.0 / (2.0 * count - 1)); // Odd term
   else
      pi = pi - (4.0 / (2.0 * count - 1)); // Even term
}`, { nums: false }),
        `<p>Predict: how many terms to get 3.14?</p>`,
        piWidget,
        `<p>It zigzags around π and closes in slowly: even 500 terms only gets about 3 decimal places.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does the program write <code>4.0 / (2.0 * count - 1)</code> rather than <code>4 / (2 * count - 1)</code>?", opts: [["With all ints, the division would be integer division: 4/3 = 1, 4/5 = 0, …", true, "A floating-point operand makes the whole expression floating point."], ["4.0 is more accurate than 4", false, "They're the same value; the type is what matters."], ["C can't divide ints", false, "It can, but drops the fraction."]] },
      ]},
      { k: "play", title: "Problem 2: primes below 100", b: [
        `<p>Outer loop: each num from 2 to 100. Inner loop: try every divisor from 2 to 10. Why stop at 10? Any non-prime up to 100 has a factor no bigger than 10 (since 11 × 11 = 121).</p>`,
        code(`for (int num = 2; num <= 100; num++) {
   prime = true; // Assume the number is prime

   // Test if the candidate number is a prime
   for (int divisor = 2; divisor <= 10; divisor++)
      if (((num % divisor) == 0) && num != divisor)
         prime = false;

   if (prime)
      printf("The number %d is prime\\n", num);
}`, { nums: false }),
        primeGrid,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is the line <code>prime = true;</code> inside the outer loop, not just once before it?", opts: [["Each number starts out assumed prime; otherwise one false would stick for every later number", true, "It resets the flag for each candidate."], ["To declare prime", false, "It's declared earlier."], ["It's needed for the inner loop's test", false, "The inner loop's test is divisor <= 10."]] },
        { t: "mcq", q: "Why does the test include <code>num != divisor</code>?", opts: [["So that 2, 3, 5 and 7 aren't ruled out by dividing themselves", true, "7 % 7 == 0, but 7 is prime."], ["To avoid dividing by zero", false, "divisor starts at 2."], ["It's not needed", false, "Try clicking 7 without it in mind."]] },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "switch, break and continue", mins: 20,
    blurb: "A multi-way decision on one integer value, and two ways to cut a loop short.",
    takeaway: "switch (expression) { case constant: statements … default: … } replaces a cascade of if-else on one value. The expression must be integral (int or char); control jumps to the matching case label; each case is a sequence of statements (no braces needed); labels must be unique constant expressions. break jumps to the closing brace of the switch; without it, control falls through into the next case (rarely wanted). default runs if no case matches; with no default and no match, nothing runs. Good style: break after the last case too. break in a loop exits the loop immediately; continue ends the current iteration (the next may run, per the loop's condition). Both compile to unconditional branches. Examples: break at i == 5 prints 0 1 2 3 4; continue at i == 5 prints 0 1 2 3 4 6 7 8 9. Figure 13.24: calculator reading operand, operator (scanf(\"\\n%c\") skips the newline), operand; switch on '+', '-', '*', '/' (with divide-by-zero check), default \"Invalid operation!\". The book uses none of these three constructs later.",
    steps: [
      { k: "learn", title: "switch", b: [
        `<p>When you choose among many actions based on one value, a chain of <code>else if (keyPress == 'a')</code> tests gets long. <code>switch</code> jumps straight to the matching <b>case</b>.</p>`,
        `<ul><li>The switch expression must be an integer type (int, char).</li><li>Each case label must be a unique <b>constant</b>.</li><li><code>break</code> leaves the switch. <code>default:</code> catches everything else.</li></ul>`,
      ]},
      { k: "play", title: "Fall-through", b: [
        `<p>Turn a break off and pick that key. Predict what runs first.</p>`,
        switchWidget,
        `<p>Without a break, execution just keeps going into the next case's statements. Style rule: put a break even after the last case, so adding a case later can't create an accidental fall-through.</p>`,
      ]},
      { k: "learn", title: "break and continue in loops", b: [
        `<div class="two"><div class="tile"><pre class="code">for (i = 0; i < 10; i++) {
   if (i==5)
      break;
   printf("%d ", i);
}</pre><p>Output: <code>0 1 2 3 4</code>. break leaves the loop.</p></div><div class="tile"><pre class="code">for (i = 0; i < 10; i++) {
   if (i==5)
      continue;
   printf("%d ", i);
}</pre><p>Output: <code>0 1 2 3 4 6 7 8 9</code>. continue skips the rest of this iteration only.</p></div></div>`,
        `<p>Both become unconditional branches in LC-3 code: break to the end of the loop, continue to the update/test.</p>`,
      ]},
      { k: "play", title: "The calculator (Figure 13.24)", b: [
        `<p>The switch picks the operation; the '/' case checks for zero; default catches anything else. Try dividing by 0 and an invalid operator. Is the last line of output right?</p>`,
        calcWidget,
      ]},
      { k: "check", title: "Think critically", b: [
        { t: "mcq", q: "After “Divide by 0 error!” the program still prints “The answer is 0”. What's the cleanest fix?", opts: [["Only print the answer when the operation succeeded, e.g. with a flag set in the error branches", true, "The error paths should skip the final printf."], ["Initialize result to −1", false, "Then it would print a wrong answer of −1."], ["Remove the default case", false, "Then invalid operators would silently print 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does break do inside a switch, and what happens if you leave it out?", model: "break jumps to the end of the switch, so only the matching case's statements run. Without it, after the matching case's statements, execution falls through into the next case's statements and keeps going until it reaches a break or the end of the switch." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp13", eyebrow: "Patt & Patel · Chapter 13", title: "Control Structures",
    intro: `<p>Eight parts: if and if-else, the three loops (while, for, do-while), nested loops, the book's worked problems (π, primes, e-mail addresses), and switch, break and continue.</p><p>You'll step through loops phase by phase, watch which if owns an else, and switch break statements on and off. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For “what is the output” questions, make a table with one column per variable and one row per iteration, and fill it in line by line before writing the answer.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Decisions</h3>
      <p><code>if (cond) stmt;</code>: nonzero = true; braces for several statements; indentation is ignored; <code>=</code> vs <code>==</code>. <code>if … else</code>; else-if chains; an else belongs to the closest unmatched if. LC-3: branch on the opposite condition around the action.</p>
      <h3>Loops</h3>
      <p><code>while (test) body;</code>: test first, sentinel loops. <code>for (init; test; update) body;</code>: counter loops; a declared init variable is local to the loop; a stray <code>;</code> after the <code>)</code> empties the loop. <code>do body; while (test);</code>: at least once. Nested loops multiply iteration counts.</p>
      <h3>Other control</h3>
      <p><code>switch</code> on an integer with constant <code>case</code> labels, <code>break</code> (else fall-through), <code>default</code>. <code>break</code> leaves a loop; <code>continue</code> ends the current iteration.</p>`,
  };
  Course.start(window.CHAPTER);
})();

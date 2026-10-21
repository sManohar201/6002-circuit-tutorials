(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { code, trace, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const lc3 = (t) => Digital.listing(t, { comment: ";" });
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const field = "font:inherit;font-family:var(--mono);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink)";
  const hx = (n) => "x" + n.toString(16).toUpperCase().padStart(4, "0");

  /* ---------- Figure 16.1: Swap fails ---------- */
  const SWAP = `int main(void)
{
   int valueA = 3;
   int valueB = 4;

   Swap(valueA, valueB);
   printf("valueA = %d and valueB = %d\\n", valueA, valueB);
}

void Swap(int firstVal, int secondVal)
{
   int tempVal; // Holds firstVal when swapping

   tempVal = firstVal;
   firstVal = secondVal;
   secondVal = tempVal;
}`;
  const SW = (t, f, s, inSwap) => [["xEFF3", t, "tempVal", inSwap ? "Swap's frame" : ""], ["xEFF4", "xEFFB…", "main's frame pointer", inSwap ? "Swap's frame" : ""], ["xEFF5", "x30..", "return address in main", inSwap ? "Swap's frame" : ""], ["xEFF6", "", "return value to main", inSwap ? "Swap's frame" : ""], ["xEFF7", f, "firstVal", inSwap ? "Swap's frame" : ""], ["xEFF8", s, "secondVal", inSwap ? "Swap's frame" : ""], ["xEFF9", 4, "valueB", "main's frame"], ["xEFFA", 3, "valueA", "main's frame"]].filter((r, i) => inSwap || i >= 6);
  const swapTrace = (host) => trace(host, { code: SWAP, stateTitle: "Run-time stack", frames: [
    { l: 4, m: SW(), note: "main's two locals." },
    { l: 6, m: SW("?", 3, 4, true), note: "The call pushes the <b>values</b> 4 and then 3. Swap's parameters are new variables holding copies." },
    { l: 14, m: SW(3, 3, 4, true) },
    { l: 15, m: SW(3, 4, 4, true) },
    { l: 16, m: SW(3, 4, 3, true), note: "Swap has swapped… its own copies." },
    { l: 7, m: SW(), out: "valueA = 3 and valueB = 4\n", note: "Swap's frame is popped and the swapped copies vanish. main's variables were never touched." },
  ] });

  /* ---------- & and * ---------- */
  const PTR = `int object;
int *ptr;

object = 4;
ptr = &object;
*ptr = *ptr + 1;`;
  const PM = (o, p) => [["xEFF1", p, "ptr", ""], ["xEFF2 ← R5", o, "object", ""]];
  const ptrTrace = (host) => trace(host, { code: PTR, stateTitle: "Memory", frames: [
    { l: 2, m: PM("?", "?"), note: "Two locals: object at R5 = xEFF2, ptr just below. Both uninitialized." },
    { l: 4, m: PM(4, "?"), note: lc3("AND R0, R0, #0\nADD R0, R0, #4\nSTR R0, R5, #0  ; object = 4;") },
    { l: 5, m: PM(4, "xEFF2"), note: "&object is the <b>address</b> of object. No load needed: just compute R5 + 0." + lc3("ADD R0, R5, #0  ; address of object\nSTR R0, R5, #-1 ; ptr = &object;") },
    { l: 6, m: PM(5, "xEFF2"), note: "On the right, *ptr is the value at the address in ptr (4). On the left, *ptr is the location to write. Two loads: one for ptr, one through it." + lc3("LDR R0, R5, #-1 ; R0 = ptr\nLDR R1, R0, #0  ; R1 = *ptr\nADD R1, R1, #1\nSTR R1, R0, #0  ; *ptr = *ptr + 1;") },
  ] });

  /* ---------- Figure 16.4: NewSwap ---------- */
  const NEWSWAP = `int main(void)
{
   int valueA = 3;
   int valueB = 4;

   NewSwap(&valueA, &valueB);
   printf("valueA = %d and valueB = %d\\n", valueA, valueB);
}

void NewSwap(int *firstVal, int *secondVal)
{
   int tempVal; // Holds firstVal when swapping

   tempVal = *firstVal;
   *firstVal = *secondVal;
   *secondVal = tempVal;
}`;
  const NS = (t, a, b, inSwap) => [["xEFF3", t, "tempVal", "NewSwap's frame"], ["xEFF4–6", "…", "bookkeeping, return slot", "NewSwap's frame"], ["xEFF7", "xEFFA", "firstVal (points to valueA)", "NewSwap's frame"], ["xEFF8", "xEFF9", "secondVal (points to valueB)", "NewSwap's frame"], ["xEFF9", b, "valueB", "main's frame"], ["xEFFA", a, "valueA", "main's frame"]].filter((r, i) => inSwap || i >= 4);
  const newSwapTrace = (host) => trace(host, { code: NEWSWAP, stateTitle: "Run-time stack", frames: [
    { l: 6, m: NS("?", 3, 4, true), note: "The call passes <b>addresses</b>: &valueA = xEFFA and &valueB = xEFF9 (Figure 16.5)." },
    { l: 14, m: NS(3, 3, 4, true), note: "Read through firstVal: the value at xEFFA." },
    { l: 15, m: NS(3, 4, 4, true), note: "Write through firstVal: this changes valueA itself, in main's frame." },
    { l: 16, m: NS(3, 4, 3, true) },
    { l: 7, m: NS(3, 4, 3, false), out: "valueA = 4 and valueB = 3\n", note: "Swapped. The arguments were still passed by value, but the values were addresses." },
  ] });

  /* ---------- Figure 16.6: IntDivide ---------- */
  function intDivide(host) {
    let x = 17, y = 5;
    const out = el(`<div></div>`);
    const draw = () => {
      const err = y === 0 ? -1 : 0;
      out.innerHTML = readout([["error = IntDivide(dividend, divisor, &quotient, &remainder)", err], ["quotient (written through quoPtr)", err ? "unchanged" : Math.trunc(x / y)], ["remainder (written through remPtr)", err ? "unchanged" : x % y]]) + `<pre class="code">${err ? "IntDivide failed." : `Answer: ${Math.trunc(x / y)} remainder ${x % y}`}</pre>`;
    };
    host.append(slider({ id: "pp16x", label: "dividend", min: 0, max: 60, step: 1, value: x, show: String }, (v) => { x = v; draw(); }).el,
      slider({ id: "pp16y", label: "divisor", min: 0, max: 9, step: 1, value: y, show: String }, (v) => { y = v; draw(); }).el, out); draw();
  }

  /* ---------- an array in memory ---------- */
  function arrayMem(host) {
    let i = 3;
    const base = 0xeff0, vals = [12, 7, 30, 5, 18, 2, 9, 44, 1, 6];
    const out = el(`<div></div>`);
    const draw = () => {
      let s = "";
      for (let k = 0; k < 12; k++) {
        const y = 10 + k * 22, inside = k < 10, hit = k === i;
        s += `<rect x="120" y="${y}" width="110" height="20" style="fill:${hit ? (inside ? "var(--accent-soft)" : "var(--bad-soft)") : inside ? "var(--card)" : "none"};stroke:var(--ink);stroke-width:1${inside ? "" : ";stroke-dasharray:4 3"}"/>` +
          S.t(110, y + 15, hx(base + k), { a: "end", cls: "lab" }) + S.t(175, y + 15, inside ? String(vals[k]) : k === 10 ? "other var" : "?", { cls: "lab" }) + S.t(240, y + 15, inside ? `grid[${k}]` : "", { a: "start", cls: "lab" });
      }
      out.innerHTML = fig(S.svg(320, 280, s, { max: 320, label: "Array grid in memory" })) +
        readout([["Base address (grid = &grid[0])", hx(base)], [`Address of grid[${i}]`, `${hx(base)} + ${i} = ${hx(base + i)}`], [`grid[${i}]`, i < 10 ? vals[i] : `<span style="color:var(--bad)">past the end: C doesn't check. This reads whatever lives there.</span>`]]);
    };
    host.append(slider({ id: "pp16i", label: "index i", min: 0, max: 11, step: 1, value: i, show: String }, (v) => { i = v; draw(); }).el, out); draw();
  }

  /* ---------- Figure 16.9: repeats ---------- */
  function repeatsWidget(host) {
    const inp = el(`<input type="text" value="115 7 115 3 7 115 9 115 0 3" aria-label="ten numbers" style="${field};width:20em">`), out = el(`<div></div>`);
    const draw = () => {
      const nums = inp.value.trim().split(/[\s,]+/).map(Number).filter((v) => !isNaN(v)).slice(0, 10);
      const reps = nums.map((v) => nums.filter((w) => w === v).length);
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);font-size:13px;text-align:center"><tbody><tr><th>index</th>${nums.map((_, k) => `<td>${k}</td>`).join("")}</tr><tr><th>numbers</th>${nums.map((v) => `<td>${v}</td>`).join("")}</tr><tr><th>repeats</th>${reps.map((r) => `<td style="${r > 1 ? "background:var(--accent-soft)" : ""}">${r}</td>`).join("")}</tr></tbody></table></div><p class="aside">${nums.length} numbers → the nested loops make ${nums.length} × ${nums.length} = ${nums.length ** 2} comparisons. Every number counts itself, so the smallest possible repeat count is 1.</p>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>Ten numbers: </label>`); lab.append(inp);
    host.append(lab, out); draw();
  }

  /* ---------- strings ---------- */
  function stringMem(host) {
    const inp = el(`<input type="text" value="giraffe" maxlength="14" aria-label="word" style="${field};width:10em">`), out = el(`<div></div>`);
    const draw = () => {
      const w = inp.value.replace(/\s.*/, "");
      const cells = []; for (let k = 0; k < 10; k++) { const c = k < w.length ? w[k] : k === w.length ? "\\0" : "?"; cells.push(`<td style="${k === w.length ? "background:var(--accent-soft)" : k > w.length ? "opacity:.4" : ""}">${esc(c)}</td>`); }
      const over = w.length > 9;
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);text-align:center"><tbody><tr><th>word[i]</th>${cells.join("")}${over ? `<td style="background:var(--bad-soft)">${esc(w.slice(10))}\\0 →</td>` : ""}</tr><tr><th>i</th>${Array.from({ length: 10 }, (_, k) => `<td>${k}</td>`).join("")}${over ? "<td>10…</td>" : ""}</tr></tbody></table></div>` +
        `<p>${over ? `<span style="color:var(--bad)">"${esc(w)}" needs ${w.length + 1} slots including the null. It doesn't fit in char word[10]: the extra characters would be written past the end of the array, over whatever is next on the stack.</span>` : `StringLength counts ${w.length} characters before the '\\0'. ${9 - w.length} slot${9 - w.length === 1 ? "" : "s"} to spare.`}</p>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>char word[10] = </label>`); lab.append(inp);
    host.append(lab, out); draw();
  }
  function reverseWidget(host) {
    const inp = el(`<input type="text" value="stressed" maxlength="19" aria-label="word" style="${field};width:10em">`), out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    let k = 0;
    const bNext = btn("Next CharSwap", "primary"), bReset = btn("Start over");
    const draw = () => {
      const w = [...inp.value.replace(/\s.*/, "")], L = w.length, half = Math.floor(L / 2);
      for (let j = 0; j < Math.min(k, half); j++) [w[j], w[L - 1 - j]] = [w[L - 1 - j], w[j]];
      const a = k < half ? k : -1, b = k < half ? L - 1 - k : -1;
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);text-align:center;font-size:18px"><tbody><tr>${w.map((c, j) => `<td style="${j === a || j === b ? "background:var(--accent-soft)" : j < k || j > L - 1 - k ? "background:var(--good-soft)" : ""}">${esc(c)}</td>`).join("")}<td style="opacity:.5">\\0</td></tr></tbody></table></div>` +
        `<p>${k < half ? `index = ${k}: CharSwap(&string[${k}], &string[${L} − (${k} + 1)]) swaps positions ${a} and ${b}.` : `Done after length / 2 = ${half} swaps. The word reversed is ${esc(w.join(""))}.`}</p>`;
      bNext.disabled = k >= half;
    };
    bNext.addEventListener("click", () => { k++; draw(); }); bReset.addEventListener("click", () => { k = 0; draw(); });
    inp.addEventListener("input", () => { k = 0; draw(); });
    const lab = el(`<label>Input a word: </label>`); lab.append(inp);
    row.append(bNext, bReset); host.append(lab, row, out); draw();
  }

  /* ---------- Table 16.1 ---------- */
  function ptrTable(host) {
    let n = 3;
    const w = "giraffe", base = 0xeff0;
    const out = el(`<div></div>`);
    const draw = () => {
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);font-size:14px"><thead><tr><th></th><th>pointer</th><th>array name</th><th>array notation</th><th>value</th></tr></thead><tbody>
        <tr><td>address of element ${n}</td><td>cptr + ${n}</td><td>word + ${n}</td><td>&amp;word[${n}]</td><td>${hx(base + n)}</td></tr>
        <tr><td>element ${n}</td><td>*(cptr + ${n})</td><td>*(word + ${n})</td><td>word[${n}]</td><td>'${n < w.length ? w[n] : "\\0"}'</td></tr></tbody></table></div><p class="aside">With <code>char word[10] = "giraffe"; char *cptr = word;</code> and word at ${hx(base)}. Adding n to a pointer moves n <i>elements</i>.</p>`;
    };
    host.append(slider({ id: "pp16n", label: "n", min: 0, max: 7, step: 1, value: n, show: String }, (v) => { n = v; draw(); }).el, out); draw();
  }

  /* ---------- Figure 16.14: insertion sort ---------- */
  function insertionSort(host) {
    const START = [16, 2, 69, 68, 15, 9, 10, 7, 82, 19];
    const steps = [];
    const list = START.slice();
    steps.push({ list: list.slice(), note: "Start. The sorted part is just list[0].", hl: [], sortedEnd: 0 });
    for (let u = 1; u < list.length; u++) {
      const item = list[u]; let s = u - 1;
      steps.push({ list: list.slice(), note: `unsorted = ${u}: take unsortedItem = ${item} out.`, hl: [u], sortedEnd: u - 1, item });
      while (s >= 0 && list[s] > item) { list[s + 1] = list[s]; steps.push({ list: list.slice(), note: `list[${s}] = ${list[s]} > ${item}: copy it up to list[${s + 1}].`, hl: [s + 1], sortedEnd: u, item }); s--; }
      list[s + 1] = item;
      steps.push({ list: list.slice(), note: s >= 0 ? `list[${s}] = ${list[s]} is not > ${item}: stop, insert at list[${s + 1}].` : `Reached the front: insert at list[0].`, hl: [s + 1], sortedEnd: u, ins: true });
    }
    let k = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const bNext = btn("Step", "primary"), bBack = btn("◀ Back"), bJump = btn("Next item ▶▶"), bReset = btn("Start over");
    const draw = () => {
      const st = steps[k], H = 130, max = 90;
      let s = "";
      st.list.forEach((v, j) => {
        const h = (v / max) * (H - 30), x = 10 + j * 40, col = st.hl.includes(j) ? (st.ins ? "var(--good)" : "var(--accent)") : j <= st.sortedEnd ? "var(--cool)" : "var(--muted)";
        s += `<rect x="${x}" y="${H - 20 - h}" width="32" height="${h}" style="fill:${col}"/>` + S.t(x + 16, H - 6, String(v), { cls: "lab" }) + S.t(x + 16, H - 24 - h, "", { cls: "lab" });
      });
      out.innerHTML = fig(S.svg(410, H, s, { max: 410, label: "Insertion sort bars" })) + `<p class="mono">list = [${st.list.join(" ")}]${st.item != null ? `   unsortedItem = ${st.item}` : ""}</p><p>${st.note}</p><p class="aside">Blue = sorted part. Step ${k + 1} of ${steps.length}.</p>`;
      bNext.disabled = bJump.disabled = k === steps.length - 1; bBack.disabled = k === 0;
    };
    bNext.addEventListener("click", () => { k++; draw(); }); bBack.addEventListener("click", () => { k--; draw(); }); bReset.addEventListener("click", () => { k = 0; draw(); });
    bJump.addEventListener("click", () => { do { k++; } while (k < steps.length - 1 && !steps[k].ins); draw(); });
    row.append(bBack, bNext, bJump, bReset); host.append(row, out); draw();
  }

  /* ---------- Figure 16.15: writing past the end ---------- */
  function overrun(host) {
    let limit = 12;
    const out = el(`<div></div>`);
    const draw = () => {
      // locals: index at R5, array[0..9] at R5-10 .. R5-1, limit at R5-11. array[10] is R5: index.
      const lines = []; let index = 0, loops = 0, steps = 0;
      for (index = 0; index < limit && steps < 40; index++, steps++) {
        if (index === 10) { lines.push(`array[10] = 0 lands on index itself → index = 0`); index = 0; loops++; }
        lines.push(`array[${index}] is set to 0`);
      }
      const inf = limit > 10;
      out.innerHTML = fig(S.svg(340, 270, [["R5 − 11", "limit"], ["R5 − 10", "array[0]"], ["R5 − 9", "array[1]"], ["…", "…"], ["R5 − 1", "array[9]"], ["R5 + 0", "index"]].map(([a, n], k) => `<rect x="120" y="${20 + k * 34}" width="180" height="30" style="fill:${n === "index" && inf ? "var(--bad-soft)" : n.startsWith("array") ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(110, 40 + k * 34, a, { a: "end", cls: "lab" }) + S.t(210, 40 + k * 34, n === "index" && inf ? "index = array[10]!" : n, { cls: "lab" })).join("") + S.t(210, 250, "x0000 is up, xFFFF is down", { cls: "lab" }), { max: 340, label: "Stack frame of Figure 16.15" })) +
        `<pre class="code" style="max-height:200px;overflow:auto">${lines.slice(0, 30).join("\n")}${inf ? "\n… forever" : ""}</pre><p>${inf ? `<span style="color:var(--bad)">With limit ${limit}, the loop writes array[10], which is really index. index drops to 0 and the loop never reaches ${limit}: an infinite loop.</span>` : "Within bounds: works as intended."}</p>`;
    };
    host.append(slider({ id: "pp16l", label: "limit you type", min: 1, max: 20, step: 1, value: limit, show: String }, (v) => { limit = v; draw(); }).el, out); draw();
  }

  /* ---------- 2-D arrays: row-major ---------- */
  function rowMajor(host) {
    let r = 1, c = 2;
    const ROWS = 3, COLS = 4, base = 0xa000;
    const out = el(`<div></div>`);
    const draw = () => {
      let g = `<div class="tbl"><table style="font-family:var(--mono);font-size:13px;text-align:center"><tbody>`;
      for (let i = 0; i < ROWS; i++) g += `<tr>${Array.from({ length: COLS }, (_, j) => `<td style="${i === r && j === c ? "background:var(--accent-soft);font-weight:700" : ""}">[${i}][${j}]<br>${hx(base + i * COLS + j)}</td>`).join("")}</tr>`;
      out.innerHTML = g + `</tbody></table></div>` + readout([["Address of a[" + r + "][" + c + "]", `base + ${r} × ${COLS} + ${c} = ${hx(base + r * COLS + c)}`]]) + `<p class="aside">Memory order: a[0][0], a[0][1], a[0][2], a[0][3], a[1][0], … The rightmost index changes fastest: row-major order.</p>`;
    };
    host.append(el(`<p class="mono">int a[3][4];   // at ${hx(base)}</p>`), slider({ id: "pp16r", label: "row", min: 0, max: ROWS - 1, step: 1, value: r, show: String }, (v) => { r = v; draw(); }).el,
      slider({ id: "pp16c", label: "column", min: 0, max: COLS - 1, step: 1, value: c, show: String }, (v) => { c = v; draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why Swap doesn't swap", mins: 15,
    blurb: "A function that tries to swap its caller's variables, and why pass-by-value defeats it.",
    takeaway: "Pointers and arrays are old friends from LC-3 code, now formalized. A pointer is the address of a memory object; with pointers we can access objects indirectly: write functions that modify the caller's arguments, and build data structures that grow and shrink. An array is a list of same-type objects arranged sequentially in memory, accessed by index starting at 0 (a[4] is the fifth). Figure 16.1: Swap(valueA, valueB) exchanges its parameters firstVal and secondVal, but valueA and valueB stay 3 and 4: C always passes arguments by value: each argument expression is evaluated and its value pushed; Swap modifies its own copies in its own stack frame (Figure 16.2), which are lost when the frame is popped. To modify main's variables Swap needs their addresses.",
    steps: [
      { k: "learn", title: "Two old friends", b: [
        `<p>A <b>pointer</b> is the address of something in memory. An <b>array</b> is a row of same-type items side by side in memory, numbered from 0. You've used both in LC-3 code (LDR through an address, strings of characters). Now C gets them formally.</p>`,
        seenPP("Addresses, LDR/STR and arrays of characters in LC-3 code.", "05-lc3.html", "Chapter 5"),
      ]},
      { k: "play", title: "Figure 16.1, on the stack", b: [
        `<p>Swap is supposed to exchange main's two values. Predict the output, then step through and watch the stack.</p>`,
        swapTrace,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why doesn't Swap change valueA and valueB?", model: "C passes arguments by value: Swap gets copies of 3 and 4 in its own parameters, in its own stack frame. It swaps those copies, and they disappear when its frame is popped on return. It never had access to main's variables, which would require their addresses." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Pointer variables, & and *", mins: 20,
    blurb: "Declare a pointer, take an address with &, and reach through a pointer with *. Then see the LC-3 code for each.",
    takeaway: "A pointer variable holds a bit pattern treated as an address; it points to the object whose address it holds, and has the type of that object: int *ptr; (\"int star\"), char *cp; double *dp. Local pointers are uninitialized like any local. Address operator &: generates the address of its operand, which must be a memory object: ptr = &object; → ADD R0, R5, #0; STR R0, R5, #-1 (Figure 16.3: object = 4 at xEFF2 = R5, ptr = xEFF2 at xEFF1). Indirection (dereference) operator *: *ptr is the object ptr points to, interchangeable with object. *ptr = *ptr + 1; is object = object + 1; but compiles to LDR R0, R5, #-1 (ptr); LDR R1, R0, #0 (*ptr); ADD; STR R1, R0, #0. On the right of =, *ptr is the value at that location; on the left, the location written. (object = *ptr + 1 would end with STR R1, R5, #0.)",
    steps: [
      { k: "learn", title: "Declaring a pointer", b: [
        `<pre class="code">int *ptr;     <span class="cm">// ptr holds the address of an int ("int star")</span>
char *cp;     <span class="cm">// address of a char</span>
double *dp;   <span class="cm">// address of a double</span></pre>`,
        `<p>A pointer's type says what it points <i>to</i>. Like any local, an uninitialized local pointer holds garbage, so it points somewhere random.</p>`,
      ]},
      { k: "play", title: "& and *, step by step", b: [
        `<p><code>&amp;x</code> = “the address of x”. <code>*p</code> = “the thing p points to”. Predict object's final value, then step.</p>`,
        ptrTrace,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "<code>int a = 5; int *p = &a; *p = 9;</code> What is a now?", a: 9, tol: 0, why: "p holds a's address; writing *p writes a." },
        { t: "mcq", q: "With the code above, what does p hold?", opts: [["The address of a", true, "Not 5 or 9: a memory address."], ["9", false, "That's *p."], ["5", false, "That was a's old value."]] },
        { t: "mcq", q: "Why does <code>*ptr = *ptr + 1;</code> need two LDRs where <code>object = object + 1;</code> needs one?", opts: [["It must first load ptr to get the address, then load the value at that address", true, "One load for the pointer, one through it."], ["Pointers are 32 bits on the LC-3", false, "Addresses are 16 bits."], ["To check for NULL", false, "C doesn't check."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do the two operators & and * do?", model: "& gives the address of a variable or other memory object. * goes the other way: applied to a pointer, it names the object at the address the pointer holds, so you can read it or, on the left of =, write it." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Call by reference", mins: 25,
    blurb: "Pass addresses so a function can change its caller's variables: a Swap that works, scanf's &, NULL, and a function with two outputs.",
    takeaway: "NewSwap(int *firstVal, int *secondVal) uses *firstVal and *secondVal; main calls NewSwap(&valueA, &valueB) (Figure 16.4). Figure 16.5: the parameters hold xEFFA and xEFF9; lines 23–25 read and write main's variables through them. Arguments are still passed by value, but passing an address creates call by reference: the argument must be a memory object (it needs an address); the callee uses * to read and modify it. Null pointer: ptr = NULL; (a preprocessor macro for 0; address 0 by convention points to nothing; useful in Chapter 19). scanf(\"%d\", &input) needs input's address to store into it; without & the program faults. Declaration syntax: type *ptr; means *ptr is of type type. & and * have very high precedence (Table 12.5). Figure 16.6: int IntDivide(int x, int y, int *quoPtr, int *remPtr) writes the quotient and remainder through the pointers and returns 0, or −1 if y is 0; main checks the status: a common convention for multiple outputs plus an error code.",
    steps: [
      { k: "play", title: "A Swap that works (Figure 16.4)", b: [
        `<p>Same main, but now it passes <code>&amp;valueA</code> and <code>&amp;valueB</code>, and NewSwap uses * to reach them. Predict which memory cells change.</p>`,
        newSwapTrace,
        `<p>C still passes by value; the values just happen to be addresses. That's <b>call by reference</b>, and it only works for arguments that have an address (variables, not expressions like 3 + 4).</p>`,
      ]},
      { k: "learn", title: "Now scanf makes sense", b: [
        `<pre class="code">scanf("%d", &input);</pre>`,
        `<p>scanf has to <b>store</b> into input, so it needs input's address. Since Chapter 11 you've been passing by reference without knowing it.</p>`,
        `<p>And the declaration <code>int *ptr;</code> reads as “<code>*ptr</code> is an int”.</p>`,
      ]},
      { k: "learn", title: "Pointing at nothing", b: [
        `<pre class="code">int *ptr;
ptr = NULL;   <span class="cm">// NULL is a #define for 0</span></pre>`,
        `<p>Address 0 is reserved to mean “no object”. It becomes essential for linked data structures in Chapter 19.</p>`,
      ]},
      { k: "play", title: "Two answers from one function (Figure 16.6)", b: [
        code(`int IntDivide(int x, int y, int *quoPtr, int *remPtr)
{
   if (y != 0) {
      *quoPtr = x / y;  // Modify *quoPtr
      *remPtr = x % y;  // Modify *remPtr
      return 0;
   }
   else
      return -1;
}`, { nums: false }),
        `<p>The return value is free to report <b>success or failure</b>; the real results come back through pointers. Try a divisor of 0.</p>`,
        intDivide,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which call to IntDivide is correct, given <code>int q, r, e;</code>?", opts: [["e = IntDivide(17, 5, &q, &r);", true, "Values for x and y, addresses for the outputs."], ["e = IntDivide(17, 5, q, r);", false, "q and r's garbage values would be used as addresses."], ["e = IntDivide(&17, &5, &q, &r);", false, "A literal has no address, and x and y want values."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can a C function change a variable that belongs to its caller, when C passes everything by value?", model: "The caller passes the variable's address (using &) instead of its value. The function's parameter is a pointer holding that address, and by writing through it with * the function changes the caller's variable itself. The address was passed by value, but it gives access to the original object." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Arrays", mins: 25,
    blurb: "Declare an array, see it laid out in memory, compute any element's address from the base, and loop over arrays.",
    takeaway: "An array is a collection of same-type items stored sequentially and accessed through one name (examScore[32] is the 33rd student's score; examScore[0] the first). Arrays suit naturally sequential data and computed indices (e.g., sorting 100 numbers). int grid[10]; allocates ten consecutive ints, grid[0] at the lowest address, grid[9] the highest (Figure 16.7); local arrays live on the run-time stack. grid[6] = grid[3] + 1; with grid the only local (R5 at grid[9]): ADD R0, R5, #-9 (base address = address of grid[0]); LDR R1, R0, #3; ADD R1, R1, #1; STR R1, R0, #6. Index expressions can be computed: grid[x+1] = grid[x] + 2; loads x, adds it to the base, etc. Figure 16.8 adds two 10-element exam arrays into Total with for loops; #define <code>NUM_STUDENTS</code> 10 lets one change resize everything. Figure 16.9 counts how often each of <code>MAX_NUMS</code> inputs repeats using nested loops over numbers and a repeats array (every number matches itself).",
    steps: [
      { k: "learn", title: "Declaring and indexing", b: [
        `<pre class="code">int grid[10];             <span class="cm">// ten ints, grid[0] … grid[9]</span>
grid[6] = grid[3] + 1;</pre>`,
        `<p>The elements sit in consecutive memory, grid[0] at the lowest address. To reach grid[i], the compiler computes <b>base address + i</b>:</p>`,
        lc3(`ADD R0, R5, #-9   ; base address of grid (grid[0])
LDR R1, R0, #3    ; R1 <-- grid[3]
ADD R1, R1, #1    ; R1 <-- grid[3] + 1
STR R1, R0, #6    ; grid[6] = grid[3] + 1;`),
      ]},
      { k: "play", title: "Base + index", b: [
        `<p>Slide the index. What do you expect at i = 10?</p>`,
        arrayMem,
        `<p>The index can be any integer expression, like <code>grid[x+1]</code>: the compiler loads x and adds it to the base at run time. That's the real power of arrays: loops can walk through them.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "<code>int scores[50];</code> starts at address x4000. How many locations past x4000 is scores[32]?", a: 32, tol: 0, why: "Each int is one LC-3 location, so scores[32] is at x4000 + 32 = x4020." },
      ]},
      { k: "learn", title: "Loops over arrays (Figure 16.8)", b: [
        code(`#define NUM_STUDENTS 10
...
int Exam1[NUM_STUDENTS];
int Exam2[NUM_STUDENTS];
int Total[NUM_STUDENTS];
...
for (int i = 0; i < NUM_STUDENTS; i++) {
   Total[i] = Exam1[i] + Exam2[i];
}`, { nums: false }),
        `<p><code>NUM_STUDENTS</code> sizes the arrays <i>and</i> bounds the loops. When enrollment changes, edit one line and recompile.</p>`,
      ]},
      { k: "play", title: "Counting repeats (Figure 16.9)", b: [
        code(`for (int index = 0; index < MAX_NUMS; index++) {
   repeats[index] = 0;
   for (repIndex = 0; repIndex < MAX_NUMS; repIndex++) {
      if (numbers[repIndex] == numbers[index])
         repeats[index]++;
   }
}`, { nums: false }),
        repeatsWidget,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the computer find grid[i] in memory?", model: "The array's elements are stored one after another starting at its base address, the address of grid[0]. The compiler generates code that adds the index i to that base address (times the element size, which is 1 location for an int on the LC-3) and loads or stores at the result." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Arrays as parameters", mins: 15,
    blurb: "Pass an array by its name, which is really its base address, so functions work on the caller's array directly.",
    takeaway: "Copying a large array onto the stack would be costly, so C passes arrays by reference. Figure 16.10: int Average(int inputValues[]); called as Average(numbers): an array's name is the address of its base element (numbers is equivalent to &numbers[0], of type like int *); the address is pushed and assigned to inputValues, which is indexed with normal array notation. Figure 16.11: the stack before Average returns (its parameter inputValues holds the address of numbers[0]). The [ ] in the parameter declaration says it will hold the base address of an int array. Changes the callee makes to the array are visible to the caller. (The book's declaration spells the parameter <code>input_values</code> and the definition inputValues; names in a declaration are optional and needn't match.)",
    steps: [
      { k: "learn", title: "The name is the address", b: [
        code(`int Average(int inputValues[]);
...
mean = Average(numbers);
...
int Average(int inputValues[])
{
   int sum = 0;

   for (int index = 0; index < MAX_NUMS; index++) {
      sum = sum + inputValues[index];
   }
   return (sum / MAX_NUMS);
}`, { nums: false }),
        `<p>Notice the call says just <code>numbers</code>, no brackets. In C, an array's name <b>is</b> the address of its first element: <code>numbers</code> means <code>&amp;numbers[0]</code>. So one address is pushed, and inputValues is a pointer to main's array.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does C pass the array's address rather than copying all its elements onto the stack?", opts: [["Copying a big array into every callee's frame would cost lots of time and stack space", true, "One address instead of thousands of values."], ["The LC-3 can't push arrays", false, "It could push them one by one; it would just be slow."], ["Arrays can't be read by other functions", false, "With the address, they can."]] },
        { t: "mcq", q: "A function sorts the array it receives. After it returns, the caller's array is…", opts: [["Sorted: the function worked on the caller's array through its address", true, "Arrays are passed by reference."], ["Unchanged: the function sorted a copy", false, "There's no copy."], ["Garbage", false, "No."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When you pass an array to a function, what actually goes on the stack?", model: "Just the address of the array's first element, because an array's name evaluates to that address. The callee's array parameter holds that address and indexes from it, so it is reading and writing the caller's actual array." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Strings", mins: 25,
    blurb: "A C string is a char array ending in a null character. Measure one, read one with scanf, and reverse one in place.",
    takeaway: "Strings are arrays of char; char word[10]; can hold \"elephant\" or \"giraffe\" but not \"hippopotamus\". The end is marked by the null character (ASCII 0, written '\\0'): null-terminated strings. The null occupies an element, so word[10] holds at most 9 characters (\"rhinoceros\" won't fit). printf(\"%s\", word) prints from the given address up to the '\\0'. char word[10] = \"Hello\"; initializes and adds the null automatically; double quotes for strings, single for characters. Figure 16.12: StringLength counts characters until '\\0' (the array size only gives the maximum). scanf(\"%s\", input) reads up to the first white space (space, tab, newline, carriage return, vertical tab, form feed), discarding it; the rest stays for the next scanf. scanf doesn't know the array size: a longer word overwrites the local variables allocated after the array. Figure 16.13: Reverse calls StringLength, then CharSwap(&string[index], &string[length − (index + 1)]) for index < length / 2. The standard library's &lt;string.h&gt; has string copy, concatenate, compare and length functions.",
    steps: [
      { k: "learn", title: "Text = chars + a terminator", b: [
        `<pre class="code">char word[10] = "giraffe";   <span class="cm">// the '\\0' is added for you</span>
printf("%s", word);</pre>`,
        `<p>The array size is only the <b>maximum</b>. The real end is marked by the <b>null character</b> <code>'\\0'</code> (ASCII 0), which takes up a slot itself. Double quotes for strings, single quotes for one character.</p>`,
        seenPP("Null-terminated strings and PUTS in LC-3.", "09-io.html", "Chapter 9"),
      ]},
      { k: "play", title: "What fits?", b: [
        `<p>Type words into a 10-element array. What's the longest that fits?</p>`,
        stringMem,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "<code>char name[16];</code> At most how many characters can the string in name have?", a: 15, tol: 0, why: "One slot is needed for the '\\0'." },
      ]},
      { k: "learn", title: "Reading and measuring", b: [
        code(`int StringLength(char string[])
{
   int index = 0;

   while (string[index] != '\\0')
      index = index + 1;

   return index;
}`, { nums: false }),
        `<p><code>scanf("%s", input)</code> reads one <b>word</b>: it stops at the first white space, so typing “Not like the brazen giant” stores just “Not”. And scanf can't know how big input is: a word longer than the array spills over whatever is stored next on the stack.</p>`,
      ]},
      { k: "play", title: "Reverse in place (Figure 16.13)", b: [
        code(`void Reverse(char string[])
{
   int length;

   length = StringLength(string);

   for (int index = 0; index < (length / 2); index++)
      CharSwap(&string[index], &string[length - (index + 1)]);
}`, { nums: false }),
        `<p>CharSwap is NewSwap for chars. Why does the loop stop at length / 2? Predict, then step.</p>`,
        reverseWidget,
        `<p>Going all the way to length would swap every pair twice and put the word back. The standard library header <code>&lt;string.h&gt;</code> has ready-made string functions (copy, join, compare, length).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a C function like StringLength know where a string ends, when the array might be bigger than the text?", model: "By convention every C string ends with the null character '\\0', ASCII 0. Functions walk through the characters until they reach it. The array's declared size only limits the maximum length, and it must include room for the null." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Arrays and pointers; insertion sort", mins: 30,
    blurb: "Array names and pointers are nearly interchangeable. Then the chapter's big example: sorting an array in place.",
    takeaway: "char word[10]; char *cptr; cptr = word; is legal: both are char pointers to the same base, so word[3] and *(cptr + 3) are the same element. Table 16.1: address of element 0: cptr, word, &word[0]; element 0: *cptr, *word, word[0]; address of element n: (cptr + n), (word + n), &word[n]; element n: *(cptr + n), *(word + n), word[n]. Difference: cptr is a variable and can be reassigned; an array name is fixed (word = newArray is a compile error). Insertion sort (Figure 16.14), like sorting books on a shelf: the front of the array is the sorted part; the outer loop takes each unsorted item (unsorted = 1 … <code>MAX_NUMS</code> − 1; unsortedItem = list[unsorted]); the inner loop runs sorted from unsorted − 1 down while sorted >= 0 and list[sorted] > unsortedItem, copying list[sorted] up to list[sorted + 1]; then list[sorted + 1] = unsortedItem. Example at unsorted = 4: [2 16 68 69 15 …] → 69, 68, 16 shift up, then 15 is inserted after 2: [2 15 16 68 69 9 10 7 82 19].",
    steps: [
      { k: "play", title: "Four ways to say the same thing (Table 16.1)", b: [
        ptrTable,
        `<p>The one difference: <code>cptr</code> is a variable and can be pointed elsewhere. <code>word</code> is the array's fixed location: <code>word = newArray;</code> won't compile.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "<code>int a[5]; int *p = a;</code> Which expression is a[2]?", opts: [["*(p + 2)", true, "Move two elements on, then dereference."], ["*p + 2", false, "That's a[0] + 2: * binds tighter than +."], ["&p[2]", false, "That's the address of a[2]."]] },
      ]},
      { k: "learn", title: "Insertion sort, the idea", b: [
        `<p>Sort books on a shelf: keep a sorted group on the left. Take the next unsorted book and slide it left past every book that should come after it, then drop it in the gap. Repeat.</p>`,
        code(`for (unsorted = 1; unsorted < MAX_NUMS; unsorted++) {
   unsortedItem = list[unsorted];

   for (sorted = unsorted - 1;
        (sorted >= 0) && (list[sorted] > unsortedItem);
        sorted--)
      list[sorted + 1] = list[sorted];

   list[sorted + 1] = unsortedItem; // Insert item
}`, { nums: false }),
        `<p>The whole thing happens <b>inside one array</b>: the front part is sorted, the rest isn't.</p>`,
      ]},
      { k: "play", title: "Watch it sort", b: [
        `<p>The starting order is chosen so that at unsorted = 4 you see the book's example: [2 16 68 69 15 …]. Before stepping that item, predict how many elements shift up.</p>`,
        insertionSort,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does the code save <code>unsortedItem = list[unsorted];</code> before the inner loop?", opts: [["The first shift overwrites list[unsorted]", true, "The copy of 69 into list[4] destroys the 15, so it must be saved first."], ["To print it", false, "No."], ["So the inner loop can modify it", false, "The inner loop only reads it."]] },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Pitfalls, variable-length and 2-D arrays", mins: 20,
    blurb: "C never checks array bounds; arrays can be sized at run time; and images become two-dimensional arrays stored row by row.",
    takeaway: "C performs no bounds checking (efficiency from an era of scarce resources): a[i] can reach beyond the array. Figure 16.15: index, array[10], limit; entering a limit above 10 writes past the end with puzzling results (draw the stack to see why). Variable-length arrays (C99): int data[len]; sized at run time on the stack with extra instructions and overhead; size fixed once declared; dynamically sized arrays (C) and vectors (C++) later. Multidimensional arrays: int image[1080][1920]; (about 2 million pixels, too big for the LC-3's 65,536 locations, so Figure 16.16 assumes 32-bit addresses); image[38][283] is row 39, column 284. C stores arrays in row-major order: a row's elements are adjacent; after image[0][1919] comes image[1][0]. Figure 16.17 Adjust halves every pixel (the image gets darker). int dataVolume[40][50][60]; has 120,000 elements; the rightmost index varies fastest: after dataVolume[0][0][59] comes dataVolume[0][1][0].",
    steps: [
      { k: "play", title: "No bounds checking (Figure 16.15)", b: [
        code(`int index;
int array[MAX_SIZE];   // MAX_SIZE is 10
int limit;
...
for (index = 0; index < limit; index++) {
   array[index] = 0;
   printf("array[%d] is set to 0\\n", index);
}`, { nums: false }),
        `<p>The book says: enter a limit bigger than 10 and draw the run-time stack. Locals are allocated in declaration order going down from R5. Predict what array[10] really is, then slide.</p>`,
        overrun,
        `<p>C trusts you completely. That makes it fast and makes this kind of bug easy to write.</p>`,
      ]},
      { k: "learn", title: "Arrays sized at run time", b: [
        `<pre class="code">int Calculate(int len)
{
   int data[len];   <span class="cm">// size known only when the function runs</span></pre>`,
        `<p>A <b>variable-length array</b> (since C99). Convenient, but it costs extra instructions, and once created its size is fixed. Truly growable storage comes in Chapters 19 and 20.</p>`,
      ]},
      { k: "play", title: "Two dimensions", b: [
        `<p>A photo is a grid of pixels: <code>int image[1080][1920];</code> (rows, then columns). Memory is one-dimensional, so C lays the grid out <b>row by row</b>.</p>`,
        rowMajor,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "<code>int m[4][6];</code> starts at x5000. How many locations after the start is m[2][3]?", a: 15, tol: 0, why: "Row 2 starts after 2 full rows of 6: 12; plus column 3 = 15 (x500F)." },
        { t: "mcq", q: "Figure 16.17's Adjust divides every pixel's brightness by 2. What does the picture look like?", opts: [["The same picture, darker", true, "Every pixel keeps its relative brightness but at half the intensity."], ["Half the size", false, "The array dimensions don't change."], ["Mirrored", false, "No positions move."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean that C does no bounds checking on arrays, and why is that dangerous?", model: "If an index is outside the array, C doesn't stop you: it just computes base address plus index and reads or writes whatever memory is there. Writing past the end can silently overwrite other variables on the stack, like a loop counter, causing strange behaviour far from the actual mistake." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp16", eyebrow: "Patt & Patel · Chapter 16", title: "Pointers and Arrays",
    intro: `<p>Eight parts: why Swap fails, pointers and the & and * operators, call by reference, arrays and their memory layout, passing arrays, strings, how arrays and pointers relate (plus insertion sort), and the classic pitfalls.</p><p>Most of the chapter lives on the run-time stack, so you'll step through the stack a lot. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For any pointer question, draw boxes for each variable with its address beside it, and draw an arrow from each pointer to what it holds the address of.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Pointers</h3>
      <p><code>int *p;</code> holds an address. <code>&amp;x</code> = address of x; <code>*p</code> = the object p points to (value on the right of =, location on the left). Pass addresses for call by reference (NewSwap, scanf, multiple outputs). <code>NULL</code> = 0 = points to nothing.</p>
      <h3>Arrays</h3>
      <p><code>int grid[10];</code> consecutive, grid[0] lowest; address = base + index; no bounds checking. The name is the base address, so arrays are passed by reference. Strings: char arrays ending in '\\0'; %s; scanf("%s") stops at white space. <code>a[n]</code> ≡ <code>*(a + n)</code>. Variable-length arrays; 2-D arrays in row-major order.</p>
      <h3>Insertion sort</h3>
      <p>Grow a sorted front: save the next item, shift larger sorted items up one, insert in the gap.</p>`,
  };
  Course.start(window.CHAPTER);
})();

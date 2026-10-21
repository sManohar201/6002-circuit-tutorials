(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { code, trace, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const lc3 = (t) => Digital.listing(t, { comment: ";" });
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);

  /* ---------- Figure 17.1 / 17.2: RunningSum(4) ---------- */
  const RS = `int RunningSum(int n)
{
   if (n == 1)
      return 1;
   else
      return (n + RunningSum(n-1));
}`;
  function rsFrames() {
    const f = [], stack = [];
    const snap = (l, note) => f.push({ l, v: stack.map((s, i) => [`${"  ".repeat(i)}RunningSum(${s.n})`, s.r != null ? `returns ${s.r}` : s.wait ? `waiting: ${s.n} + RunningSum(${s.n - 1})` : "running"]), note });
    for (let n = 4; n >= 1; n--) { stack.push({ n }); snap(3, n === 4 ? "main calls RunningSum(4). Each call gets its own stack frame with its own n." : `A new invocation with n = ${n}, on top of the waiting ones.`); if (n > 1) { stack[stack.length - 1].wait = true; snap(6, `n ≠ 1, so it must first compute RunningSum(${n - 1}), and waits.`); } }
    stack[3].r = 1; snap(4, "The <b>base case</b>: no more calls. It returns 1.");
    stack.pop();
    let r = 1;
    for (let n = 2; n <= 4; n++) { r += n; stack[stack.length - 1].r = r; stack[stack.length - 1].wait = false; snap(6, `RunningSum(${n}) finishes ${n} + ${r - n} = ${r} and returns it.`); stack.pop(); }
    f.push({ l: 7, v: [["result in main", 10]], note: "4 + 3 + 2 + 1 = 10. The frames were pushed going down and popped coming back up." });
    return f;
  }
  const rsTrace = (host) => trace(host, { code: RS, stateTitle: "Active calls (top = newest)", frames: rsFrames() });

  /* ---------- Towers of Hanoi, three disks (Figures 17.5–17.12) ---------- */
  function hanoi(host) {
    const moves = [], calls = [];
    (function M(d, s, e, m, depth) {
      calls.push({ d, s, e, m, depth, at: moves.length });
      if (d > 1) { M(d - 1, s, m, e, depth + 1); moves.push({ d, s, e, depth }); M(d - 1, m, e, s, depth + 1); }
      else moves.push({ d: 1, s, e, depth });
    })(3, 1, 3, 2, 0);
    let k = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const bNext = btn("Next move", "primary"), bBack = btn("◀ Back"), bReset = btn("Start over");
    const draw = () => {
      const posts = [[3, 2, 1], [], []];
      for (let i = 0; i < k; i++) { const mv = moves[i]; posts[mv.e - 1].push(posts[mv.s - 1].pop()); }
      let s = "";
      [0, 1, 2].forEach((p) => {
        const x = 70 + p * 130;
        s += `<rect x="${x - 3}" y="40" width="6" height="110" style="fill:var(--muted)"/>` + S.t(x, 172, "post " + (p + 1), { cls: "lab" });
        posts[p].forEach((d, j) => { const w = 24 + d * 22; s += `<rect x="${x - w / 2}" y="${132 - j * 22}" width="${w}" height="18" rx="4" style="fill:${["", "var(--accent)", "var(--cool)", "var(--good)"][d]}"/>` + S.t(x, 145 - j * 22, String(d), { cls: "lab" }); });
      });
      s += `<rect x="10" y="150" width="400" height="6" style="fill:var(--muted)"/>`;
      const active = calls.filter((c) => c.at <= k).slice(-1)[0];
      const log = moves.slice(0, k).map((mv) => `${"  ".repeat(mv.depth)}Move disk ${mv.d} from post ${mv.s} to post ${mv.e}.`).join("\n");
      out.innerHTML = fig(S.svg(420, 182, s, { max: 420, label: "Towers of Hanoi with three disks" })) + `<pre class="code">${log || "(no moves yet)"}</pre><p class="aside">Indentation = how deep in the recursion each move was printed. ${k === moves.length ? "Done: all three disks are on post 3." : ""}</p>`;
      bNext.disabled = k === moves.length; bBack.disabled = k === 0;
    };
    bNext.addEventListener("click", () => { k++; draw(); }); bBack.addEventListener("click", () => { k--; draw(); }); bReset.addEventListener("click", () => { k = 0; draw(); });
    row.append(bBack, bNext, bReset); host.append(row, out); draw();
  }

  /* ---------- Fibonacci call tree ---------- */
  function fibTree(host) {
    let n = 3;
    const out = el(`<div></div>`);
    const draw = () => {
      const nodes = []; let leaf = 0;
      const build = (m, depth) => { const nd = { m, depth, kids: [] }; if (m > 1) { nd.kids.push(build(m - 1, depth + 1)); nd.kids.push(build(m - 2, depth + 1)); nd.x = (nd.kids[0].x + nd.kids[1].x) / 2; } else nd.x = leaf++; nodes.push(nd); return nd; };
      const root = build(n, 0);
      const W = Math.max(300, leaf * 60), dx = W / leaf, maxD = Math.max(...nodes.map((d) => d.depth));
      const X = (nd) => 30 + nd.x * dx, Y = (nd) => 24 + nd.depth * 56;
      let s = "";
      nodes.forEach((nd) => nd.kids.forEach((c) => { s += `<line class="w" x1="${X(nd)}" y1="${Y(nd)}" x2="${X(c)}" y2="${Y(c)}"/>`; }));
      const counts = {}; nodes.forEach((nd) => { counts[nd.m] = (counts[nd.m] || 0) + 1; });
      nodes.forEach((nd) => { const dup = counts[nd.m] > 1 && nd.m > 1; s += `<rect x="${X(nd) - 26}" y="${Y(nd) - 13}" width="52" height="24" rx="6" style="fill:${nd.m <= 1 ? "var(--good-soft)" : dup ? "var(--bad-soft)" : "var(--accent-soft)"};stroke:var(--ink)"/>` + S.t(X(nd), Y(nd) + 4, "Fib(" + nd.m + ")", { cls: "lab" }); });
      out.innerHTML = fig(S.svg(W + 60, 50 + maxD * 56, s, { max: W + 60, label: "Fibonacci call tree" })) + `<p class="aside">Green = base cases (n = 0 or 1). Red = a value that gets computed more than once.</p>`;
    };
    host.append(toggle(["Fibonacci(3)", "Fibonacci(4)"], (i) => { n = 3 + i; draw(); }, 0), out); draw();
  }

  /* ---------- Figure 17.14: stack snapshots ---------- */
  function fibStack(host) {
    const SN = [["Step 1: initial call", ["main", "Fibonacci(3)"]], ["Step 2: Fib(3) calls Fib(2)", ["main", "Fibonacci(3)", "Fibonacci(2)"]], ["Step 3: Fib(2) calls Fib(1)", ["main", "Fibonacci(3)", "Fibonacci(2)", "Fibonacci(1)"]], ["Step 4: Fib(2) calls Fib(0)", ["main", "Fibonacci(3)", "Fibonacci(2)", "Fibonacci(0)"]], ["Step 5: Fib(3) calls Fib(1)", ["main", "Fibonacci(3)", "Fibonacci(1)"]], ["Step 6: back to the start", ["main", "Fibonacci(3)"]]];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const fr = SN[i][1]; let s = "", y = 220;
      fr.forEach((f, k) => { y -= 44; s += `<rect x="80" y="${y}" width="160" height="40" style="fill:${f === "main" ? "var(--cool-soft)" : "var(--accent-soft)"};stroke:var(--ink)"/>` + S.t(160, y + 25, f) + (k === fr.length - 1 ? S.arrow(310, y + 4, 244, y + 4, "") + S.t(316, y + 8, "R6", { a: "start" }) : ""); });
      out.innerHTML = fig(S.svg(380, 230, s, { max: 380, label: "Run-time stack during Fibonacci(3)" })) + `<p class="aside">Each call, even to the same function, gets a fresh frame with its own n. Static storage would make each call overwrite the last.</p>`;
    };
    host.append(toggle(SN.map((s) => s[0].split(":")[0]), draw, 0), out); draw(0);
  }

  /* ---------- Figure 17.16 / 17.17: binary search ---------- */
  function binSearch(host) {
    const LIST = [12, 32, 37, 49, 109, 110, 153, 387, 392, 777, 926];
    let item = 109;
    const out = el(`<div></div>`);
    const draw = () => {
      const calls = []; let start = 0, end = LIST.length - 1, result;
      while (true) {
        const middle = Math.floor((end + start) / 2);
        if (end < start) { calls.push({ start, end, middle: null, why: "end < start: nothing left to search. Return −1." }); result = -1; break; }
        if (LIST[middle] === item) { calls.push({ start, end, middle, why: `list[${middle}] = ${LIST[middle]}: found it. Return ${middle}.` }); result = middle; break; }
        const lower = item < LIST[middle];
        calls.push({ start, end, middle, why: `${item} ${lower ? "<" : ">"} list[${middle}] = ${LIST[middle]}: search the ${lower ? "first" : "second"} half.` });
        if (lower) end = middle - 1; else start = middle + 1;
      }
      const seq = LIST.indexOf(item) >= 0 ? LIST.indexOf(item) + 1 : LIST.length;
      out.innerHTML = calls.map((c) => `<div style="margin:6px 0"><p class="mono" style="margin:2px 0">BinarySearch(${item}, list, ${c.start}, ${c.end})</p><div class="tbl"><table style="font-family:var(--mono);font-size:13px;text-align:center"><tbody><tr>${LIST.map((v, j) => `<td style="${j === c.middle ? "background:var(--accent);color:var(--paper);font-weight:700" : j >= c.start && j <= c.end ? "background:var(--accent-soft)" : "opacity:.35"}">${v}</td>`).join("")}</tr></tbody></table></div><p class="aside" style="margin:2px 0">${c.why}</p></div>`).join("") +
        readout([["Calls to BinarySearch", calls.length], ["Comparisons a sequential search would need", seq], ["Returned", result]]);
    };
    const pick = [109, 12, 926, 110, 400];
    host.append(el(`<p class="aside" style="margin:0">Search for</p>`), toggle(pick.map(String), (i) => { item = pick[i]; draw(); }, 0), out); draw();
  }

  /* ---------- Figures 17.18–17.20: the maze ---------- */
  function mazeWidget(host) {
    const M0 = [[" ", "X", "X", " "], ["X", " ", " ", "X"], [" ", " ", "X", " "], ["E", "X", " ", " "]];
    const ev = [];
    const maze = M0.map((r) => r.slice());
    const snap = (x, y, depth, note) => ev.push({ g: maze.map((r) => r.slice()), x, y, depth, note });
    (function Exit(x, y, depth, dir) {
      if (x < 0 || x >= 4 || y < 0 || y >= 4) { snap(x, y, depth, `${dir}: (${x}, ${y}) is outside the maze → return 0.`); return 0; }
      if (maze[x][y] === "E") { snap(x, y, depth, `${dir}: (${x}, ${y}) is the exit → return 1!`); return 1; }
      if (maze[x][y] !== " ") { snap(x, y, depth, `${dir}: (${x}, ${y}) is '${maze[x][y]}' → return 0.`); return 0; }
      maze[x][y] = "V"; snap(x, y, depth, `${dir}: (${x}, ${y}) is open. Mark it V and try its neighbours.`);
      for (const [dx, dy, nm] of [[1, 0, "Down"], [0, 1, "Right"], [-1, 0, "Up"], [0, -1, "Left"]]) {
        if (Exit(x + dx, y + dy, depth + 1, nm)) { maze[x][y] = "P"; snap(x, y, depth, `A path was found through (${x}, ${y}): mark it P and return 1.`); return 1; }
      }
      snap(x, y, depth, `Every direction from (${x}, ${y}) failed → return 0.`); return 0;
    })(1, 2, 0, "Start");
    let k = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const bNext = btn("Step", "primary"), bBack = btn("◀ Back"), bReset = btn("Start over");
    const draw = () => {
      const e = ev[k], COL = { X: "var(--muted)", E: "var(--good)", V: "var(--accent-soft)", P: "var(--accent)", " ": "var(--paper)" };
      let s = "";
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const c = e.g[i][j]; s += `<rect x="${20 + j * 50}" y="${20 + i * 50}" width="48" height="48" style="fill:${COL[c]};stroke:var(--line)"/>` + (c !== " " ? S.t(44 + j * 50, 50 + i * 50, c) : ""); }
      if (e.x >= 0 && e.x < 4 && e.y >= 0 && e.y < 4) s += `<rect x="${22 + e.y * 50}" y="${22 + e.x * 50}" width="44" height="44" style="fill:none;stroke:var(--bad);stroke-width:4"/>`;
      out.innerHTML = fig(S.svg(240, 240, s, { max: 240, label: "Maze being searched" })) + `<p>${e.note}</p><p class="aside">Recursion depth ${e.depth}. Positions are (row, column) = maze[xpos][ypos]. Order tried: down, right, up, left.</p>`;
      bNext.disabled = k === ev.length - 1; bBack.disabled = k === 0;
    };
    bNext.addEventListener("click", () => { k++; draw(); }); bBack.addEventListener("click", () => { k--; draw(); }); bReset.addEventListener("click", () => { k = 0; draw(); });
    row.append(bBack, bNext, bReset); host.append(row, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "What is recursion?", mins: 20,
    blurb: "Solve a problem by solving a smaller version of the same problem, until it's small enough to answer directly.",
    takeaway: "Finding Mira's exam in an alphabetized stack: check a point (Salina), then repeat on the smaller part that must contain it: a recursive procedure (seen for LC-3 subroutines in Chapter 8). Recursion and iteration both express repetition; recursion is sometimes far more elegant, but nearly always costs more execution overhead. A recursive function calls itself. RunningSum(n) = n + RunningSum(n − 1), with the initial (base) case RunningSum(1) = 1 (a recurrence equation): RunningSum(4) = 4 + 3 + 2 + 1. Figure 17.1: if (n == 1) return 1; else return (n + RunningSum(n−1)); Figure 17.2: each call waits for the one it made; RunningSum(1) returns 1, then 2 + 1, 3 + 3, 4 + 6. The run-time stack needs no special handling for recursive functions.",
    steps: [
      { k: "learn", title: "A smaller copy of the same problem", b: [
        `<p>Looking for Mira's exam in a sorted stack: open somewhere in the middle. It's Salina's, so Mira's must be in the part before it. Now do <b>the same thing</b> on that smaller pile. Keep going until you find it.</p>`,
        `<p>That's <b>recursion</b>: solve a problem by solving smaller versions of itself, until one is small enough to answer directly.</p>`,
        seenPP("Recursion in LC-3 subroutines.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "learn", title: "RunningSum", b: [
        `<p class="eq">RunningSum(n) = n + RunningSum(n − 1), &nbsp;&nbsp; RunningSum(1) = 1</p>`,
        `<p>The first line is a <b>recurrence</b>; the second is the <b>base case</b> that stops it. The C function says exactly that:</p>`,
        code(RS),
      ]},
      { k: "play", title: "Watch the calls pile up and unwind", b: [
        `<p>Predict: how many invocations of RunningSum are alive at once, at the deepest point of RunningSum(4)?</p>`,
        rsTrace,
      ]},
      { k: "check", title: "Spot the mistake", b: [
        { t: "mcq", q: "Someone deletes the base case, leaving <code>return (n + RunningSum(n-1));</code> only. What happens?", opts: [["It calls itself forever with n = 3, 2, 1, 0, −1, … until the stack runs out of memory", true, "Without a base case recursion never stops, like a loop whose test is never false."], ["It returns 0", false, "Nothing ever returns."], ["The compiler refuses it", false, "It's legal C."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What two ingredients does every recursive function need?", model: "A recursive case, where it solves the problem by calling itself on a smaller version of the problem, and a base case, a version small enough to answer directly without another call. The recursive calls must make progress toward the base case, or the recursion never ends." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Recursion vs. iteration", mins: 10,
    blurb: "Anything recursive can be written with loops. When is recursion worth its cost?",
    takeaway: "RunningSum should really be a for loop; it was just an easy demonstration. All recursive functions can be written iteratively; for some problems (those naturally stated as recurrences) recursion is simpler and more elegant, which makes it indispensable; telling which is which is part of the art of programming. Cost: recursive calls incur function-call overhead that loops don't; time both versions for large n (e.g., with gettimeofday) and the recursive one is slower, unless the compiler converts tail recursion (the recursive call is the last operation) into iteration.",
    steps: [
      { k: "learn", title: "Two tools for repetition", b: [
        `<div class="two"><div class="tile"><h3>Iteration</h3><p>A loop updates variables in place. Cheap: no calls, no frames.</p></div><div class="tile"><h3>Recursion</h3><p>Each step is a function call with its own stack frame: pushes, pops, JSR and RET every time. Elegant when the problem is naturally self-similar.</p></div></div>`,
        `<p>Every recursive function <i>can</i> be rewritten as a loop. RunningSum obviously should be. But some problems (next part) are much simpler recursively.</p>`,
        `<p>Compilers can sometimes remove the cost: if the recursive call is the very <b>last</b> thing the function does (<b>tail recursion</b>), it can be turned into a loop automatically.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Is <code>return (n + RunningSum(n-1));</code> tail recursion?", opts: [["No: after the call returns, the function still has to add n", true, "The addition happens after the call, so the call isn't the last operation."], ["Yes: the call is on the last line", false, "Last line isn't the same as last operation."], ["Only when n is 1", false, "When n is 1 there's no call at all."]] },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Towers of Hanoi", mins: 25,
    blurb: "A puzzle whose recursive solution is a few lines and whose iterative solution is a headache.",
    takeaway: "Three posts; disks on post 1, each smaller than the one below; move them all to another post moving one disk at a time and never placing a larger disk on a smaller one (legend: 64 disks at the Temple of Brahma). Think from the end: the last big move puts the largest disk on the target, so first move the n − 1 disks above it to the intermediate post, move disk n, then move the n − 1 disks onto it: Move(n, target) = Move(n−1, intermediate), move disk n, Move(n−1, target). Base case: disk 1 (always on top) moves directly. Figure 17.4: void MoveDisk(int diskNumber, int startPost, int endPost, int midPost) { if (diskNumber > 1) { MoveDisk(diskNumber−1, startPost, midPost, endPost); printf(move diskNumber); MoveDisk(diskNumber−1, midPost, endPost, startPost); } else printf(move disk 1); }. Three disks, MoveDisk(3, 1, 3, 2): calls MoveDisk(3,1,3,2), (2,1,2,3), (1,1,3,2), (1,2,3,1), (2,2,3,1), (1,2,1,3), (1,1,3,2); seven moves: 1:1→3, 2:1→2, 1:3→2, 3:1→3, 1:2→1, 2:2→3, 1:1→3. (One printout in the text reads \"Move disk number 1\".)",
    steps: [
      { k: "learn", title: "The puzzle", b: [
        `<p>Move a stack of disks from post 1 to post 3. Rules: one disk at a time, and never put a bigger disk on a smaller one.</p>`,
        `<p>Think about the <b>last big move</b>: the largest disk goes to post 3. For that, every other disk must be out of the way, stacked on post 2. So:</p>`,
        `<ol><li>Move the n − 1 smaller disks from post 1 to post 2 (a smaller Hanoi puzzle!).</li><li>Move disk n from post 1 to post 3.</li><li>Move the n − 1 disks from post 2 to post 3 (another smaller puzzle).</li></ol>`,
        `<p>Base case: disk 1 is always on top, so it can just move.</p>`,
      ]},
      { k: "learn", title: "Figure 17.4", b: [
        code(`void MoveDisk(int diskNumber, int startPost, int endPost, int midPost)
{
   if (diskNumber > 1) {
      // Move n-1 disks off the current disk on
      // startPost and put them on the midPost
      MoveDisk(diskNumber-1, startPost, midPost, endPost);

      printf("Move disk %d from post %d to post %d.\\n",
             diskNumber, startPost, endPost);

      // Move all n-1 disks from midPost onto endPost
      MoveDisk(diskNumber-1, midPost, endPost, startPost);
   }
   else
      printf("Move disk 1 from post %d to post %d.\\n",
             startPost, endPost);
}`),
        `<p>Notice how the posts swap roles in each recursive call: the target of one subproblem is the spare of the other.</p>`,
      ]},
      { k: "play", title: "Play MoveDisk(3, 1, 3, 2)", b: [
        `<p>Before each click, predict which disk moves where.</p>`,
        hanoi,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Inside MoveDisk(2, 1, 2, 3), what is the first recursive call?", opts: [["MoveDisk(1, 1, 3, 2)", true, "Move the disk above disk 2 to the spare post, which for this call is post 3."], ["MoveDisk(1, 1, 2, 3)", false, "That would put disk 1 where disk 2 needs to go."], ["MoveDisk(1, 3, 2, 1)", false, "That's the second call's pattern."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the recursive solution to Towers of Hanoi so short?", model: "Because the problem contains smaller copies of itself: moving n disks is just moving n − 1 disks out of the way, moving the biggest disk, and moving the n − 1 disks back on top. The function only has to state that rule and the trivial base case of one disk; the run-time stack keeps track of all the half-finished subproblems." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Fibonacci: recursion's hidden cost", mins: 25,
    blurb: "A recurrence that maps straight into code, the stack behaviour behind it, and why it's a bad way to compute Fibonacci numbers.",
    takeaway: "f(n) = f(n − 1) + f(n − 2), f(1) = f(0) = 1: 1, 1, 2, 3, 5, 8, 13, … (Leonardo of Pisa, c. 1200, rabbit populations; described in India around 200 BC; ratios approach the golden ratio). Figure 17.13: if (n == 0 || n == 1) return 1; else { sum = Fibonacci(n−1) + Fibonacci(n−2); return sum; }. Every call gets a new private stack frame; static allocation would overwrite. Fibonacci(3): calls 3, 2, 1, 0, 1 (left operand first); = (1 + 1) + 1 = 3 (Figure 17.14 stack snapshots). Calls for Fibonacci(3) are a subset of those for Fibonacci(4). Far more expensive than iteration: call overhead plus many repeated calculations. Figure 17.15 (LC-3): no special handling for recursion; the parameter n is at R5 + 4; the compiler adds a temporary at R5 − 1 to hold Fibonacci(n−1) while computing Fibonacci(n−2); base case <code>FIB_BASE</code> sets R0 = 1; <code>FIB_END</code> writes the return value at R5 + 3 and tears down the frame. (Book slip: after each JSR the listing 'pops' with ADD R6, R6, #-1; popping moves R6 up, and the argument must go too: ADD R6, R6, #2.)",
    steps: [
      { k: "learn", title: "Straight from the recurrence", b: [
        `<p class="eq">f(n) = f(n − 1) + f(n − 2), &nbsp; f(1) = f(0) = 1 &nbsp; → &nbsp; 1, 1, 2, 3, 5, 8, 13, …</p>`,
        code(`int Fibonacci(int n)
{
   int sum;

   if (n == 0 || n == 1)
      return 1;
   else {
      sum = (Fibonacci(n-1) + Fibonacci(n-2));
      return sum;
   }
}`),
        `<p class="aside">(The book's listing is missing the closing brace of the function.)</p>`,
      ]},
      { k: "play", title: "The stack during Fibonacci(3) (Figure 17.14)", b: [
        `<p>The left call, Fibonacci(n−1), runs to completion before the right one starts. Predict the frames at each step.</p>`,
        fibStack,
      ]},
      { k: "play", title: "The call tree", b: [
        `<p>The book suggests walking through Fibonacci(4) yourself. Do that on paper first, then compare.</p>`,
        fibTree,
        `<p>Fibonacci(3)'s whole tree appears inside Fibonacci(4)'s. The same values are recomputed again and again, and the tree roughly doubles with each extra n. A loop that keeps the last two numbers does it in n steps.</p>`,
      ]},
      { k: "learn", title: "The LC-3 code (Figure 17.15)", b: [
        `<p>Nothing special for recursion: the same calling convention as any function. Two details: the parameter n is at <b>R5 + 4</b>, and the compiler adds a hidden <b>temporary</b> at R5 − 1 to hold Fibonacci(n−1)'s result while it calls Fibonacci(n−2).</p>`,
        lc3(`      LDR R0, R5, #4    ; load the parameter n
      ADD R0, R0, #-1   ; calculate n-1
      ADD R6, R6, #-1   ; push n-1
      STR R0, R6, #0
      JSR Fibonacci     ; call Fibonacci(n-1)
      LDR R0, R6, #0    ; read the return value at top of stack
      ADD R6, R6, #2    ; pop return value and argument
      STR R0, R5, #-1   ; store it into the temporary`),
        `<p class="aside">Book slip: the listing pops with <code>ADD R6, R6, #-1</code>. Popping moves R6 toward xFFFF, so it must <i>add</i>, and the pushed argument has to be popped as well, as above.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the recursive Fibonacci function so much slower than a loop?", model: "Each call makes two more calls, and the two branches recompute the same smaller Fibonacci numbers over and over, so the number of calls grows explosively with n. Each of those calls also pays the full function-call overhead of building and tearing down a stack frame. A loop just keeps the previous two values and does n additions." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Binary search", mins: 20,
    blurb: "The exam-stack search, in C: check the middle, then search only the half that can contain the item.",
    takeaway: "Binary search finds an item in a sorted array: compare with the midpoint; equal → done; less → search the first half; greater → the second half (recursive cases); an empty subarray (end < start) means not found → return −1 (base case). Figure 17.16: int BinarySearch(int item, int list[], int start, int end) with middle = (end + start) / 2; recursive calls on (start, middle − 1) or (middle + 1, end); start and end delimit the subarray. Figure 17.17: searching 109 in [12 32 37 49 109 110 153 387 392 777 926]: (0, 10) → (0, 4) → (3, 4) → (4, 4) found. Sequential search takes time proportional to n; binary search to log₂ n (n = 1,000,000 → about 20). Binary search beats sequential search; recursive binary search isn't faster than iterative binary search (call overhead).",
    steps: [
      { k: "learn", title: "Figure 17.16", b: [
        code(`int BinarySearch(int item, int list[], int start, int end)
{
   int middle = (end + start) / 2;

   // Did we not find what we are looking for?
   if (end < start)
      return -1;

   // Did we find the item?
   else if (list[middle] == item)
      return middle;

   // Should we search the first half of the array?
   else if (item < list[middle])
      return BinarySearch(item, list, start, middle - 1);

   // Or should we search the second half of the array?
   else
      return BinarySearch(item, list, middle + 1, end);
}`),
        `<p>Two base cases (found, or nothing left) and two recursive cases. start and end mark the piece still being searched; the array itself is passed by address, so nothing is copied.</p>`,
      ]},
      { k: "play", title: "Search the book's array (Figure 17.17)", b: [
        `<p>Predict the sequence of (start, end) pairs before choosing each item. Try 400, which isn't there.</p>`,
        binSearch,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A sorted array has about 1000 elements. Roughly how many halvings does binary search need in the worst case?", a: 10, tol: 0.1, why: "2¹⁰ = 1024, so about 10 (log₂ 1000 ≈ 10). A sequential search could need 1000 comparisons." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does binary search need the array to be sorted?", model: "Because after comparing with the middle element it throws away half the array, assuming everything in that half is too small or too big. That's only true if the elements are in order; otherwise the item could be in the half it discarded." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Escaping a maze", mins: 25,
    blurb: "Recursion as systematic search: try every direction from every open square, marking where you've been.",
    takeaway: "Recursion suits searching all possibilities (Sudoku, mazes); Chapter 8 did a maze in LC-3 assembly. Represent the maze as a 2-D char array: 'X' blocked, ' ' open, 'E' exit (Figure 17.18, 4 × 4, exit at maze[3][0], start at maze[1][2]). Idea: any path from a point goes through the square below, right, above or left of it, so try each recursively. Base cases: outside the maze (return 0), the exit (return 1), not open: wall or already visited 'V' (return 0; prevents going in circles). Otherwise mark 'V', then try down, right, up, left; if any returns 1, mark this square 'P' (on the path) and return 1; if none, return 0 (Figure 17.19). This is a depth-first search; each invocation can make up to four recursive calls (Figure 17.20: from the start, down, right and up fail immediately; left opens new calls).",
    steps: [
      { k: "learn", title: "The idea", b: [
        `<p>If there's a path out from where you stand, it starts by going down, right, up or left. So try each of those squares, and from <i>there</i> ask the same question. Base cases: off the edge (no), a wall (no), a square already visited (no, or you'd go in circles), the exit (yes!).</p>`,
        seenPP("The LC-3 maze solver.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "learn", title: "Figure 17.19 (the core)", b: [
        code(`if (xpos < 0 || xpos >= MAZE_HEIGHT || ypos < 0 || ypos >= MAZE_WIDTH)
   return 0;
if (maze[xpos][ypos] == 'E')   // Found the Exit!
   return 1;
if (maze[xpos][ypos] != ' ')   // Space is not empty (possibly X or V)
   return 0;

maze[xpos][ypos] = 'V';        // Mark this space as visited

if (ExitMaze(maze, xpos + 1, ypos)) {   // Go Down
   maze[xpos][ypos] = 'P';
   return 1;
}
// ... then Right, Up, Left the same way

return 0;                      // No path to Exit`, { nums: false }),
      ]},
      { k: "play", title: "Search the book's maze", b: [
        `<p>Start at maze[1][2]. Before each step, predict which direction is tried next and what it returns.</p>`,
        mazeWidget,
        `<p>The search goes as deep as it can along one direction before backing up: a <b>depth-first search</b>. The P squares that remain are the path; the run-time stack remembered how to back out of every dead end.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What would happen if ExitMaze didn't mark squares with 'V'?", opts: [["It could bounce between two open squares forever", true, "From A it tries B, from B it tries A again… The V marks are what stop that."], ["It would find shorter paths", false, "It would never finish on many mazes."], ["Nothing: walls already stop it", false, "Walls don't stop going back and forth between open squares."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the run-time stack help ExitMaze back out of a dead end?", model: "Every square being explored has its own pending invocation of ExitMaze on the stack, remembering its position and which directions it has tried. When a call returns 0 from a dead end, control goes back to the caller's frame, which simply tries its next direction. The stack is the memory of how we got here." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp17", eyebrow: "Patt & Patel · Chapter 17", title: "Recursion",
    intro: `<p>Six parts: what recursion is, recursion versus loops, Towers of Hanoi, Fibonacci and its cost (down to the LC-3 code), binary search, and a recursive maze solver.</p><p>Recursion clicks when you can see the pending calls, so each part lets you step through them. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For tracing questions, draw each call as a box with its argument, nest the boxes it calls inside it, and write each return value on the arrow back out.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>The idea</h3>
      <p>A function that calls itself on a smaller problem, plus a base case. RunningSum(n) = n + RunningSum(n − 1), RunningSum(1) = 1. Each invocation has its own stack frame; no special handling needed. Everything recursive can be iterative; recursion costs call overhead (tail recursion can be optimized).</p>
      <h3>Examples</h3>
      <p>Hanoi: move n − 1 to the spare post, move disk n, move n − 1 on top. Fibonacci: elegant but recomputes subproblems. Binary search: halve a sorted range; base cases found / empty (−1); ~log₂ n steps. Maze: depth-first search marking V (visited) and P (path).</p>`,
  };
  Course.start(window.CHAPTER);
})();

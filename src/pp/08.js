(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { sim, assemble, Machine, h4, s16 } = LC3;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>Also in Harris & Harris:</b> ${html} <a href="../hh/${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;

  /* =============== PART 1 =============== */
  const CALL = `        .ORIG x3000
        AND  R0,R0,#0
        ADD  R0,R0,#5     ; argument 5
        JSR  DOUBLE       ; R7 <- return address
        ADD  R1,R0,#0     ; R1 = 10
        ADD  R0,R0,#3     ; argument 13
        JSR  DOUBLE       ; called again from a different place
        ADD  R2,R0,#0     ; R2 = 26
        HALT
DOUBLE  ADD  R0,R0,R0     ; R0 <- 2 * R0
        RET               ; = JMP R7
        .END`;
  const p1 = {
    id: "p1", title: "Subroutines: call and return", mins: 25,
    blurb: "Write a fragment once, call it from anywhere. JSR saves the way back in R7; RET uses it.",
    takeaway: "Subroutines (procedures, functions) let a program fragment be written once and used many times, possibly written by someone else or supplied in a library (e.g. the Math Library's square root, sine). Caller = the program containing the call; callee = the subroutine. Call/return: JSR/JSRR (opcode 0100) loads the PC with the subroutine's start and loads R7 with the return linkage (the incremented PC, the address after the call); JMP R7 (RET) at the end returns. Bit [11] picks the mode: 1 = JSR, PC-relative with an 11-bit offset (range about ±1024; book: JSR at x4200 with offset x404 = −1020 goes to x3E05, R7 = x4201); 0 = JSRR, Base Register (bits [8:6]), like JMP (book: JSRR R5 at x420A with R5 = x3002 → PC x3002, R7 x420B). The book asks what JSRR offers that JSR doesn't.",
    steps: [
      { k: "learn", title: "Why subroutines", b: [
        `<p>The same few instructions often appear in several places. Instead of copying them, write them once as a <b>subroutine</b> and <b>call</b> it whenever needed. Libraries are collections of subroutines someone else wrote (square root, sine…).</p>`,
        `<p>The <b>caller</b> calls; the <b>callee</b> (the subroutine) does the job and <b>returns</b> to the instruction after the call.</p>`,
      ]},
      { k: "learn", title: "JSR, JSRR, RET", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>JSR LABEL</code></td><td>0100 1 PCoffset11</td><td>R7 ← PC; PC ← PC + SEXT(offset11)</td></tr>
          <tr><td><code>JSRR BaseR</code></td><td>0100 0 00 BaseR 000000</td><td>R7 ← PC; PC ← BaseR</td></tr>
          <tr><td><code>RET</code></td><td>= JMP R7</td><td>PC ← R7</td></tr></tbody></table></div>`,
        `<p>R7 holds the <b>return linkage</b>: the incremented PC, i.e. the address right after the JSR.</p>`,
        `<p class="aside">The book's question: what can JSRR do that JSR can't? Compare how each finds the subroutine's address.</p>`,
      ]},
      { k: "play", title: "Call it twice", b: [
        (host) => sim(host, { src: CALL, io: false, listHeight: 260 }),
        `<p class="aside">Watch R7 after each JSR: a different return address each time, so RET goes back to the right place.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "JSR at x5000 with PCoffset11 = 20. Where does the subroutine start (decimal offset from x5000)?", a: 21, tol: 0.01, why: "x5001 + 20 = x5015, 21 past x5000." },
        { t: "mcq", q: "After that JSR, R7 contains…", opts: [["x5001", true, "The address after the JSR."], ["x5000", false, "That's the JSR itself."], ["x5015", false, "That's the subroutine."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a subroutine know where to return to?", model: "The JSR or JSRR that called it saved the return address, the address of the instruction after the call, in R7. The subroutine ends with JMP R7 (RET), which loads that address into the PC, so execution continues right after the call, wherever the call came from." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const CLOB = `        .ORIG x3000
        AND  R1,R1,#0
        ADD  R1,R1,#7     ; caller keeps 7 in R1
        JSR  SUB
        ADD  R2,R1,#0     ; caller expects R2 = 7 ...
        HALT
SUB     ST   R1,SAVER1    ; callee save
        AND  R1,R1,#0
        ADD  R1,R1,#15    ; subroutine uses R1 for its own work
        LD   R1,SAVER1    ; callee restore
        RET
SAVER1  .BLKW 1
        .END`;
  const p2 = {
    id: "p2", title: "Saving and restoring registers", mins: 20,
    blurb: "A subroutine must not wreck the caller's registers. Callee save, caller save, and R7.",
    takeaway: "Loading a register destroys its old value, so a value must be saved if it will be destroyed and still be needed. A subroutine that uses registers the caller is relying on would corrupt them. Callee save: the subroutine (which knows which registers it uses) stores them to memory at the start (ST R1, SaveR1…) and restores them before returning (LD); memory locations are set aside for this. Caller save: the caller saves registers it knows will be destroyed by its own actions, notably R7, which every JSR overwrites, and any register the subroutine documents as an output (e.g. R5 success/failure). Rule: whoever knows a register will be destroyed saves it.",
    steps: [
      { k: "learn", title: "Who saves what?", b: [
        `<div class="two"><div class="tile"><h3>Callee save</h3><p>The subroutine knows which registers it uses. It stores them on entry and reloads them before RET.</p></div><div class="tile"><h3>Caller save</h3><p>The caller knows what <i>its</i> actions destroy: every JSR overwrites <b>R7</b>, and some subroutines return results in a register. The caller saves those if it still needs them.</p></div></div>`,
        `<p>Save a register value if it will be overwritten <b>and</b> you need it afterwards. Saving = store to memory; restoring = load back.</p>`,
        seenHH("MIPS formalizes this as preserved and nonpreserved registers.", "06-architecture.html#p8", "Chapter 6, Part 8"),
      ]},
      { k: "play", title: "Callee save in action", b: [
        (host) => sim(host, { src: CLOB, editable: true, rows: 13, io: false, listHeight: 260 }),
        `<p class="aside">The subroutine borrows R1 but saves and restores it, so the caller still sees 7. Delete the ST and LD lines, assemble, and run: what does R2 become?</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A main program has a useful value in R7 and calls a subroutine. Who should save R7?", opts: [["The caller: it knows the JSR will overwrite R7", true, "Caller save."], ["The callee", false, "By the time the callee runs, R7 is already gone."], ["Nobody: R7 is reserved", false, "It's a normal register the JSR uses."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does it make sense for the callee to save the registers it uses?", model: "The callee knows exactly which registers it is going to overwrite to do its job, while the caller shouldn't have to know the subroutine's internals. So the subroutine stores those registers at the start and restores them before returning, and the caller can assume its registers survive the call, apart from documented outputs and R7." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const HYP = `        .ORIG x3000
        LD   R0,SIDE1
        BRz  S1
        JSR  SQUARE
S1      ADD  R1,R0,#0     ; R1 = SIDE1^2
        LD   R0,SIDE2
        BRz  S2
        JSR  SQUARE
S2      ADD  R0,R0,R1     ; R0 = SIDE1^2 + SIDE2^2
        ST   R0,SUMSQ     ; (a SQRT library routine would go here)
        HALT
SQUARE  ADD  R2,R0,#0     ; R0 <- R0 * R0 by repeated addition
        ADD  R3,R0,#0
AGAIN   ADD  R2,R2,#-1
        BRz  DONE
        ADD  R0,R0,R3
        BRnzp AGAIN
DONE    RET
SIDE1   .FILL #10
SIDE2   .FILL #24
SUMSQ   .BLKW 1
        .END`;
  const p3 = {
    id: "p3", title: "Library routines", mins: 15,
    blurb: "Use code you couldn't (or don't want to) write. The ladder problem and the square root.",
    takeaway: "Library routines are productivity enhancers: you use them knowing only the interface (label, where arguments go, where results come back), not how they work. Example: a ladder reaching a window 24 ft up with its base 10 ft out: c = √(a² + b²). Squaring is easy (repeated addition, a SQUARE subroutine); square root needs Newton–Raphson, which the Math Library supplies. With .EXTERNAL SQRT and BASE .FILL SQRT, the program does LD R4, BASE; JSRR R4 (the library may be far away, beyond JSR's reach) with the argument and result in R0. The linker combines the separately assembled modules into the executable image.",
    steps: [
      { k: "learn", title: "Using without knowing how", b: [
        `<p>A ladder must reach a window 24 ft up, with its foot 10 ft from the wall: c = √(10<sup>2</sup> + 24<sup>2</sup>). Squaring and adding are easy. Square root? Most programmers would rather not learn Newton–Raphson. The <b>Math Library</b> has <code>SQRT</code>: you only need its <b>interface</b>: its label, argument in R0, result in R0.</p>`,
        pre(`        .EXTERNAL SQRT     ; defined in another module
        ...
        LD   R4,BASE       ; address of the library routine
        JSRR R4            ; R0 <- SQRT(R0)
        ...
BASE    .FILL SQRT         ; filled in by the linker`),
        `<p class="aside">Why JSRR? The library could be anywhere in memory, possibly far beyond JSR's ±1024 reach.</p>`,
      ]},
      { k: "play", title: "The squares part", b: [
        (host) => sim(host, { src: HYP, io: false, watch: [["SUMSQ", "SUMSQ"]], maxSteps: 2000, listHeight: 280 }),
        `<p class="aside">SQUARE is called twice. SUMSQ should end at 676 = 26<sup>2</sup>: a 26 ft ladder.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a programmer need to know to use a library routine?", model: "Only its interface: the label or address where it starts, where to put the arguments (for example R0), where the result comes back, and which registers it may change. How it computes the result can stay a black box, which is exactly what makes libraries productivity enhancers." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  function stackSvg(mem, r6) {
    let s = "";
    for (let a = 0x3ffb; a <= 0x3fff; a++) {
      const y = 20 + (a - 0x3ffb) * 34, on = a >= r6;
      s += `<rect x="150" y="${y}" width="110" height="30" style="fill:${on ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(140, y + 20, h4(a), { a: "end", cls: "s m" }) + S.t(205, y + 20, mem[a] === undefined ? "//////" : String(mem[a]), { cls: on ? "s" : "s m" });
      if (a === r6) s += S.t(270, y + 20, "← TOP (R6)", { a: "start", cls: "s a" });
    }
    if (r6 === 0x4000) s += S.t(270, 206, "R6 = x4000: empty", { a: "start", cls: "s a" });
    return S.svg(420, 210, s, { max: 420, label: "Stack in memory" });
  }
  const p4 = {
    id: "p4", title: "The stack", mins: 30,
    blurb: "Last in, first out. Defined by how you use it, not how it's built. In memory with R6 as the pointer.",
    takeaway: "A stack is an abstract data type defined by its access rule: last in, first out (LIFO); push inserts, pop removes. Implementations: a car's coin holder or a hardware register stack (entries move on each push/pop), or, most commonly, sequential memory locations with a stack pointer (entries don't move). LC-3 convention: R6 is the stack pointer; the stack grows toward 0. Book example: x3FFF down to x3FFB; empty when R6 = x4000. PUSH: ADD R6,R6,#−1; STR R0,R6,#0. POP: LDR R0,R6,#0; ADD R6,R6,#1. Popped values remain in memory but are unreachable under the stack protocol. Underflow: popping an empty stack (test R6 = x4000 via adding −x4000 = xC000); overflow: pushing a full one (R6 = x3FFB, test with xC005). Routines report success/failure in R5 (0/1), which makes R5 caller-saved.",
    steps: [
      { k: "learn", title: "LIFO", b: [
        `<p>A <b>stack</b> is defined by one rule: the <b>last</b> thing in is the <b>first</b> thing out. <b>Push</b> puts something on top; <b>pop</b> takes the top thing off. That's all: it's an <b>abstract data type</b>, defined by its operations, not its construction.</p>`,
        `<div class="two"><div class="tile"><h3>Coin holder / hardware stack</h3><p>Every push and pop moves all the entries.</p></div><div class="tile"><h3>In memory</h3><p>Entries stay put; a <b>stack pointer</b> (R6 in the LC-3) moves. Grows toward 0.</p></div></div>`,
      ]},
      { k: "play", title: "Push and pop", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const mem = {}; let r6 = 0x4000, r0 = 18, msg = "";
          const vals = [18, 31, 5, 12, 40, 7];
          function draw() { f.innerHTML = stackSvg(mem, r6); ro.innerHTML = readout([["R6 (stack pointer)", h4(r6)], ["R0", String(r0)]]); vd.className = "verdict " + (/fail/.test(msg) ? "no" : "ok"); vd.textContent = msg || "Empty stack."; }
          let vi = 0;
          const push = btn("PUSH next value", "primary"), pop = btn("POP");
          push.addEventListener("click", () => { r0 = vals[vi++ % vals.length]; if (r6 === 0x3ffb) { msg = `Overflow: R5 = 1 (push of ${r0} failed)`; } else { r6--; mem[r6] = r0; msg = `Pushed ${r0}: ADD R6,R6,#-1 then STR R0,R6,#0. R5 = 0`; } draw(); });
          pop.addEventListener("click", () => { if (r6 === 0x4000) { msg = "Underflow: nothing to pop. R5 = 1 (failed)"; } else { r0 = mem[r6]; r6++; msg = `Popped ${r0}: LDR R0,R6,#0 then ADD R6,R6,#1. R5 = 0`; } draw(); });
          const row = el(`<div class="row"></div>`); row.append(push, pop);
          host.append(row, f, vd, ro);
          draw();
        },
        `<p class="aside">Five words, x3FFF down to x3FFB. Push 18, 31, 5, 12, then pop twice: 12 and 5 are still in memory (greyed), but the stack protocol never lets you read them.</p>`,
      ]},
      { k: "learn", title: "Underflow and overflow", b: [
        pre(`POP     AND  R5,R5,#0     ; assume success
        LD   R1,EMPTY     ; EMPTY = -x4000 = xC000
        ADD  R2,R6,R1     ; R6 == x4000 ?
        BRz  Failure      ; empty: underflow
        LDR  R0,R6,#0
        ADD  R6,R6,#1
        RET
Failure ADD  R5,R5,#1     ; R5 = 1: failure
        RET`),
        `<p>PUSH checks against x3FFB (−x3FFB = xC005) the same way. Reporting failure in R5 instead of jumping elsewhere lets the caller decide what to do; it also means the caller must save R5 if it needs it.</p>`,
        seenHH("The MIPS stack works the same way with $sp.", "06-architecture.html#p8", "Chapter 6, Part 8"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "R6 = x3FFD in the book's stack. How many values are on it?", opts: [["3 (x3FFF, x3FFE, x3FFD)", true, "From x3FFF down to R6."], ["2", false, ""], ["5", false, ""]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "After popping, the old value is still in memory. Why isn't that a problem?", model: "Under the stack protocol, memory is only read through POP at the location R6 points to, and R6 has moved past the popped value. The value is unreachable unless someone breaks the protocol, and the next push will overwrite it." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  function fibCalls(n) { const c = [1, 1]; for (let i = 2; i <= n; i++) c[i] = 1 + c[i - 1] + c[i - 2]; return c[n]; }
  const p5 = {
    id: "p5", title: "Recursion: when it hurts", mins: 25,
    blurb: "Factorial and Fibonacci are elegant recursively and wasteful in practice.",
    takeaway: "Recursion expresses a function in terms of itself; every recursive subroutine needs a base-case test before the recursive call. A recursive FACT (n! = n × (n−1)!) naively breaks twice: the inner JSR overwrites R7 (the way back to main), and the inner call overwrites R1 (where n was saved), and callee-save into a fixed memory word is also overwritten. Fix: push the return linkage, n, and the caller's R1 on the stack (R6) and pop them afterwards (Figure 8.14); the stack holds three entries per pending call. But it's a bad use of recursion: an iterative loop (Figure 8.16) does the same job without the pushing and popping. Fibonacci (FIB(n) = FIB(n−1) + FIB(n−2), FIB(0) = 0, FIB(1) = 1) is worse: each call makes two more, so the same values are recomputed over and over; the number of calls grows exponentially, while an iterative version is linear.",
    steps: [
      { k: "learn", title: "Why naive recursion breaks", b: [
        `<p>FACT calls itself with <code>JSR FACT</code>. Two things go wrong unless you're careful:</p>`,
        `<ol><li>The inner JSR overwrites <b>R7</b>: the way back to main is lost.</li><li>Each call stores its n in the same register (or the same save location): the inner call wipes out the outer one's n.</li></ol>`,
        `<p>The fix is the <b>stack</b>: each call pushes its return linkage, its n and anything else it needs, and pops them after the recursive call returns. Every pending call has its own entries.</p>`,
        seenHH("The MIPS version, with stack frames.", "06-architecture.html#p9", "Chapter 6, Part 9"),
      ]},
      { k: "learn", title: "But should you?", b: [
        pre(`FACT    ST   R1,SAVE_R1   ; iterative version (assuming a MUL instruction)
        ADD  R1,R0,#0
        ADD  R0,R0,#-1
        BRz  DONE
AGAIN   MUL  R1,R1,R0
        ADD  R0,R0,#-1
        BRnp AGAIN
DONE    ADD  R0,R1,#0
        LD   R1,SAVE_R1
        RET`),
        `<p>Same result, no pushing and popping. The recursive version is beautiful and slow. (The LC-3 has no MUL; the book pretends it does to focus on the recursion.)</p>`,
      ]},
      { k: "play", title: "Fibonacci's explosion", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let n = 10;
          function draw() { ro.innerHTML = readout([["Calls made by recursive FIB(n)", fibCalls(n).toLocaleString()], ["Additions in an iterative loop", String(Math.max(0, n - 1))]]); }
          host.append(slider({ id: id + "-n", label: "n", min: 1, max: 30, step: 1, value: n, show: (x) => String(x) }, (x) => { n = Math.round(x); draw(); }).el, ro);
          draw();
        },
        `<p class="aside">FIB(n) calls FIB(n−1) and FIB(n−2), which call FIB(n−2) and FIB(n−3) and so on: the same values get recomputed again and again. The call count grows exponentially; the loop is linear.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What must every recursive subroutine contain before its recursive call?", opts: [["A base-case test that returns without recursing", true, "Otherwise it calls itself forever."], ["A HALT", false, ""], ["A check for overflow", false, "Useful, but not the essential part."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is recursion a poor way to compute Fibonacci numbers?", model: "Each call makes two further calls, and those overlap heavily, so the same smaller Fibonacci numbers are recomputed many times. The number of calls grows exponentially with n, while a simple loop that keeps the last two values computes the answer in about n steps." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const MAZE = [6, 7, 5, 5, 3, 0, 8, 10, 4, 3, 12, 0x15, 0, 12, 1, 10, 2, 2, 6, 5, 7, 13, 11, 10, 10, 0, 10, 2, 8, 10, 8, 0, 0x1a, 12, 1, 8];
  const MAZEPROG = `        .ORIG x3000
        LD   R6,STACK     ; stack pointer
        LD   R0,START     ; address of the starting cell
        JSR  FIND_EXIT
        HALT
STACK   .FILL x7000
START   .FILL x5000
FIND_EXIT ADD R6,R6,#-1   ; push R2, R3, R7
        STR  R2,R6,#0
        ADD  R6,R6,#-1
        STR  R3,R6,#0
        ADD  R6,R6,#-1
        STR  R7,R6,#0
        ADD  R3,R0,#0     ; R3 = this cell's address
        LDR  R2,R0,#0     ; R2 = this cell's data
        LD   R7,EXIT_MASK
        AND  R7,R2,R7
        BRnp DONE_YES     ; a door to the outside!
        LD   R7,BREADCRUMB
        ADD  R2,R2,R7
        STR  R2,R0,#0     ; leave a breadcrumb (bit 15)
CHECK_NORTH LD R7,NORTH_MASK
        AND  R7,R2,R7
        BRz  CHECK_EAST
        LDR  R7,R3,#-6
        BRn  CHECK_EAST   ; already visited
        ADD  R0,R3,#-6
        JSR  FIND_EXIT
        ADD  R1,R1,#0
        BRp  DONE_YES
CHECK_EAST LD R7,EAST_MASK
        AND  R7,R2,R7
        BRz  CHECK_SOUTH
        LDR  R7,R3,#1
        BRn  CHECK_SOUTH
        ADD  R0,R3,#1
        JSR  FIND_EXIT
        ADD  R1,R1,#0
        BRp  DONE_YES
CHECK_SOUTH LD R7,SOUTH_MASK
        AND  R7,R2,R7
        BRz  CHECK_WEST
        LDR  R7,R3,#6
        BRn  CHECK_WEST
        ADD  R0,R3,#6
        JSR  FIND_EXIT
        ADD  R1,R1,#0
        BRp  DONE_YES
CHECK_WEST LD R7,WEST_MASK
        AND  R7,R2,R7
        BRz  DONE_NO
        LDR  R7,R3,#-1
        BRn  DONE_NO
        ADD  R0,R3,#-1
        JSR  FIND_EXIT
        ADD  R1,R1,#0
        BRp  DONE_YES
DONE_NO AND  R1,R1,#0
        BR   RESTORE
DONE_YES AND R1,R1,#0
        ADD  R1,R1,#1
RESTORE ADD  R0,R3,#0
        LDR  R7,R6,#0     ; pop R7, R3, R2
        ADD  R6,R6,#1
        LDR  R3,R6,#0
        ADD  R6,R6,#1
        LDR  R2,R6,#0
        ADD  R6,R6,#1
        RET
BREADCRUMB .FILL x8000
EXIT_MASK  .FILL x0010
NORTH_MASK .FILL x0008
EAST_MASK  .FILL x0004
SOUTH_MASK .FILL x0002
WEST_MASK  .FILL x0001
        .END`;
  function mazeSvg(mem, start) {
    const C = 52, X0 = 54, Y0 = 14;
    let s = "";
    for (let i = 0; i < 36; i++) {
      const r = Math.floor(i / 6), c = i % 6, x = X0 + c * C, y = Y0 + r * C, v = mem(i), crumb = v & 0x8000;
      if (crumb) s += `<rect x="${x + 2}" y="${y + 2}" width="${C - 4}" height="${C - 4}" style="fill:var(--accent-soft)"/>`;
      if (i === start) s += `<circle cx="${x + C / 2}" cy="${y + C / 2}" r="11" style="fill:var(--accent)"/>`;
      else if (crumb) s += `<circle cx="${x + C / 2}" cy="${y + C / 2}" r="4" style="fill:var(--accent)"/>`;
      if (v & 0x10) s += S.t(x + C / 2, y + C - 6, "EXIT", { cls: "s g" });
      const wall = (x1, y1, x2, y2, open) => (open ? "" : `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--ink);stroke-width:3"/>`);
      s += wall(x, y, x + C, y, v & 8 || (r === 0 && v & 0x10)) + wall(x + C, y, x + C, y + C, v & 4) + wall(x, y + C, x + C, y + C, v & 2) + wall(x, y, x, y + C, v & 1);
      s += S.t(x + 8, y + 14, String(i), { a: "start", cls: "s m" });
    }
    return S.svg(420, Y0 * 2 + 6 * C, s, { max: 420, label: "6 by 6 maze with breadcrumbs" });
  }
  const p6 = {
    id: "p6", title: "Recursion: when it shines", mins: 30,
    blurb: "Escape a maze. Recursion keeps track of every path for you.",
    takeaway: "Recursion is worth it when it makes a complicated problem simple. The maze: each cell is a word with bit 4 = door to the outside, bits 3–0 = doors north, east, south, west; a 6×6 maze is stored in row-major order (north = −6, south = +6, east = +1, west = −1). FIND_EXIT(cell in R0) returns R1 = 1 if an exit is reachable: if this cell has an outside door, yes; otherwise leave a breadcrumb (set bit 15) and, for each direction with a door to a cell without a breadcrumb, recursively try it; if any succeeds, yes; else no. Breadcrumbs prevent infinite loops around cycles. The subroutine pushes R2 (cell data), R3 (cell address), R7 (linkage) on the stack and pops them at the end; the stack remembers every partly explored path, which would be painful bookkeeping without recursion.",
    steps: [
      { k: "learn", title: "The maze in memory", b: [
        `<p>Each cell is one word: <b>bit 4</b> = door to the outside; bits 3, 2, 1, 0 = doors <b>north, east, south, west</b>. The 36 cells are stored row by row (<b>row-major</b>), so north is −6, south +6, east +1, west −1.</p>`,
        `<p><b>FIND_EXIT(cell)</b>: if the cell has an outside door, return yes. Otherwise drop a <b>breadcrumb</b> (set bit 15) and try each direction that has a door to an unvisited cell, by calling FIND_EXIT there. If any call says yes, say yes; else no.</p>`,
        `<p class="aside">The breadcrumbs stop you going round in circles. The stack remembers where you are in every half-explored path, so you don't have to.</p>`,
      ]},
      { k: "play", title: "Find the way out", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const img = assemble(MAZEPROG);
          let start = 0, m = null;
          function run() {
            m = new Machine(); m.load(img); MAZE.forEach((v, i) => { m.mem[0x5000 + i] = v; }); m.mem[img.sym.START] = 0x5000 + start; m.run(200000);
            let maxDepth = 0; // estimate max stack use from the lowest address touched
            for (let a = 0x6f00; a < 0x7000; a++) if (m.mem[a]) { maxDepth = Math.max(maxDepth, Math.round((0x7000 - a) / 3)); break; }
            f.innerHTML = mazeSvg((i) => m.mem[0x5000 + i], start);
            ro.innerHTML = readout([["Starting cell", String(start)], ["Result R1", m.R[1] ? "1: there's a way out" : "0: no way out"], ["Instructions executed", m.count.toLocaleString()], ["Cells visited (breadcrumbs)", String(MAZE.map((_, i) => m.mem[0x5000 + i] & 0x8000).filter(Boolean).length)]]);
          }
          const sel = el(`<select aria-label="Starting cell"></select>`);
          for (let i = 0; i < 36; i++) { const o = document.createElement("option"); o.value = i; o.textContent = "Start in cell " + i; sel.append(o); }
          sel.addEventListener("change", () => { start = +sel.value; run(); });
          host.append(sel, f, ro);
          run();
        },
        `<p class="aside">The book's maze (Figure 8.22), solved by its FIND_EXIT routine running on the simulator. Highlighted cells got a breadcrumb. Try start cells 0, 9, 5 and 31. Notice the search order: north first, then east, south, west.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What would happen without the breadcrumbs?", opts: [["The search could circle forever through a loop of open doors", true, "North, east, south, west… back to the start."], ["It would just be slower", false, "It might never finish."], ["Nothing", false, ""]] },
        { t: "num", q: "In a 6-column maze stored row-major starting at x5000, what's the address of the cell directly south of x500A?", a: 20496, tol: 0.0001, hint: "+6.", why: "x5010 = 20496." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is recursion a good fit for the maze problem but not for factorial?", model: "Exploring a maze means trying a path, and if it fails, backing up to the last junction and trying another, possibly many levels deep. Recursion with a stack remembers each pending junction automatically, so the code stays simple. Factorial has no branching to remember: a simple loop does the same work without any stack overhead." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function queueSvg(mem, F, R) {
    let s = "";
    for (let a = 0x8000; a <= 0x8005; a++) {
      const y = 14 + (a - 0x8000) * 32;
      let live = false; { let p = F; while (p !== R) { p = p === 0x8005 ? 0x8000 : p + 1; if (p === a) { live = true; break; } } }
      s += `<rect x="150" y="${y}" width="110" height="28" style="fill:${live ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(140, y + 19, h4(a), { a: "end", cls: "s m" }) + S.t(205, y + 19, mem[a] === undefined ? "" : String(mem[a]), { cls: live ? "s" : "s m" });
      const tags = (a === F ? ["FRONT (R3)"] : []).concat(a === R ? ["REAR (R4)"] : []);
      if (tags.length) s += S.t(270, y + 19, "← " + tags.join(", "), { a: "start", cls: "s a" });
    }
    return S.svg(420, 214, s, { max: 420, label: "Queue in six memory locations" });
  }
  const p7 = {
    id: "p7", title: "The queue", mins: 30,
    blurb: "First in, first out. Two pointers, wrap-around, and why a queue of 6 holds only 5.",
    takeaway: "A queue is FIFO: insert at the rear, remove from the front. Book layout: x8000–x8005; FRONT (R3) points just before the first element; REAR (R4) points at the most recent element. Remove: increment FRONT, LDR from it; insert: increment REAR, STR to it. Wrap-around: when a pointer is at x8005 (LAST), the next location is x8000 (FIRST); the code compares with −x8005 (x7FFB). FRONT = REAR means empty, so allowing all n slots to fill would also make FRONT = REAR (ambiguous): a queue of n locations holds at most n − 1 elements. Underflow: remove when FRONT = REAR. Overflow: incrementing REAR would make it equal FRONT; undo the increment (with wrap-around) and fail. The complete subroutine (Figure 8.27) reports R5 = 0 success, 1 failure, and saves R1.",
    steps: [
      { k: "learn", title: "FIFO with two pointers", b: [
        `<p>A <b>queue</b> serves the first arrival first: <b>FIFO</b>. Insert at the <b>rear</b>, remove from the <b>front</b>.</p>`,
        pre(`; remove                 ; insert
ADD  R3,R3,#1            ADD  R4,R4,#1
LDR  R0,R3,#0            STR  R0,R4,#0`),
        `<p>FRONT (R3) points just <i>before</i> the first element; REAR (R4) points <i>at</i> the last one. When either pointer passes x8005 it <b>wraps around</b> to x8000.</p>`,
      ]},
      { k: "play", title: "Insert and remove", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          const mem = { 0x8000: 45, 0x8001: 17, 0x8002: 23, 0x8003: 2, 0x8004: 74 };
          let F = 0x8001, R = 0x8004, msg = "Starting state: Figure 8.25a. Live elements are highlighted.", next = 10;
          const inc = (p) => (p === 0x8005 ? 0x8000 : p + 1), dec = (p) => (p === 0x8000 ? 0x8005 : p - 1);
          function draw() { f.innerHTML = queueSvg(mem, F, R); vd.className = "verdict " + (/fail/i.test(msg) ? "no" : "ok"); vd.textContent = msg; }
          const ins = btn("INSERT next value", "primary"), rem = btn("REMOVE");
          ins.addEventListener("click", () => { R = inc(R); if (R === F) { R = dec(R); msg = `Insert ${next} failed: overflow (queue full at 5). R5 = 1`; } else { mem[R] = next; msg = `Inserted ${next} at ${h4(R)}. R5 = 0`; next += 10; } draw(); });
          rem.addEventListener("click", () => { if (F === R) { msg = "Remove failed: underflow (FRONT = REAR, empty). R5 = 1"; } else { F = inc(F); msg = `Removed ${mem[F]} from ${h4(F)}. R5 = 0`; } draw(); });
          const row = el(`<div class="row"></div>`); row.append(ins, rem);
          host.append(row, f, vd);
          draw();
        },
        `<p class="aside">Remove 23, insert a few values (watch REAR wrap to x8000), keep inserting until it refuses. Then empty it. Full and empty are both detectable only because one slot is always left unused.</p>`,
      ]},
      { k: "learn", title: "Why n − 1?", b: [
        `<p>Empty means FRONT = REAR. If we let all 6 slots fill, the last insert would also make REAR = FRONT, and a full queue would look exactly like an empty one. So a queue of n locations is declared <b>full at n − 1</b> elements.</p>`,
        `<p class="aside">The book's complete routine (Figure 8.27) handles wrap-around in both directions, undoes the REAR increment on overflow, and reports success or failure in R5.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A queue is allocated 10 memory locations. How many elements can it hold at once?", a: 9, tol: 0.01 },
        { t: "mcq", q: "REAR = x8005 in the book's queue. Where does the next insert go?", opts: [["x8000 (wrap-around), if the queue isn't full", true, ""], ["x8006", false, "Outside the queue's memory."], ["Nowhere: the queue is full", false, "Not necessarily: elements may have been removed from the front."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do a stack and a queue differ in how they're accessed?", model: "A stack is last in, first out: pushes and pops both happen at the top, tracked by one pointer. A queue is first in, first out: elements are inserted at the rear and removed from the front, so it needs two pointers, which wrap around the allocated block as they advance." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const STRCMP = `        .ORIG x3000
        LEA  R0,NAME1
        LEA  R1,NAME2
        JSR  STRCMP       ; R5 = 0 if equal, 1 if not
        HALT
NAME1   .STRINGZ "Bill"
NAME2   .STRINGZ "Bilk"
STRCMP  ST   R2,SaveR2
        ST   R3,SaveR3
        AND  R5,R5,#0     ; R5 <-- match
NEXTCHAR LDR R2,R0,#0     ; char from 1st string
        LDR  R3,R1,#0     ; char from 2nd string
        BRnp COMPARE      ; 2nd string not done
        ADD  R2,R2,#0
        BRz  DONE         ; both done: match
COMPARE NOT  R2,R2
        ADD  R2,R2,#1
        ADD  R2,R2,R3     ; compare the two characters
        BRnp FAIL
        ADD  R0,R0,#1
        ADD  R1,R1,#1
        BRnzp NEXTCHAR
FAIL    ADD  R5,R5,#1     ; R5 <-- no match
DONE    LD   R2,SaveR2
        LD   R3,SaveR3
        RET
SaveR2  .BLKW 1
SaveR3  .BLKW 1
        .END`;
  const p8 = {
    id: "p8", title: "Character strings", mins: 25,
    blurb: "One ASCII code per word, ended by x0000. Records of pointers. Comparing two strings.",
    takeaway: "A character string is a one-dimensional array of ASCII codes, one per word (upper byte x00), ended by the null character x0000: \"Bill Linvill\" takes 13 words (11 letters, a space x20, the null). Records combine fields: the book's personnel record has six words: pointers to last name, first name, social security number string, and job title strings, plus salary and years of service as numbers. STRCMP (Figure 8.30) compares two strings character by character (via negate-and-add), returning R5 = 0 if identical, 1 if not; it saves and restores the registers it uses (R5 is the documented output). A string of digit characters can represent an arbitrarily long integer (79,245 as x37 x39 x32 x34 x35 x00); TEST_INTEGER checks each code lies in x30–x39.",
    steps: [
      { k: "learn", title: "Strings and records", b: [
        `<p>A <b>string</b>: one ASCII code per word, ended by <b>x0000</b>. “Bill Linvill” = 11 letters + a space (x20) + the null = 13 words.</p>`,
        `<p>A <b>record</b> groups fields. The book's personnel record is six words: pointers to the last name, first name, social security number and job-title strings, plus salary and years of service. Pointers let each string be any length and live anywhere.</p>`,
        seenPP(".STRINGZ builds these.", "07-assembly.html#p3", "Chapter 7, Part 3"),
      ]},
      { k: "play", title: "Compare two strings", b: [
        (host) => sim(host, { src: STRCMP, editable: true, rows: 12, io: false, listHeight: 240, maxSteps: 2000 }),
        `<p class="aside">“Bill” vs “Bilk”: R5 should end 1. Change NAME2 to "Bill", assemble, run: R5 = 0. What happens with "Bil" vs "Bill"?</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many words does .STRINGZ \"Engineer\" occupy?", a: 9, tol: 0.01, why: "8 characters + x0000." },
        { t: "mcq", q: "The digits of 79,245 are stored as a string. The first word holds…", opts: [["x0037", true, "'7' = x37."], ["x0007", false, "That's the number 7, not the character."], ["x0079", false, ""]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does STRCMP know when both strings have ended?", model: "Each string ends with the null character x0000. After loading a character from each string, if the second is zero it checks whether the first is also zero; if both are, every pair matched and the strings are equal. If only one has ended, or any pair differs, the comparison fails." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp8", eyebrow: "Patt & Patel · Chapter 8", title: "Data Structures",
    intro: `<p>Eight parts: subroutines and the call/return mechanism, saving registers, library routines, the stack, recursion done badly and done well, the queue, and character strings.</p><p>You'll push and pop by hand, run the book's maze solver on the simulator, and fill a queue until it refuses. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For stack and queue questions, draw the memory locations and pointers on paper and update them after every operation.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Subroutines</h3>
      <p>JSR (PC + offset11) / JSRR (BaseR): R7 ← return linkage, PC ← subroutine. RET = JMP R7. Callee saves registers it uses; caller saves R7 and documented outputs. Libraries via .EXTERNAL + JSRR.</p>
      <h3>Stack</h3>
      <p>LIFO; R6 = stack pointer, grows toward 0. PUSH: ADD R6,R6,#-1; STR R0,R6,#0. POP: LDR R0,R6,#0; ADD R6,R6,#1. Underflow/overflow → R5 = 1.</p>
      <h3>Recursion</h3>
      <p>Base case first; save linkage and live values on the stack. Factorial and Fibonacci: better as loops. Maze search: recursion with breadcrumbs.</p>
      <h3>Queue and strings</h3>
      <p>Queue: FIFO, FRONT before first, REAR at last, wrap-around, n − 1 capacity. Strings: ASCII per word, x0000 end; records of pointers; STRCMP.</p>`,
  };
  Course.start(window.CHAPTER);
})();

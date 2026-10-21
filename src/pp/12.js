(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { code, trace } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const lc3 = (t) => Digital.listing(t, { comment: ";" });
  const h4 = (v) => "0x" + (v & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  const b16 = (v) => (v & 0xffff).toString(2).padStart(16, "0").replace(/(....)(?=.)/g, "$1 ");

  /* ---------- Figure 12.1: nested scope ---------- */
  const FIG121 = `#include <stdio.h>

int globalVar = 2;  // This variable is a global variable

int main(void)
{
   int localVar = 3; // This variable is local to main

   printf("globalVar = %d, localVar = %d\\n", globalVar, localVar);

   // Creating a new sub-block within main
   {
      int localVar = 4; // This local to the sub-block within main

      printf("globalVar = %d, localVar = %d\\n", globalVar, localVar);
   }

   printf("globalVar = %d, localVar = %d\\n", globalVar, localVar);
}`;
  const o1 = "globalVar = 2, localVar = 3\n", o2 = o1 + "globalVar = 2, localVar = 4\n", o3 = o2 + "globalVar = 2, localVar = 3\n";
  const scopeTrace = (host) => trace(host, { code: FIG121, console: true, frames: [
    { l: 3, v: [["globalVar (global)", 2]], out: "", note: "The global is created before main runs and lives for the whole program." },
    { l: 7, v: [["globalVar (global)", 2], ["localVar (main)", 3]], out: "", note: "main's localVar is born when its block starts." },
    { l: 9, v: [["globalVar (global)", 2], ["localVar (main)", 3]], out: o1 },
    { l: 13, v: [["globalVar (global)", 2], ["localVar (main)", "3  (hidden)"], ["localVar (sub-block)", 4]], out: o1, note: "A new variable with the same name, local to the sub-block. Inside the braces, the name means this one." },
    { l: 15, v: [["globalVar (global)", 2], ["localVar (main)", "3  (hidden)"], ["localVar (sub-block)", 4]], out: o2 },
    { l: 16, v: [["globalVar (global)", 2], ["localVar (main)", 3]], out: o2, note: "The closing brace ends the sub-block: its localVar is gone." },
    { l: 18, v: [["globalVar (global)", 2], ["localVar (main)", 3]], out: o3, note: "The name refers to main's localVar again, still 3." },
  ] });

  /* ---------- order of evaluation ---------- */
  const EXPR = [
    ["2 + 3 * 4", ["2 + <b>3 * 4</b>", "<b>2 + 12</b>", "14"], "* binds tighter than +."],
    ["2 + 3 - 4 + 5", ["<b>2 + 3</b> - 4 + 5", "<b>5 - 4</b> + 5", "<b>1 + 5</b>", "6"], "Same precedence: + and − associate left to right."],
    ["a * b + c * d / 4   (all = 4)", ["<b>a * b</b> + c * d / 4", "16 + <b>c * d</b> / 4", "16 + <b>16 / 4</b>", "<b>16 + 4</b>", "20"], "* and / share a level and go left to right, before +."],
    ["a * (b + c) * d / 4   (all = 4)", ["a * <b>(b + c)</b> * d / 4", "<b>a * 8</b> * d / 4", "<b>32 * d</b> / 4", "<b>128 / 4</b>", "32"], "Innermost parentheses first, then the usual rules."],
  ];
  function evalOrder(host) {
    let e = 0, k = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const bNext = el(`<button type="button" class="btn primary">Next step</button>`), bReset = el(`<button type="button" class="btn">Start over</button>`);
    const draw = () => {
      const [src, steps, why] = EXPR[e];
      out.innerHTML = `<pre class="code" style="font-variant-ligatures:none">${steps.slice(0, k + 1).map((s, i) => (i ? "= " : "  ") + s).join("\n")}</pre>` + (k === steps.length - 1 ? `<p>${why}</p>` : `<p class="aside">The bold part is evaluated next. Predict it before you click.</p>`);
      bNext.disabled = k === steps.length - 1;
    };
    bNext.addEventListener("click", () => { k++; draw(); }); bReset.addEventListener("click", () => { k = 0; draw(); });
    row.append(bNext, bReset);
    host.append(toggle(EXPR.map((x) => x[0]), (i) => { e = i; k = 0; draw(); }, 0), row, out); draw();
  }

  /* ---------- bitwise operators on the book's operands ---------- */
  function bitwise(host) {
    const A = 0x1234, B = 0x5678;
    const OPS = [
      ["A | B", (a, b) => a | b, "OR: 1 where either has a 1"],
      ["A & B", (a, b) => a & b, "AND: 1 only where both do"],
      ["A ^ B", (a, b) => a ^ b, "XOR: 1 where they differ"],
      ["~A", (a) => ~a, "NOT: flip every bit"],
      ["A << 3", (a) => a << 3, "shift left 3, zeros fill in from the right"],
      ["A >> 2", (a) => a >> 2, "shift right 2, sign bit copied in from the left"],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const [name, f, what] = OPS[i], two = name.includes("B"), r = f(A, B);
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);font-size:14px;font-variant-ligatures:none"><tbody>
        <tr><td>A</td><td>${b16(A)}</td><td>${h4(A)}</td></tr>${two ? `<tr><td>B</td><td>${b16(B)}</td><td>${h4(B)}</td></tr>` : ""}
        <tr style="background:var(--accent-soft)"><td>${name}</td><td>${b16(r)}</td><td>${h4(r)}</td></tr></tbody></table></div><p>${what}. Every bit position is computed on its own; the operands themselves don't change.</p>`;
    };
    host.append(toggle(OPS.map((o) => o[0]), draw, 0), out); draw(0);
  }

  /* ---------- bitwise vs logical with the book's f = 7, g = 8 ---------- */
  function bitVsLogic(host) {
    const PAIRS = [["f & g", 0, "f && g", 1], ["f | g", 15, "f || g", 1], ["~f | ~g", -1, "!f && !g", 0]];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const [bw, bv, lg, lv] = PAIRS[i];
      out.innerHTML = `<div class="two"><div class="tile"><h3>Bitwise</h3><p class="mono" style="font-size:18px">${bw} = ${bv}</p><p class="aside">Works bit by bit: 0111 and 1000 share no 1s.</p></div><div class="tile"><h3>Logical</h3><p class="mono" style="font-size:18px">${lg} = ${lv}</p><p class="aside">Treats each whole value as true (nonzero) or false (0), and answers 1 or 0.</p></div></div>`;
    };
    host.append(el(`<p class="mono">int f = 7;   // 0000 0000 0000 0111<br>int g = 8;   // 0000 0000 0000 1000</p>`), toggle(PAIRS.map((p) => p[0] + "  vs  " + p[2]), draw, 0), out); draw(0);
  }

  /* ---------- Figure 12.4: transfer time ---------- */
  function transfer(host) {
    let amount = 50000000, rate = 1000;
    const out = el(`<div></div>`);
    const draw = () => {
      const time = Math.trunc(amount / rate), hours = Math.trunc(time / 3600), minutes = Math.trunc((time % 3600) / 60), seconds = (time % 3600) % 60;
      out.innerHTML = readout([["time = amount / rate", time + " s  (fraction dropped)"], ["hours = time / 3600", hours], ["minutes = (time % 3600) / 60", minutes], ["seconds = (time % 3600) % 60", seconds]]) + `<pre class="code">Time : ${hours}h ${minutes}m ${seconds}s</pre>`;
    };
    host.append(slider({ id: "pp12a", label: "amount (bytes)", min: 1000, max: 2e9, log: true, value: amount, show: (x) => Math.round(x).toLocaleString("en-US") }, (x) => { amount = Math.round(x); draw(); }).el,
      slider({ id: "pp12r", label: "rate (bytes/sec)", min: 10, max: 1e6, log: true, value: rate, show: (x) => Math.round(x).toLocaleString("en-US") }, (x) => { rate = Math.round(x); draw(); }).el, out); draw();
  }

  /* ---------- Figure 12.7: memory map ---------- */
  function memMap() {
    const rows = [["System space", 22, ""], ["Program text", 40, "PC"], ["Global data section", 34, "R4"], ["Heap ↓ (grows toward xFFFF)", 50, ""], ["", 30, ""], ["Run-time stack ↑ (grows toward x0000)", 50, "R6, R5"], ["System space", 22, ""]];
    let y = 20, s = S.t(60, 14, "x0000", { a: "end", cls: "lab" });
    rows.forEach(([lab, h, reg]) => {
      s += `<rect x="70" y="${y}" width="230" height="${h}" style="fill:${lab ? "var(--card)" : "none"};stroke:var(--ink);stroke-width:1${lab ? "" : ";stroke-dasharray:4 3"}"/>` + (lab ? S.t(185, y + h / 2 + 5, lab, { cls: "lab" }) : "");
      if (reg) s += S.arrow(370, y + 12, 305, y + 12, "") + S.t(376, y + 16, reg, { a: "start" });
      y += h;
    });
    s += S.t(60, y, "xFFFF", { a: "end", cls: "lab" });
    return S.svg(460, y + 10, s, { max: 460, label: "LC-3 memory map while a C program runs" });
  }

  /* ---------- Figures 12.8–12.10 ---------- */
  const FIG128 = `#include <stdio.h>

int inGlobal; // inGlobal is a global variable.
              // It is declared outside of all blocks

int main(void)
{
   int inLocal = 5; // inLocal, outLocalA, outLocalB are all
   int outLocalA;   // local to main
   int outLocalB;

   // Initialize
   inGlobal = 3;

   // Perform calculations
   outLocalA = inLocal & ~inGlobal;
   outLocalB = (inLocal + inGlobal) - (inLocal - inGlobal);

   // Print results
   printf("outLocalA = %d, outLocalB = %d\\n", outLocalA, outLocalB);
}`;
  const M = (g, a, b, c) => [["R4 + 0", g, "inGlobal", "global data"], ["R5 + 0", a, "inLocal", "main's stack frame"], ["R5 − 1", b, "outLocalA", "main's stack frame"], ["R5 − 2", c, "outLocalB", "main's stack frame"]];
  const frameTrace = (host) => trace(host, { code: FIG128, stateTitle: "Memory", frames: [
    { l: 3, m: M(0, "?", "?", "?"), note: "Globals start at 0. Locals hold garbage until assigned." },
    { l: 8, m: M(0, 5, "?", "?"), note: `${lc3("AND R0, R0, #0\nADD R0, R0, #5 ; inLocal is at offset 0\nSTR R0, R5, #0 ; inLocal = 5;")}` },
    { l: 13, m: M(3, 5, "?", "?"), note: `Same pattern, but through R4, the global data pointer:${lc3("AND R0, R0, #0\nADD R0, R0, #3\nSTR R0, R4, #0 ; inGlobal = 3;")}` },
    { l: 16, m: M(3, 5, 4, "?"), note: `5 & ~3 = 0101 & 1100 = 0100 = 4.${lc3("LDR R0, R5, #0  ; inLocal\nLDR R1, R4, #0  ; inGlobal\nNOT R1, R1      ; ~inGlobal\nAND R2, R0, R1\nSTR R2, R5, #-1 ; outLocalA")}` },
    { l: 17, m: M(3, 5, 4, 6), note: "(5 + 3) − (5 − 3) = 8 − 2 = 6. The LC-3 has no subtract, so the compiler negates with NOT and ADD #1 (twice: once for −inGlobal, once for −(inLocal − inGlobal)) and adds." },
    { l: 20, m: M(3, 5, 4, 6), out: "outLocalA = 4, outLocalB = 6\n", note: "Then the code to call printf (Chapter 14)." },
  ] });

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Variables and the four basic types", mins: 20,
    blurb: "A variable is a named value. Its declaration tells the compiler its name, its type and where it is visible. C has four basic types.",
    takeaway: "Variables hold the values a program acts on; operators manipulate them (score = score + 3: 7 → 10). A value is any data item operated on; high-level languages let you refer to it by a symbolic name, and the compiler generates the data movement to wherever it lives. Variables are the simplest memory objects (a named unit of data in memory with characteristics and behaviours). The declaration gives the compiler the identifier, the type, and (by its position) the scope: int echo; reserves storage for an integer (or maybe a register, after optimization). Type sets how much storage and how operations are done (integer add = one LC-3 ADD; floating-point add = a sequence of instructions); the same bits 0110 0110 are f as ASCII or 102 as an integer. Four basic types: int (2's complement in the ISA's word length: LC-3 16 bits, −32,768…+32,767; x86 typically 32 bits, ±2,147,483,647), char (an ASCII character; char key = 'Q'; with an initializer; single quotes; in this book one 16-bit LC-3 location), float/double (single/double precision floating point; literals need a decimal point or exponent: 2.1, 2.1E2 = 210.0, 2E2 = 200.0, 2E-1 = 0.2, −2E-1; double has at least as many fraction bits; usually 64 and 32 bits, IEEE 754), _Bool/bool (0 or 1; bool, true and false need stdbool.h).",
    steps: [
      { k: "learn", title: "Named values", b: [
        `<pre class="code">score = score + 3;</pre>`,
        `<p>In assembly you had to remember which register or address held the score. In C you just say <b>score</b>; the compiler picks the storage and writes the loads and stores. A symbolically named value is a <b>variable</b>.</p>`,
        `<p>Before use, every variable is <b>declared</b>, which tells the compiler three things: its <b>name</b>, its <b>type</b>, and (from where the declaration sits) its <b>scope</b>.</p>`,
        `<pre class="code">int echo;   <span class="cm">// reserve room for one integer called echo</span></pre>`,
      ]},
      { k: "learn", title: "Type gives the bits a meaning", b: [
        `<p>You've seen this since Chapter 2: 0110 0110 is the letter <b>f</b> as ASCII and the number <b>102</b> as an integer. The type tells the compiler which, and so (1) how much storage to reserve and (2) which instructions to use. Adding two ints is one LC-3 ADD; adding two floats is a whole routine, since the LC-3 has no floating-point instructions.</p>`,
        seenPP("Data types: 2's complement, ASCII, floating point.", "02-bits-data-types.html", "Chapter 2"),
      ]},
      { k: "learn", title: "The four basic types", b: [
        `<div class="tbl"><table><thead><tr><th>Type</th><th>Holds</th><th>Example</th></tr></thead><tbody>
          <tr><td><code>int</code></td><td>2's complement integer, the ISA's word size (LC-3: 16 bits, −32,768 to 32,767; x86: usually 32 bits)</td><td><code>int numberOfSeconds;</code></td></tr>
          <tr><td><code>char</code></td><td>an ASCII character in single quotes (one LC-3 location in this book)</td><td><code>char key = 'Q';</code></td></tr>
          <tr><td><code>float</code>, <code>double</code></td><td>single / double precision floating point (usually 32 / 64 bits)</td><td><code>double twoHundredTen = 2.1E2;</code></td></tr>
          <tr><td><code>_Bool</code>, <code>bool</code></td><td>0 (false) or 1 (true); <code>bool</code> needs <code>stdbool.h</code></td><td><code>bool test = false;</code></td></tr></tbody></table></div>`,
        `<p>Any declaration can carry an <b>initializer</b> (<code>= 'Q'</code>). A floating-point literal needs a decimal point or an exponent: <code>2E-1</code> means 2 × 10<sup>−1</sup>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "You need to store the number of students in a lecture. Best type?", opts: [["int", true, "A count is a whole number."], ["double", false, "There is no fractional student."], ["char", false, "That's for a character."]] },
        { t: "mcq", q: "On the LC-3, why does <code>a + b</code> compile to one instruction when a and b are ints, but many when they're doubles?", opts: [["The LC-3 has an integer ADD but no floating-point instructions", true, "The type decides what code the compiler must generate."], ["Doubles are stored in registers", false, "Storage isn't the issue."], ["C forbids adding doubles", false, "It allows it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What three things does a variable's declaration tell the compiler?", model: "Its identifier (the name I'll use), its type (which decides how much storage it needs and which instructions operate on it), and its scope (where in the program it can be used), which the compiler works out from where the declaration appears." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Choosing identifiers", mins: 10,
    blurb: "What C allows in a name, and the conventions programmers follow.",
    takeaway: "Identifiers: letters, digits and underscore _, starting with a letter or underscore; case-sensitive (Capital ≠ capital); no length limit in ANSI C; not a keyword (int, …). Conventions: leading underscore (_index_) only in special library code; all uppercase only for #define symbolic values; multi-word names as wordsPerSecond (this book) or <code>words_per_second</code>. Choose meaningful names: metersPerSecond, not x.",
    steps: [
      { k: "learn", title: "The rules", b: [
        `<ul><li>Letters, digits and the underscore <code>_</code>.</li><li>Must <b>start</b> with a letter or underscore.</li><li>Case matters: <code>Capital</code> and <code>capital</code> are different names.</li><li>Can't be a keyword like <code>int</code>.</li></ul>`,
        `<p>Conventions on top of the rules: ALL CAPS only for #define names; leading underscores are for library code; join words as <code>wordsPerSecond</code> (this book) or with underscores. And make names <b>mean</b> something: <code>metersPerSecond</code>, not <code>x</code>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Legal C identifier or not?", bins: ["Legal", "Not legal"], items: [
          ["totalCost", 0, "Letters only."],
          ["2ndPlace", 1, "Can't start with a digit."],
          ["char", 1, "A keyword."],
          ["miles2go", 0, "Digits are fine after the first character."],
          ["unit-price", 1, "A hyphen isn't allowed: C would read it as unit minus price."],
        ]},
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Scope: local and global", mins: 20,
    blurb: "Where a variable is alive: inside its block, or everywhere. Step through the book's nested-scope example, then see why initial values matter.",
    takeaway: "A declaration conveys identifier and type explicitly; the compiler infers scope from its position. Scope = region where the variable is alive and accessible; C has two kinds: local to a block ({ … }) from the declaration to the end of the block, or global to the whole program (declared outside all blocks; keeps its storage and value for the program's whole run; strictly, globals can be limited to one file). Variables must be declared before use; ANSI C allows declarations anywhere before use in the block, but the book declares at the start of blocks. Variables with the same name may be declared in separate blocks (Figure 12.1: globalVar = 2; main's localVar = 3; a sub-block's localVar = 4; output 2,3 / 2,4 / 2,3). Globals are tempting but invite bugs (modified from anywhere), hurt maintenance and extension; production rules restrict them; the book avoids them. Initialization: local variables without an initializer hold garbage (undefined); globals are initialized to 0. Standard practice: initialize locals in their declarations.",
    steps: [
      { k: "learn", title: "Blocks", b: [
        `<p>A <b>block</b> is anything between <code>{</code> and <code>}</code>. A variable declared inside a block is <b>local</b>: it exists from its declaration to the closing brace, and nothing outside can see it. A variable declared outside every block is <b>global</b>: visible everywhere, alive for the whole run.</p>`,
      ]},
      { k: "play", title: "Figure 12.1, step by step", b: [
        `<p>Two different variables are both called <code>localVar</code>. Before stepping, predict the three lines of output.</p>`,
        scopeTrace,
      ]},
      { k: "learn", title: "Why the book avoids globals", b: [
        `<p>Globals are tempting: any function can reach them. That's exactly the problem. Anything can change them, so bugs are hard to trace and code is hard to change safely. Production coding rules usually restrict them.</p>`,
      ]},
      { k: "learn", title: "Initial values", b: [
        `<div class="two"><div class="tile"><h3>Local</h3><p>No initializer → <b>garbage</b>: whatever bits were left in that memory.</p></div><div class="tile"><h3>Global</h3><p>No initializer → <b>0</b>.</p></div></div>`,
        `<p>So the habit: give every local an initial value right in its declaration.</p>`,
      ]},
      { k: "check", title: "Spot the mistake", b: [
        { t: "mcq", q: "<code>int main(void) { int total; … total = total + price; …</code> The program prints a different, wrong total on different runs. Why?", opts: [["total is local and never initialized, so it starts with garbage", true, "Write int total = 0;"], ["price must be global", false, "Scope isn't the problem."], ["+ doesn't work on ints", false, "It does."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What decides whether a C variable is local or global, and how long does each live?", model: "Its position: declared inside a pair of braces, it is local to that block, existing from its declaration until the closing brace and invisible outside it. Declared outside every block, it is global, visible throughout the program and keeping its storage and value for the whole run." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Assignment, arithmetic and precedence", mins: 25,
    blurb: "Expressions and statements, what = really does, mixed types, integer division and %, and the rules that decide what gets evaluated first.",
    takeaway: "The LC-3 has only ADD, AND, NOT, so z = x * y; becomes a loop of additions handling negative y (Figure 12.2; x at R5, y at R5 − 1, z at R5 − 2). Expression = variables and literals combined with operators (x * y); statement = a complete unit of work ending in ; (z = x * y;); executed in order from main's first statement; a compound statement (block) groups declarations and statements in { } and counts as one statement. Assignment =: evaluate the right side, then store into the object on the left (not mathematical equality); x = x + 4; → LDR, ADD #4, STR. Every expression has a type; mixed int and float → floating point; char with int → int; shorter types convert to longer. Assigning to a different type converts to the variable's (immutable) type: float → int drops the fraction (4.3 → 4, 5.9 → 5). Arithmetic: * / % + −; integer division drops the fraction (11 / 4 = 2); % gives the remainder (11 % 4 = 3; (11/4)*4 + 11%4 = 11); 7 / 2 = 3, 7 % 2 = 1. Precedence: * / % above + −, so 2 + 3 * 4 = 14. Associativity for equal precedence: + and − left to right: 2 + 3 − 4 + 5 = 6. Full table: Table 12.5 (don't memorize it). Parentheses override, innermost first, and help readability. (Book slip: it says x = a * b + c * d / 2 can be written as x = (a * b) + ((c * d) / 4), both 20 with all variables 4; the first actually gives 24, so the divisor should be 4 in both.)",
    steps: [
      { k: "learn", title: "What the compiler is up against", b: [
        `<p>The LC-3 can only ADD, AND and NOT. So <code>z = x * y;</code> has to become a loop of additions, with extra steps when y is negative (Figure 12.2):</p>`,
        lc3(`      AND R0, R0, #0   ; R0 <= 0
      LDR R1, R5, #0   ; load value of x
      LDR R2, R5, #-1  ; load value of y
      BRz DONE         ; if y is zero, we're done
      BRp LOOP         ; if y is positive, start mult
      NOT R1, R1       ; y is negative
      ADD R1, R1, #1   ; R1 <= -x
      NOT R2, R2
      ADD R2, R2, #1   ; R2 <= -y (-y is positive)
LOOP  ADD R0, R0, R1   ; Multiply loop
      ADD R2, R2, #-1
      BRp LOOP
DONE  STR R0, R5, #-2  ; z = x * y;`),
        seenPP("Multiplying by repeated addition in the calculator.", "10-calculator.html", "Chapter 10"),
      ]},
      { k: "learn", title: "Expressions, statements, blocks", b: [
        `<ul><li><b>Expression</b>: values and operators combined, like <code>x * y</code>. Every expression has a value and a type.</li><li><b>Statement</b>: a complete unit of work ending in <code>;</code>, like <code>z = x * y;</code>.</li><li><b>Block</b> (compound statement): <code>{ … }</code> around several of them, which counts as one statement.</li></ul>`,
      ]},
      { k: "learn", title: "= means “make it so”", b: [
        `<p>In maths, = asserts two things are equal. In C, = is an <b>action</b>: evaluate the right side, then store the result into the left side. That's why <code>x = x + 4;</code> makes sense:</p>`,
        lc3(`LDR R0, R5, #0 ; Get the value of x
ADD R0, R0, #4 ; calculate x + 4
STR R0, R5, #0 ; x = x + 4;`),
        `<p>Mixed types are converted to the longer type: <code>x + 4.3</code> is computed in floating point. But a variable's type never changes, so storing it back into an int x <b>drops the fraction</b>: 5.9 becomes 5.</p>`,
      ]},
      { k: "learn", title: "Integer division and %", b: [
        `<p><code>/</code> on two ints drops the fraction: <code>11 / 4</code> is 2. <code>%</code> gives the remainder: <code>11 % 4</code> is 3. Together, (11/4)·4 + 11%4 = 11.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "<code>int m = 47 / 10;</code> What is m?", a: 4, tol: 0, why: "Integer division drops the .7." },
        { t: "num", q: "<code>int r = 47 % 10;</code> What is r?", a: 7, tol: 0, why: "47 = 4 × 10 + 7." },
        { t: "num", q: "<code>int n = 3.99;</code> What is n?", a: 3, tol: 0, why: "Converting to int drops the fractional part; it doesn't round to nearest." },
      ]},
      { k: "play", title: "Which operator goes first?", b: [
        `<p><b>Precedence</b> decides between different operators (* / % before + −). <b>Associativity</b> decides between equal ones (+ and − go left to right). Parentheses override both, innermost first.</p>`,
        evalOrder,
        `<p class="aside">Book slip: the text says <code>x = a * b + c * d / 2</code> “could be written equivalently as” <code>x = (a * b) + ((c * d) / 4)</code>, both giving 20. With all four variables equal to 4, the /2 version gives 24; only the /4 version gives 20.</p>`,
        `<p>The full table (Table 12.5) has 17 levels. Don't memorize it; look it up, and use parentheses so readers don't have to.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "<code>x = 20 - 6 - 4;</code> x = ?", a: 10, tol: 0, why: "Left to right: (20 − 6) − 4 = 10, not 20 − (6 − 4) = 18." },
        { t: "num", q: "<code>x = 1 + 12 / 4 * 2;</code> x = ?", a: 7, tol: 0, why: "/ and * share a level, left to right: 12 / 4 = 3, 3 × 2 = 6; then 1 + 6 = 7." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How is the C statement x = x + 1; different from the equation x = x + 1 in maths?", model: "In maths it's a claim that x equals x + 1, which is never true. In C, = is assignment: the computer evaluates the right-hand side using x's current value, then stores the result back into x, so x ends up one larger." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Bitwise operators", mins: 20,
    blurb: "AND, OR, XOR, NOT and shifts, applied to every bit of a value at once, just like the LC-3's AND and NOT.",
    takeaway: "Bitwise operators work across the individual bits: & AND (like the LC-3 AND), | OR, ^ XOR, ~ NOT (unary). 0x prefix = hex. 16-bit examples: 0x1234 | 0x5678 = 0x567C; & = 0x1230; ^ = 0x444C; ~0x1234 = 0xEDCB; 1234 & 5678 = 1026. Shifts << and >> take the value and the shift count; left shift fills with zeros, right shift sign-extends; operands aren't modified. 0x1234 << 3 = 0x91A0; 0x1234 >> 2 = 0x048D; 1234 << 3 = 9872; 1234 >> 2 = 308; 0x1234 << 5 = 0x4680 (16-bit result); 0xFEDC >> 3 = 0xFFDB. Operands must be integral. With f = 7, g = 8: f & g = 0, f | g = 15, f << 1 = 14, g << f = 1024, ~f | ~g = −1 (signed). Precedence: ~ highest, then << and >> (equal), then &, then ^, then |; all left to right.",
    steps: [
      { k: "learn", title: "Operators on bits", b: [
        `<div class="tbl"><table><thead><tr><th>Operator</th><th>Does</th></tr></thead><tbody><tr><td><code>&amp;</code></td><td>AND each pair of bits (the LC-3 AND)</td></tr><tr><td><code>|</code></td><td>OR</td></tr><tr><td><code>^</code></td><td>XOR</td></tr><tr><td><code>~</code></td><td>NOT, one operand (the LC-3 NOT)</td></tr><tr><td><code>&lt;&lt;</code> / <code>&gt;&gt;</code></td><td>shift left / right by a count</td></tr></tbody></table></div>`,
        `<p>In C, <code>0x</code> in front of a number means hexadecimal.</p>`,
      ]},
      { k: "play", title: "The book's examples", b: [
        `<p>A = 0x1234, B = 0x5678. For each operator, predict the hex result digit by digit before you click.</p>`,
        bitwise,
        `<p>Shifting left by n multiplies by 2<sup>n</sup> (until bits fall off the top: 0x1234 &lt;&lt; 5 is 0x4680 in 16 bits). Shifting right <b>sign-extends</b>, so 0xFEDC &gt;&gt; 3 is 0xFFDB, still negative.</p>`,
        seenPP("Logical operations on bit vectors.", "02-bits-data-types.html", "Chapter 2"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "<code>0x00FF ^ 0x0F0F</code> = ?", opts: [["0x0FF0", true, "XOR is 1 where they differ."], ["0x000F", false, "That's AND."], ["0x0FFF", false, "That's OR."]] },
        { t: "num", q: "<code>40 >> 3</code> = ? (decimal)", a: 5, tol: 0, why: "Shifting right 3 divides by 8: 40 / 8 = 5." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean that & is a bitwise operator?", model: "It doesn't treat its operands as whole numbers to compare. It lines up their bits and ANDs each position separately, so the result has a 1 only in positions where both operands have a 1. It's the same operation as the LC-3 AND instruction." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Relational and logical operators", mins: 20,
    blurb: "Comparisons that produce 1 or 0, and &&, ||, ! for combining them, which look like the bitwise operators but behave very differently.",
    takeaway: "Relational operators test a relationship and evaluate to 1 (true) or 0 (false): == equal (q = (312 == 83); → 0), != not equal, >, >=, <, <=. With f = 7, g = 8: f == g → 0, f > g → 0, f != g → 1, f <= g → 1. Used for conditions (if (tankLevel == 0) printf(...); Chapter 13). Precedence: >, >=, <, <= above == and !=; left to right. Logical operators produce only 1 or 0 (consistent with bool): && is 1 if both operands are nonzero (3 && 4 → 1, 3 && 0 → 0), || is 1 if either is nonzero (3 || 4 → 1, 3 || 0 → 1), ! gives 1 only if its operand is 0. Range test: (10 <= x) && (x <= 20); letter test: (('a' <= c) && (c <= 'z')) || (('A' <= c) && (c <= 'Z')). f = 7, g = 8: f & g = 0 but f && g = 1; f | g = 15, f || g = 1; ~f | ~g = −1, !f && !g = 0; 29 || −52 = 1. Precedence: ! highest, then &&, then ||. Intro programmers often confuse & with && and | with ||.",
    steps: [
      { k: "learn", title: "Comparisons give 1 or 0", b: [
        `<p><code>==</code> (equal), <code>!=</code>, <code>&gt;</code>, <code>&gt;=</code>, <code>&lt;</code>, <code>&lt;=</code>. Each evaluates to <b>1</b> if the relationship holds and <b>0</b> if not, a plain integer you can store:</p>`,
        `<pre class="code" style="font-variant-ligatures:none">q = (312 == 83);   <span class="cm">// q is 0</span>
z = (x == y);      <span class="cm">// z is 1 if x equals y</span></pre>`,
        `<p>Note <b>==</b> tests, <b>=</b> assigns. Mixing them up is a classic bug.</p>`,
      ]},
      { k: "learn", title: "Combining conditions", b: [
        `<p><code>&&</code> (AND), <code>||</code> (OR), <code>!</code> (NOT) treat any nonzero value as true and answer 1 or 0:</p>`,
        `<pre class="code" style="font-variant-ligatures:none">(10 <= x) && (x <= 20)   <span class="cm">// 1 if x is between 10 and 20</span></pre>`,
      ]},
      { k: "play", title: "& is not &&", b: [
        `<p>The book's f = 7 and g = 8. Predict each pair before clicking.</p>`,
        bitVsLogic,
      ]},
      { k: "check", title: "Spot the mistake", b: [
        { t: "mcq", q: "“I want to run some code only if both a and b are nonzero, so I test <code>if (a & b)</code>.” With a = 1 and b = 2 it doesn't run. Why?", opts: [["& is bitwise: 01 & 10 = 00. The test needs &&", true, "a && b is 1 because both are nonzero."], ["1 and 2 aren't both true in C", false, "Any nonzero value counts as true."], ["if can't take an expression", false, "It can."]] },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "x = 25. Value of <code>(10 <= x) && (x <= 20)</code>?", a: 0, tol: 0, why: "x <= 20 is 0, so the && is 0." },
        { t: "num", q: "Value of <code>!(5 > 2) || (3 != 3)</code>?", a: 0, tol: 0, why: "!(1) = 0, (3 != 3) = 0; 0 || 0 = 0." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain the difference between f | g and f || g.", model: "f | g ORs the two values bit by bit and can produce any integer, for example 7 | 8 = 15. f || g asks whether either value is nonzero (true) and always produces 1 or 0, so 7 || 8 is 1." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "++, --, compound assignment, and ?:", mins: 15,
    blurb: "C's shortcuts: increment and decrement (pre and post), operate-and-assign, and the conditional expression.",
    takeaway: "++ increments a variable, -- decrements it (x++ is like x = x + 1; it modifies the variable; C++ is named after it). Post-increment x++ evaluates to the old value, then increments: x = 4; y = x++; → x = 5, y = 4. Pre-increment ++x increments first: x = 4; y = ++x; → both 5. Style: avoid code where pre vs post matters; use one form consistently. Expressions with many operators follow Table 12.5: y = x & z + 3 || 9 − w % 6 means y = (x & (z + 3)) || (9 − (w % 6)); (18 <= age) && (age <= 25) needs no parentheses but reads better with them. Compound assignment: x += 29 means x = x + 29; also h %= f, h <<= 3, -=, *=, /=, &=, |=, ^= (Table 12.6). Conditional expression: x = a ? b : c gives b if a is nonzero, else c; maxValue = (valueA > valueB) ? valueA : valueB. (The book's listing has a typo, valuaA.)",
    steps: [
      { k: "learn", title: "++ and --", b: [
        `<p><code>x++</code> adds 1 to x; <code>x--</code> subtracts 1. They change the variable itself. (The language C++ is named after this.)</p>`,
        `<p>They can go before or after the variable, and the difference is <i>when</i> the value is taken. Predict y in each case:</p>`,
        `<div class="two"><div class="tile"><pre class="code">x = 4;
y = x++;</pre></div><div class="tile"><pre class="code">x = 4;
y = ++x;</pre></div></div>`,
        { t: "reveal", label: "Show me", html: `<p>Left: <b>y = 4, x = 5</b>. The post-increment hands over the old value, then bumps x. Right: <b>y = 5, x = 5</b>. The pre-increment bumps x first. Because this is easy to misread, good style avoids code where the difference matters.</p>` },
      ]},
      { k: "learn", title: "Operate-and-assign", b: [
        `<pre class="code">x += 29;    <span class="cm">// x = x + 29;</span>
h %= f;     <span class="cm">// h = h % f;</span>
h <<= 3;    <span class="cm">// h = h << 3;</span></pre>`,
        `<p>Any arithmetic or bitwise operator works: -=, *=, /=, &=, |=, ^=.</p>`,
      ]},
      { k: "learn", title: "A decision inside an expression", b: [
        `<pre class="code" style="font-variant-ligatures:none">maxValue = (valueA > valueB) ? valueA : valueB;</pre>`,
        `<p><code>a ? b : c</code> is b if a is nonzero, otherwise c. (The book's listing misspells the first <code>valueA</code> as <code>valuaA</code>.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "<code>x = 20; x -= 5; x *= 2;</code> x = ?", a: 30, tol: 0, why: "20 − 5 = 15; 15 × 2 = 30." },
        { t: "num", q: "a = 3, b = 8. <code>m = (a > b) ? a : b;</code> m = ?", a: 8, tol: 0, why: "a > b is false, so m gets b." },
      ]},
      { k: "learn", title: "Lots of operators at once", b: [
        `<p>Table 12.5 sorts out even this:</p>`,
        `<pre class="code">y = x & z + 3 || 9 - w % 6;
y = (x & (z + 3)) || (9 - (w % 6));   <span class="cm">// what it means</span></pre>`,
        `<p>Legal, but nobody can read the first line. Write the second.</p>`,
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Problem solving: network transfer time", mins: 20,
    blurb: "Choose the data types, refine the problem top-down, and turn seconds into hours, minutes and seconds with / and %.",
    takeaway: "Problem: time to transfer some bytes at a rate in bytes/second, shown as hours, minutes, seconds. Top-down decomposition (Chapter 6): start from a high-level description and refine with sequential, decision and iteration constructs until it maps to C. Data type first: integers, since 10 hours 18 minutes 51 seconds is the wanted output (ignore rounding). Step 1: get input, calculate, output. Step 2: calculate total seconds, then convert. Step 3: hours from total seconds, minutes from the remaining seconds, then remaining seconds. Figure 12.4: time = amount / rate; hours = time / 3600; minutes = (time % 3600) / 60; seconds = ((time % 3600) % 60); printf(\"Time : %dh %dm %ds\\n\", hours, minutes, seconds).",
    steps: [
      { k: "learn", title: "Pick the types, then refine", b: [
        `<p>Task: given the number of bytes and the network rate (bytes per second), print the transfer time as hours, minutes and seconds. “10 h 18 m 51 s” is the goal, not “10.1 hours”, so the times are <b>ints</b>.</p>`,
        `<ol><li><b>Step 1:</b> get input → calculate → output.</li><li><b>Step 2:</b> calculate = total seconds, then convert to h/m/s.</li><li><b>Step 3:</b> convert = hours from the total; minutes from what's left; seconds from what's left after that.</li></ol>`,
        seenPP("Top-down decomposition with sequential, decision and iteration constructs.", "06-programming.html", "Chapter 6"),
      ]},
      { k: "play", title: "Run Figure 12.4", b: [
        code(`time = amount / rate;
hours = time / 3600;            // 3600 seconds in an hour
minutes = (time % 3600) / 60;   // 60 seconds in a minute
seconds = ((time % 3600) % 60); // remainder is seconds`, { nums: false }),
        `<p>% peels off what's left over; / counts the whole units.</p>`,
        transfer,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "time = 7384 s. minutes = (time % 3600) / 60 = ?", a: 3, tol: 0, why: "7384 % 3600 = 184; 184 / 60 = 3 (and 4 seconds left)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do integer / and % together split a number of seconds into hours and leftover seconds?", model: "Dividing by 3600 with integer division counts how many whole hours fit, dropping the fraction. Taking the remainder with % 3600 gives the seconds left over after those whole hours, which can then be split the same way into minutes and seconds." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "How variables live in memory", mins: 25,
    blurb: "The compiler's symbol table, the global data section and the run-time stack, frame pointers, and the book's complete example traced into LC-3 code.",
    takeaway: "The compiler allocates memory for objects and generates LC-3 code, systematically, using a symbol table and a memory map. Symbol table entry per declaration: identifier, type, location (as an offset), scope (line range), other info (Figure 12.5 for Figure 12.4: amount 0, rate −1, time −2, hours −3, minutes −4, seconds −5, all int, scope main). Two regions: global data section (globals; offset from its base, pointed to by R4: earth at offset 4 with base x5000 is at x5004, LDR R3, R4, #4) and the run-time stack (locals, in activation records or stack frames, one per executing function: contiguous locations holding its locals). R5 = frame pointer = highest address of the current frame; locals are allocated in reverse declaration order, the first closest to R5: seconds is LDR R0, R5, #-5. Calling a function pushes its frame and moves R5; returning pops it; R6 = stack pointer (top of stack) (Chapter 14). Memory map (Figure 12.7): system space, program text (PC), global data (R4), heap (dynamic data, Chapter 19, grows toward xFFFF), run-time stack (grows toward x0000, R6 top, R5 frame), system space (TRAP routines, vector tables, I/O registers, boot code). Figure 12.8: inGlobal at global offset 0; inLocal 0, outLocalA −1, outLocalB −2; output outLocalA = 4, outLocalB = 6; Figure 12.10 LC-3 code. Real compilers optimize frequently used variables into registers.",
    steps: [
      { k: "learn", title: "The symbol table", b: [
        `<p>Like the LC-3 assembler, the compiler keeps a <b>symbol table</b>. Each declaration adds an entry: name, type, <b>location (as an offset)</b>, and scope. For Figure 12.4:</p>`,
        `<div class="tbl"><table style="font-family:var(--mono)"><thead><tr><th>Identifier</th><th>Type</th><th>Offset</th><th>Scope</th></tr></thead><tbody><tr><td>amount</td><td>int</td><td>0</td><td>main</td></tr><tr><td>rate</td><td>int</td><td>−1</td><td>main</td></tr><tr><td>time</td><td>int</td><td>−2</td><td>main</td></tr><tr><td>hours</td><td>int</td><td>−3</td><td>main</td></tr><tr><td>minutes</td><td>int</td><td>−4</td><td>main</td></tr><tr><td>seconds</td><td>int</td><td>−5</td><td>main</td></tr></tbody></table></div>`,
        seenPP("The assembler's symbol table.", "07-assembly.html", "Chapter 7"),
      ]},
      { k: "learn", title: "Offsets from what?", b: [
        `<div class="two"><div class="tile"><h3>Globals</h3><p>Live in the <b>global data section</b>. <b>R4</b> points to its start; the offset counts up from there. A global at offset 4 is loaded with <code>LDR R3, R4, #4</code>.</p></div><div class="tile"><h3>Locals</h3><p>Live in the function's <b>stack frame</b> (activation record) on the <b>run-time stack</b>. <b>R5</b>, the frame pointer, holds the frame's highest address; locals sit at R5, R5 − 1, R5 − 2, … in declaration order. seconds: <code>LDR R0, R5, #-5</code>.</p></div></div>`,
        `<p>Why negative? Because the stack grows toward x0000, so each new local sits one address lower.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Using the symbol table above, which variable does <code>LDR R1, R5, #-3</code> load?", opts: [["hours", true, "Offset −3."], ["time", false, "That's −2."], ["minutes", false, "That's −4."]] },
      ]},
      { k: "learn", title: "The whole memory map", b: [
        fig(memMap()),
        `<p>When a function is called, its frame is pushed on the stack and R5 moves to it; when it returns, the frame is popped. <b>R6</b>, the stack pointer, always marks the top (all of Chapter 14). The <b>heap</b> holds data created while the program runs (Chapter 19).</p>`,
        seenPP("Stacks and the system space in the LC-3.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "play", title: "Figure 12.8 down to the LC-3", b: [
        `<p>One global, three locals. Step through and watch each assignment land in memory, with the LC-3 code the compiler generates (Figure 12.10).</p>`,
        frameTrace,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the compiler turn a reference to a local variable into an LC-3 instruction?", model: "It looks the variable up in its symbol table to get its offset in the function's stack frame. R5, the frame pointer, holds the base of the current frame, so the compiler emits a load or store relative to R5 with that offset, for example LDR R0, R5, #-5 for the variable at offset −5." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Type variations and constants", mins: 15,
    blurb: "long, short and unsigned; and three kinds of constant: literals, const variables, and #define symbols.",
    takeaway: "Modifiers: long int (intended twice the bits of int), long double (more range and precision if supported), short int (smaller, saves memory); support depends on the ISA (a long int may equal an int). unsigned int: all bits for nonnegative values (LC-3: 0…65,535): unsigned int numberOfDays. Constants (Figure 12.11, circle area and circumference with RADIUS 15.0): literal constants are unnamed values in the code (2, 3.14159, hex 0x1DB, ASCII 'R', exponential notation); const-qualified variables are read-only (const double pi = 3.14159;); symbolic values come from #define (RADIUS). Style: const for values that never change (pi, speed of light, days in a week); #define for parameters that stay fixed in one run but could change between builds (RADIUS, then recompile). Naming a constant beats leaving a bare literal.",
    steps: [
      { k: "learn", title: "Bigger, smaller, unsigned", b: [
        `<ul><li><code>long int</code>, <code>long double</code>: more bits, if the ISA supports them (otherwise same as plain).</li><li><code>short int</code>: fewer bits, to save memory.</li><li><code>unsigned int</code>: no negatives, all bits for magnitude. On the 16-bit LC-3: 0 to 65,535.</li></ul>`,
      ]},
      { k: "learn", title: "Three kinds of constant", b: [
        code(`#define RADIUS 15.0            // This value is in centimeters

int main(void)
{
   const double pi = 3.14159;
   double area;
   double circumference;

   area = pi * RADIUS * RADIUS;      // area = pi*r^2
   circumference = 2 * pi * RADIUS;  // circumference = 2*pi*r`),
        `<div class="two"><div class="tile"><h3>Literal</h3><p>An unnamed value written in the code: <code>2</code>, <code>0x1DB</code>, <code>'R'</code>.</p></div><div class="tile"><h3>const variable</h3><p>A read-only variable: <code>pi</code>. For values that never change.</p></div><div class="tile"><h3>#define symbol</h3><p>Text substitution: <code>RADIUS</code>. For settings you might change and recompile.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "const or #define, by the book's style rule?", bins: ["const", "#define"], items: [
          ["The number of days in a week", 0, "Never changes."],
          ["The maximum number of players this build of the game supports", 1, "A parameter you might change and recompile."],
          ["The speed of light", 0, "A physical constant."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why name a constant instead of writing the number directly in the code?", model: "A name like pi or RADIUS tells the reader what the number means, and it's defined in one place, so changing it means editing one line instead of hunting for every copy of the literal." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp12", eyebrow: "Patt & Patel · Chapter 12", title: "Variables and Operators",
    intro: `<p>Ten parts: variables and their types, names, scope, then C's operators (arithmetic, bitwise, relational, logical and the shortcuts), a worked problem, and how the compiler lays variables out in memory, down to the LC-3 code.</p><p>You'll step through the book's scope and memory examples and watch expressions reduce one operator at a time. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For expression questions, rewrite each expression with full parentheses first (Table 12.5), then evaluate; for bitwise ones, write the values in binary.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Variables</h3>
      <p>Declaration = identifier + type + scope. <code>int</code> (ISA word, LC-3 16-bit), <code>char</code> ('Q'), <code>float</code>/<code>double</code> (2.1E2), <code>bool</code> (stdbool.h). Local to a block (garbage if uninitialized) or global (0). Modifiers long, short, unsigned; const vs #define vs literals.</p>
      <h3>Operators</h3>
      <p>= assigns (right side first; converts to the variable's type, dropping fractions). * / % + − (integer / truncates). Bitwise ~ &lt;&lt; &gt;&gt; &amp; ^ |. Relational &gt; &gt;= &lt; &lt;= == != → 1/0. Logical ! &amp;&amp; || → 1/0. x++ (old value) vs ++x (new). += etc. a ? b : c. Precedence, associativity, parentheses (Table 12.5).</p>
      <h3>In memory</h3>
      <p>Symbol table: name, type, offset, scope. Globals: global data section via R4. Locals: stack frame via R5 (frame pointer), at offsets 0, −1, −2, … R6 = stack pointer. Map: program text, globals, heap ↓, stack ↑.</p>`,
  };
  Course.start(window.CHAPTER);
})();

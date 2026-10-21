(function () {
  const { toggle, readout, el } = Course;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const c = (t, o = {}) => CT.code(t, { nums: false, ...o });
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const esc = CT.esc;
  const bin16 = (v) => ((v & 0xFFFF) >>> 0).toString(2).padStart(16, "0").replace(/(.{4})(?=.)/g, "$1 ");

  /* ---------- widgets ---------- */
  // The book's own literal examples: what value and type each one is
  function literals(host) {
    const L = [
      ["87", "87", "int", "decimal"],
      ["0x57", "87", "int", "hexadecimal: 5×16 + 7"],
      ["0127", "87", "int", "octal, because of the leading 0: 1×64 + 2×8 + 7"],
      ["-024", "−20", "int", "octal 24 = 2×8 + 4 = 20"],
      ["-0x24", "−36", "int", "hex 24 = 2×16 + 4 = 36"],
      ["87U", "87", "unsigned int", "suffix U"],
      ["87L", "87", "long int", "suffix L"],
      ["1.", "1.0", "double", "a floating point literal is a double by default"],
      [".613123f", "0.613123", "float", "suffix f makes it single precision"],
      ["'S'", "83", "char", "the ASCII code of S; also writable as '\\123' (octal) or '\\x53' (hex)"],
    ];
    const out = el(`<div></div>`), row = el(`<div class="row" style="flex-wrap:wrap"></div>`);
    L.forEach((x, i) => { const b = btn(`<code>${esc(x[0])}</code>`); b.addEventListener("click", () => show(i)); row.append(b); });
    const show = (i) => { const [lit, v, t, why] = L[i]; out.innerHTML = readout([["literal", esc(lit)], ["value", v], ["type", t]]) + `<p>${esc(why)}</p>`; };
    host.append(row, out);
    show(2);
  }

  // static vs automatic: call Count() a few times
  function countWidget(host) {
    let isStatic = true, y = 0, calls = 0, log = [];
    const out = el(`<div></div>`);
    const src = () => c(`int Count(int x)
{
  ${isStatic ? "static int y;     // lives in the global data section" : "int y = 0;        // automatic: a fresh y on every call"}
  y++;
  printf("This function has been called %d times.", y);
}`);
    const draw = () => { out.innerHTML = src() + readout([["calls so far", calls], ["y printed by the last call", calls ? y : "—"]]) + `<pre class="code" style="min-height:2.4em">${log.slice(-4).join("\n")}</pre>`; };
    const call = btn("Call Count()", "primary");
    call.addEventListener("click", () => { calls++; y = isStatic ? y + 1 : 1; log.push(`called ${y} times`); draw(); });
    host.append(toggle(["static int y;", "int y = 0;"], (i) => { isStatic = i === 0; y = 0; calls = 0; log = []; draw(); }), call, out);
    draw();
  }

  // struct vs union layout, bytes 0..15
  function layout(host) {
    const out = el(`<div></div>`);
    const col = ["var(--accent)", "var(--muted)", "#5aa9e6"];
    const S = [
      ["struct example_type", 16, [["valueA (int)", 0, 4], ["valueB (int)", 4, 4], ["valueC (double)", 8, 8]], "Members sit one after another: 4 + 4 + 8 = 16 bytes."],
      ["union u_tag", 8, [["fval (double)", 0, 8], ["ival (int)", 0, 4], ["cval (char)", 0, 1]], "Every member starts at byte 0 and shares the same bits. The union is as big as its largest member: 8 bytes. Write fval, then read ival, and you see part of a double's bit pattern."],
    ];
    const draw = (k) => {
      const [, n, mem, note] = S[k];
      let rows = mem.map(([lab, at, w], i) => `<div style="display:grid;grid-template-columns:repeat(16,1fr);gap:2px;margin:3px 0">${Array.from({ length: 16 }, (_, b) => `<div style="height:22px;border-radius:3px;${b >= at && b < at + w ? `background:${col[i]}` : `border:1px dashed var(--line)`}"></div>`).join("")}</div><div class="aside" style="margin:0 0 6px">${lab}: bytes ${at}–${at + w - 1}</div>`).join("");
      out.innerHTML = `<div class="aside" style="display:flex;justify-content:space-between;margin:0"><span>byte 0</span><span>byte 15</span></div>` + rows + readout([["sizeof", n + " bytes"]]) + `<p>${note}</p>`;
    };
    host.append(toggle(S.map((s) => `<code style="background:none;color:inherit;padding:0">${s[0]}</code>`), draw), out);
    draw(0);
    host.append(el(`<p class="aside">Assuming a 4-byte int and an 8-byte double, as on most PCs. On the LC-3 every basic type is one 16-bit location.</p>`));
  }

  // Table D.2 with the book's x = 186, y = 6
  function bitOps(host) {
    const x = 186, y = 6;
    const ops = [
      ["x & y", x & y, "1 only where both have a 1"],
      ["x | y", x | y, "1 where either has a 1"],
      ["x ^ y", x ^ y, "1 where they differ"],
      ["~x", ~x, "every bit flipped; as a 2's complement int that's −187"],
      ["x << y", x << y, "shifted left 6 places: ×64"],
      ["x >> y", x >> y, "shifted right 6 places: ÷64, remainder dropped"],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const [e, v, why] = ops[i];
      out.innerHTML = `<pre class="code" style="font-variant-ligatures:none">x      = ${bin16(x)}   (186)\ny      = ${bin16(y)}   (6)\n${esc(e.padEnd(6))} = ${bin16(v)}   (${v})</pre><p>${why}.</p>`;
    };
    host.append(toggle(ops.map((o) => esc(o[0])), draw), out);
    draw(0);
    host.append(el(`<p class="aside">Showing the low 16 bits. These are the book's values from Table D.2.</p>`));
  }

  // How the compiler groups operators (Table D.4)
  function groups(host) {
    const E = [
      ["a + b * c", "a + (b * c)", "* (group 6) binds tighter than + (group 7)."],
      ["x << 1 + 1", "x << (1 + 1)", "Shifts (group 8) are weaker than +. If you meant (x << 1) + 1, write the parentheses."],
      ["x & 1 == 0", "x & (1 == 0)", "== (group 10) is stronger than & (group 11), so this is x & 0, which is always 0. You almost certainly meant (x & 1) == 0."],
      ["*p++", "*(p++)", "Postfix ++ (group 2) beats * (group 4): fetch *p, then move p, not the value."],
      ["!x == y", "(!x) == y", "Unary ! (group 4) binds tightest of the two."],
      ["a < b == c < d", "(a < b) == (c < d)", "Relational (group 9) before equality (group 10)."],
    ];
    const out = el(`<div></div>`);
    let cur = 0;
    const row = el(`<div class="row" style="flex-wrap:wrap"></div>`);
    E.forEach((x, i) => { const b = btn(`<code>${esc(x[0])}</code>`); b.addEventListener("click", () => { cur = i; out.innerHTML = `<p>Decide how it groups, then reveal.</p>`; out.append(rv); rv.disabled = false; }); row.append(b); });
    const rv = btn("Reveal grouping", "primary");
    rv.addEventListener("click", () => { const [, g, why] = E[cur]; out.innerHTML = readout([["written", esc(E[cur][0])], ["compiler reads", esc(g)]]) + `<p>${why}</p>`; });
    host.append(row, out);
    out.innerHTML = `<p>Pick an expression.</p>`;
  }

  // Macro expansion with and without parentheses
  function macro(host) {
    const A = 47, B = 5, out = el(`<div></div>`);
    const V = [
      ["#define REMAINDER(X, Y) ((X) % (Y))", "((valueA) % (valueB + 15))", A % (B + 15)],
      ["#define REMAINDER(X, Y) X % Y", "valueA % valueB + 15", (A % B) + 15],
    ];
    const draw = (i) => {
      const [def, exp, val] = V[i];
      out.innerHTML = c(`${def}\n\nvalueC = REMAINDER(valueA, valueB + 15);`) + readout([["after preprocessing", esc(`valueC = ${exp};`)], ["with valueA = 47, valueB = 5", `valueC = ${val}`]]) +
        `<p>${i === 0 ? "47 % 20 = 7. Correct." : "The text is pasted in blindly, so % grabs valueB alone: 47 % 5 + 15 = 17. Wrong."}</p>`;
    };
    host.append(toggle(["with parentheses", "without"], draw), out);
    draw(0);
  }

  // printf conversions on the book's number 87
  function printfW(host) {
    const F = [
      ["%d", "87", "signed decimal"], ["%i", "87", "same as %d for printf"], ["%o", "127", "octal"], ["%x", "57", "hex, lowercase a–f"], ["%X", "57", "hex, uppercase A–F"],
      ["%u", "87", "unsigned decimal"], ["%c", "W", "the character with ASCII code 87"],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => { const [f, r, why] = F[i]; out.innerHTML = c(`int n = 87;\nprintf("${f}", n);`) + readout([["prints", esc(r)]]) + `<p>${why}.</p>`; };
    host.append(toggle(F.map((f) => f[0]), draw), out);
    draw(0);
    host.append(el(`<p class="aside">%f, %e and %E expect a floating point argument, %s a string, %p a pointer. The argument's type must match.</p>`));
  }

  // rand and srand: the same seed gives the same sequence
  function randW(host) {
    // The portable sample generator printed in the C standard. Real libraries use their own.
    let next = 1;
    const rand = () => { next = (Math.imul(next, 1103515245) + 12345) >>> 0; return (next >>> 16) & 0x7FFF; };
    const out = el(`<pre class="code" style="min-height:4em"></pre>`), lines = [];
    const run = (seed) => { next = seed >>> 0; const v = Array.from({ length: 5 }, rand); lines.push(`srand(${seed});  →  ${v.join("  ")}`); out.textContent = lines.slice(-5).join("\n"); };
    const r = el(`<div class="row" style="flex-wrap:wrap"></div>`);
    [1, 10].forEach((s) => { const b = btn(`srand(${s}), then rand() ×5`); b.addEventListener("click", () => run(s)); r.append(b); });
    host.append(r, out, el(`<p class="aside">Uses the sample generator printed in the C standard; your library's numbers will differ, but the behaviour is the same.</p>`));
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Files, comments and literals", mins: 15,
    blurb: "How a C program is split into files, and every way to write a constant: octal and hex integers, suffixes, characters, escapes, strings.",
    takeaway: "D.1: an ANSI C (C18) reference for novices, including material not in the main chapters. Source files (.c) hold related functions; each compiles to an object file and the linker joins them into an executable. Header files (.h) hold declarations (functions, variables, structures, types) and macros, paired with the .c file that defines them (stdio.h declares printf, scanf, getchar, putchar); #include the header to call those functions. Comments: // to end of line, or /* */; no nesting; not recognized inside strings. Integer literals: decimal (87), octal with a leading 0 (0127 = 87), hex with 0x (0x57 = 87); a leading minus negates (−024 = −20, −0x24 = −36); suffix L = long int, U = unsigned. Floating literals: integer part, point, fraction (either part optional: 1. and .613123), optional e/E exponent (power of ten); type double by default, f/F = float, l/L = long double. Character literals: 'c' → its ASCII code; escapes (Table D.1): \\n newline, \\t tab, \\v vertical tab, \\b backspace, \\r carriage return, \\f formfeed, \\a alert, \\\\ backslash, \\? question mark, \\' single quote, \\\" double quote, \\nnn octal, \\xnn hex (S = 83 = '\\123' = '\\x53'). String literals in double quotes, with '\\0' added automatically, stored in a section reserved for literal constants; they can initialize a char array (char greeting[10] = \"bon jour!\";) or be passed as char *, but an array cannot be assigned (greeting = \"bon jour!\"; is illegal). Enumeration constants are ints. C is freely formatted. Keywords (D.2.6) can't be used as names: auto, break, case, char, const, continue, default, do, double, else, enum, extern, float, for, goto, if, inline, int, long, register, restrict, return, short, signed, sizeof, static, struct, switch, typedef, union, unsigned, void, volatile, while, plus <code>_Alignas, _Alignof, _Atomic, _Bool, _Complex, _Generic, _Imaginary, _Noreturn, _Static_assert, _Thread_local</code>.",
    steps: [
      { k: "learn", title: "What this appendix is", b: [
        `<p>Appendix D is a <b>C reference manual</b>: short, precise entries you look things up in while programming. It covers more than Chapters 11–20 did (octal literals, unions, static locals, macros with arguments…).</p>`,
        `<p>These parts walk through it once so you know what's there and can read its entries quickly. The ideas you already met get one line and a link back.</p>`,
      ]},
      { k: "learn", title: ".c files and .h files", b: [
        `<p>A <b>source file</b> (<code>stack.c</code>) holds related functions; each one compiles to an object file, and the <b>linker</b> joins them into one executable.</p>`,
        `<p>A <b>header file</b> (<code>stack.h</code>) holds only declarations and macros. Any other file that calls those functions <code>#include</code>s it, so the compiler knows their types.</p>`,
        seenPP("Compiler, linker, and the preprocessor.", "11-intro-c.html", "Chapter 11"),
      ]},
      { k: "play", title: "Literals", b: [
        `<p>Click each of the book's examples:</p>`,
        literals,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A programmer lines up a table: <code>int code[3] = {100, 050, 007};</code> What is <code>code[1]</code>?", a: 40, tol: 0, why: "050 has a leading 0, so it's octal: 5 × 8 = 40. Leading zeros are not decoration in C." },
        { t: "num", q: "How many bytes does the string literal <code>\"bon jour!\"</code> occupy?", a: 10, tol: 0, why: "9 characters (the space counts) plus the '\\0' the compiler adds. That's why the book's <code>char greeting[10]</code> is exactly big enough." },
        { t: "mcq", q: "Which line is illegal, given <code>char greeting[10];</code>?", opts: [["<code>greeting = \"bon jour!\";</code>", true, "An array can't be assigned. Initialize it in the declaration, or copy with strcpy."], ["<code>printf(\"bon jour!\");</code>", false, "A string literal can go wherever a char * is expected."], ["<code>greeting[0] = 'b';</code>", false, "One element is a char; assigning it is fine."]] },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Types and qualifiers", mins: 15,
    blurb: "The basic types, what signed, unsigned, long, short and const change, and enumerated types.",
    takeaway: "Basic types: int, float, double, char, _Bool, _Complex, _Imaginary; sizes and ranges depend on the system. int: signed whole number, typically 32-bit 2's complement. float: single precision, typically IEEE (1 sign, 8 exponent bits in bias-127, 23 fraction bits). double: at least float's precision, usually 64 bits. char: one character of the machine's character code (ASCII); short is at least as big as char. int, char and enums are integral types; float and double are floating types. Enumerated types: enum villains { Penguin, Riddler, CatWoman, Joker }; enum villains badGuy; the enumeration constants are ints counting from 0 (Penguin = 0 … Joker = 3), or from an explicit value (Penguin = 3 makes Riddler 4, and so on). Qualifiers: signed/unsigned on int and char (ints are signed by default; whether plain char is signed depends on the system); short/long change size, with only sizeof(char) ≤ sizeof(short int) ≤ sizeof(int) ≤ sizeof(long int) guaranteed (on 64-bit machines long may be 64 bits while int is 32); <code>&lt;limits.h&gt;</code> gives the ranges; long double ≥ double ≥ float. const: the value never changes, may help the optimizer, and must be initialized (const double pi = 3.14159;).",
    steps: [
      { k: "learn", title: "Basic types", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>int</code></td><td>signed whole number; typically 32-bit 2's complement</td></tr>
          <tr><td><code>float</code></td><td>single precision; typically IEEE: 1 sign, 8 exponent (bias 127), 23 fraction bits</td></tr>
          <tr><td><code>double</code></td><td>at least float's precision; usually 64 bits</td></tr>
          <tr><td><code>char</code></td><td>one character code (ASCII)</td></tr>
          <tr><td><code>_Bool</code>, <code>_Complex</code>, <code>_Imaginary</code></td><td>also built in</td></tr></tbody></table></div>`,
        `<p>int, char and enums are <b>integral</b> types; float and double are <b>floating</b> types. The exact sizes are up to the system.</p>`,
        seenPP("Types, sizes, and how the LC-3 stores them.", "12-variables-operators.html", "Chapter 12"),
      ]},
      { k: "learn", title: "Qualifiers", b: [
        `<p><b>signed / unsigned</b> on int and char. Plain ints are signed; whether a plain char is signed depends on the system.</p>`,
        `<p><b>short / long</b> change the size, but C only promises an order:</p>`,
        c(`sizeof(char) <= sizeof(short int) <= sizeof(int) <= sizeof(long int)`),
        `<p>On many 64-bit machines int is 32 bits and long is 64. The header <code>&lt;limits.h&gt;</code> tells you the ranges on your machine.</p>`,
        `<p><b>const</b>: the value never changes. It must be initialized: <code>const double pi = 3.14159;</code></p>`,
      ]},
      { k: "learn", title: "Enumerated types", b: [
        c(`enum villains { Penguin, Riddler, CatWoman, Joker };   // specifier
enum villains badGuy;                                  // declaration`),
        `<p>badGuy can only hold one of the four symbolic values. Underneath they're ints numbered from 0: Penguin = 0, Riddler = 1, CatWoman = 2, Joker = 3. You can set a starting value:</p>`,
        c(`enum villains { Penguin = 3, Riddler, CatWoman, Joker };`),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "With <code>enum villains { Penguin = 3, Riddler, CatWoman, Joker };</code>, what is the value of CatWoman?", a: 5, tol: 0, why: "Each constant is one more than the last: Penguin 3, Riddler 4, CatWoman 5, Joker 6." },
        { t: "mcq", q: "A program assumes <code>long</code> is exactly twice the size of <code>int</code>. What does the C standard guarantee?", opts: [["Only that long is at least as big as int", true, "The sizes may even be equal, as on many 32-bit systems."], ["long is always 64 bits", false, "Only on some machines."], ["long is always twice int", false, "C promises an order, not a ratio."]] },
        { t: "mcq", q: "Which declaration does the compiler reject?", opts: [["<code>const int limit;</code>", true, "A const variable must be initialized when it's declared; you can't assign it later."], ["<code>unsigned char k;</code>", false, "Fine."], ["<code>long double y;</code>", false, "Fine."]] },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Storage classes", mins: 10,
    blurb: "Automatic variables die with their block; static ones live for the whole program. Plus register and extern.",
    takeaway: "Storage class (D.3.3): automatic objects are local to a block, live on the run-time stack (Section 14.3.1) and lose their value when the block ends; locals are automatic by default and must be initialized by the programmer. Static objects keep their values for the whole run: globals and anything declared outside all blocks, plus locals marked static, which the compiler allocates in the global data section instead of the activation record, so they persist across calls (Count's static int y counts calls); static variables are initialized to zero. register: a hint that an automatic variable is used often and should live in a register; the compiler may ignore it. extern: the variable's or function's storage is defined in another object module, joined at link time. (The book's Count is declared to return int but has no return statement: by its own Section D.7.9, its return value is undefined; it should be void.)",
    steps: [
      { k: "learn", title: "Automatic vs static", b: [
        `<p><b>Automatic</b>: local variables, by default. They live in the function's activation record on the run-time stack and vanish when the block ends. You must initialize them yourself.</p>`,
        `<p><b>Static</b>: global variables, and locals declared <code>static</code>. They live in the global data section and keep their values for the whole run.</p>`,
        seenPP("Activation records on the run-time stack.", "14-functions.html", "Chapter 14"),
      ]},
      { k: "play", title: "A function that counts its calls", b: [
        countWidget,
        `<p>With <code>static</code>, y survives between calls because it isn't in the activation record. With an automatic y, every call starts over.</p>`,
      ]},
      { k: "learn", title: "register and extern", b: [
        `<p><b>register</b>: a hint that a local is used a lot and should be kept in a register. The compiler is free to ignore it.</p>`,
        `<p><b>extern</b>: “this variable or function is defined in another file”; the linker connects them.</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>Look again at the book's Count above. Then read its own rule in D.7.9: “If a function returns a value, and yet no return statement within the function explicitly generates a return value, then the return value is undefined.”</p>`,
        { t: "mcq", q: "What's wrong with Count as printed?", opts: [["It's declared to return an int but never returns one, so a caller using its value gets garbage. It should be declared void.", true, "Count only prints. Nothing in the function computes a value to hand back."], ["static locals must be initialized", false, "Static variables start at zero."], ["The parameter x is unused, which is an error", false, "Unused parameters are allowed (a warning at most)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a static local variable keep its value between calls when an ordinary local doesn't?", model: "An ordinary local is automatic: it lives in the function's activation record on the run-time stack, which is popped when the function returns, so the next call gets a new, uninitialized copy. A static local is allocated in the global data section instead, so it exists for the whole program and the next call finds the value the last one left." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Derived types", mins: 15,
    blurb: "Arrays, pointers, structures, unions and typedef: what's allowed, and what one union byte map looks like.",
    takeaway: "Derived types: pointers, arrays, structures, unions. Arrays: elements of type T sequential in memory (X, X + sizeof(T), …), indexed from 0; the size must be a constant integral expression; char string[100]; int data[20]; the index can be any integral expression; no bounds checking (for string[x + y], x + y must be at most 99: the book says \"100 or less\", an off-by-one slip). Pointers: int *v; allowed operations: assign pointers of the same type, assign 0 (null pointer), add or subtract integers, compare or subtract two pointers into the same array; anything else needs casts. Structures: struct <code>tag_id</code> { type1 member1; … }; struct <code>tag_id</code> x; same members but different tags are different types; variables can be declared with the structure (struct point { int x; int y; } firstPoint; struct point image[100];). Unions hold one object that can be any of several types at different times: union <code>u_tag</code> { int ival; double fval; char cval; } joined; accessed as joined.ival, joined.fval, joined.cval; sized for the largest member. typedef type name; makes a synonym: typedef enum {coffee, tea, water, soda} Beverage; typedef struct { int xCoord; int yCoord; int color; } Pixel; Pixel bitmap[1024*820];. (Slip in D.5.8.4: typedef pointType Point; must say typedef struct pointType Point; in C.)",
    steps: [
      { k: "learn", title: "Arrays and pointers", b: [
        `<p><b>Arrays</b>: if element 0 of an array of T is at X, element 1 is at X + sizeof(T), and so on. The size must be a constant expression. C does <b>not</b> check that an index is in bounds.</p>`,
        `<p><b>Pointers</b>: C allows only a few operations. Assign a pointer of the same type, or 0 (the null pointer). Add or subtract an integer. Compare or subtract two pointers, which only means something if they point into the same array.</p>`,
        seenPP("Pointers, arrays and pointer arithmetic.", "16-pointers-arrays.html", "Chapter 16"),
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        c(`char string[100];   // Declares array of 100 characters
...
string[x + y]       // x and y must be integers`),
        `<p>The book adds: “the value of x + y should be 100 or less; otherwise, the reference exceeds the bounds of the array string.”</p>`,
        { t: "mcq", q: "Is that right?", opts: [["No: valid indexes are 0 to 99, so x + y must be at most 99", true, "string[100] is one past the end. Off-by-one at the boundary is the classic array bug."], ["Yes: the array has 100 elements, so 100 is fine", false, "100 elements are numbered 0 to 99."], ["No: it must be under 50 because each char takes two bytes", false, "A char is one element of the array, whatever its size."]] },
      ]},
      { k: "learn", title: "Structures and unions", b: [
        `<p>A <b>structure</b> holds several members at once. A <b>union</b> holds <i>one</i> value that can be any of its member types, all sharing the same bytes:</p>`,
        c(`union u_tag {
  int ival;
  double fval;
  char cval;
} joined;          // joined.ival, joined.fval, joined.cval`),
      ]},
      { k: "play", title: "Where the bytes go", b: [
        layout,
      ]},
      { k: "learn", title: "typedef", b: [
        c(`typedef enum {coffee, tea, water, soda} Beverage;
Beverage drink;

typedef struct {
  int xCoord;
  int yCoord;
  int color;
} Pixel;
Pixel bitmap[1024*820];`),
        `<p>No new type, just a better name for one.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Section D.5.8.4 writes <code>struct pointType {…};</code> then <code>typedef pointType Point;</code>. Will a C compiler accept that typedef?", opts: [["No: in C the structure's name is <code>struct pointType</code>, so it must be <code>typedef struct pointType Point;</code>", true, "C++ would accept the short form, since there a class name is a type name on its own. C doesn't."], ["Yes, typedef can name any identifier", false, "pointType alone isn't a type in C."], ["Yes, but only if pointType has no members", false, "Members have nothing to do with it."]] },
        { t: "mcq", q: "Why would a program use a union instead of a structure?", opts: [["To store one value whose type changes during the run, without paying for all the types at once", true, "Only one member is meaningful at a time, so they can share memory."], ["To make the members private", false, "C has no private members."], ["To make access faster", false, "It's about space and meaning, not speed."]] },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Operators", mins: 20,
    blurb: "Compound assignment, bitwise operators on the book's x = 186 and y = 6, short circuits, ++ before and after, ?:, and sizeof.",
    takeaway: "Assignment operators associate right to left; the left side must be a modifiable lvalue (not a function, const object or whole array; an array element is fine; structures and unions can be assigned); with different basic types the right side is converted to the left's type. A op= B means A = A op (B) (+= −= *= /= %= &= |= ^= <<= >>=). Arithmetic + − * / %; % needs integral operands; mixed types follow the conversion rules; ptr + 1 points to the next element, i.e. the address grows by sizeof(type) bytes (the book writes this as \"equivalent to ptr + sizeof(type)\", which in C would skip sizeof(type) elements). Unary + and −. Bit-wise & | ^ ~ << >> on integral values only (Table D.2 with x = 186, y = 6: x & y = 2, x | y = 190, ~x = −187, x ^ y = 188, x << y = 11904, x >> y = 2); shifting by a negative count or by at least the width (the book says \"greater than\", e.g. 33 for 32 bits; 32 is undefined too) is undefined. Logical && || ! give 1 or 0 and short-circuit: in (x || y++), if x is nonzero, y++ never happens. Relational == != > >= < <= give 1 or 0; pointers compare meaningfully only within one object. ++/−−: prefix changes first, then gives the new value (y = ++x with x = 4: both 5); postfix gives the old value, then changes (y = x++: x = 5, y = 4); also on pointers. Conditional A ? B : C (w = x ? y : z), short-circuited. Address &, dereference * (lvalue on the left of =), array reference [ ], . for structure/union members, -> through a pointer (ptr->x = ptr->x + 1). sizeof gives bytes: sizeof(int); for an array, the whole array (sizeof(list) = 45 * sizeof(int) for int list[45]); sizeof(Example) for a structure.",
    steps: [
      { k: "learn", title: "Assignment", b: [
        `<p>All assignment operators group right to left. The left side must be something you can store into: not a function, not a const, not a whole array (one element is fine).</p>`,
        `<p><code>A op= B</code> means <code>A = A op (B)</code>. Note the parentheses around B.</p>`,
      ]},
      { k: "check", title: "Predict", b: [
        { t: "num", q: "<code>int x = 4; x *= 2 + 3;</code> What is x now?", a: 20, tol: 0, why: "x = x * (2 + 3) = 20, not x * 2 + 3. The whole right side is evaluated first." },
      ]},
      { k: "play", title: "Bit-wise operators (Table D.2)", b: [
        bitOps,
        `<p>Integral values only: no bit-wise operators on float or double.</p>`,
        `<p class="aside">The book says shifting by more than the width (say 33 on a 32-bit int) is undefined. So is shifting by exactly the width, 32.</p>`,
      ]},
      { k: "learn", title: "Logical operators short-circuit", b: [
        `<p>&&, || and ! give 1 or 0. && and || stop as soon as the answer is known.</p>`,
        { t: "num", q: "<code>int x = 1, y = 5, z; z = (x || y++);</code> What is y afterwards?", a: 5, tol: 0, why: "x is nonzero, so the || is already true and y++ is never evaluated. z is 1." },
      ]},
      { k: "learn", title: "++, ?: and sizeof", b: [
        c(`int x = 4, y;
y = ++x;    // x = 5, y = 5: increment, then use
x = 4;
y = x++;    // x = 5, y = 4: use, then increment

w = x ? y : z;   // y if x is nonzero, else z`),
        `<p><code>sizeof</code> gives a size in bytes. For an array it's the <b>whole</b> array: with <code>int list[45];</code>, <code>sizeof(list)</code> is 45 × sizeof(int).</p>`,
      ]},
      { k: "bug", title: "Spot the slip", b: [
        `<p>Section D.5.2 says: “the expression ptr + 1, where ptr is of type type *, is equivalent to ptr + sizeof(type).”</p>`,
        { t: "mcq", q: "With <code>int *ptr</code> and 4-byte ints, what's the problem with taking that literally?", opts: [["In C, ptr + sizeof(int) is ptr + 4, which skips four ints. What's meant is that the <i>address</i> grows by sizeof(int) bytes.", true, "Pointer arithmetic counts elements; the hardware address moves by element size × count."], ["Nothing: ptr + 1 and ptr + 4 are the same address", false, "They're four elements apart."], ["You can't add integers to pointers", false, "You can; it's pointer arithmetic."]] },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Precedence and conversions", mins: 15,
    blurb: "How the compiler groups an expression (Table D.4), what type the result has, and what a cast actually applies to.",
    takeaway: "Order of evaluation (D.5.10): innermost parentheses first, then higher-precedence operators; equal precedence → associativity. Table D.4 (highest first): 1 () [] . -> (l to r); 2 postfix ++ −− ; 3 prefix ++ −−; 4 * (indirection) & (address) unary + − ! sizeof; 5 (type) cast; 6 * / %; 7 + −; 8 << >>; 9 < > <= >=; 10 == !=; 11 &; 12 ^; 13 |; 14 &&; 15 ||; 16 ?:; 17 = += −= *= etc. (r to l). Type conversions (D.5.11): same types → the operator's type; mixed basic types → standard arithmetic conversions: smaller to larger, integral to floating; char, int and enums become int (or unsigned int). Examples with char i, int j, float x, double y: i * j int, j + 1 int, x + y double, i + j + x + y double; the book says j + 1.0 and i + 1.0 are float, but 1.0 is a double literal (D.2.4.2), so both are double. % needs integral operands; floating → integral (by cast) drops the fraction, undefined if it doesn't fit. Casting: (new-type) expression; it binds tighter than +, so j = (int) x + y; converts only x, adds y as a double, and the assignment then converts the sum to int.",
    steps: [
      { k: "learn", title: "Table D.4 in one breath", b: [
        `<div class="tbl"><table><thead><tr><th>Group</th><th>Operators</th></tr></thead><tbody>
          <tr><td>1–5</td><td><code>() [] . -></code>, then postfix <code>++ --</code>, prefix <code>++ --</code>, unary <code>* & + - ! sizeof</code>, casts</td></tr>
          <tr><td>6–7</td><td><code>* / %</code>, then <code>+ -</code></td></tr>
          <tr><td>8–10</td><td><code>&lt;&lt; &gt;&gt;</code>, then <code>&lt; &gt; &lt;= &gt;=</code>, then <code>== !=</code></td></tr>
          <tr><td>11–13</td><td><code>&amp;</code>, then <code>^</code>, then <code>|</code></td></tr>
          <tr><td>14–17</td><td><code>&amp;&amp;</code>, <code>||</code>, <code>?:</code>, then assignments (right to left)</td></tr></tbody></table></div>`,
        `<p>Equal precedence: associativity decides. Unsure? Add parentheses; they cost nothing.</p>`,
      ]},
      { k: "play", title: "How does it group?", b: [
        groups,
      ]},
      { k: "learn", title: "Mixed types", b: [
        `<p>When an operator gets two different basic types, C converts the smaller to the larger, and integral to floating. char and enums become int first.</p>`,
        c(`char i;  int j;  float x;  double y;

i * j          // int
j + 1          // int
x + y          // double
i + j + x + y  // double`),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "With <code>char i; int j; float x; double y;</code>, what type is each expression?", bins: ["int", "float", "double"], items: [
          ["i + 1", 0, "char becomes int."],
          ["x + 1", 1, "int converted to float."],
          ["j + 1.0", 2, "1.0 is a double literal."],
          ["x * y", 2, "float converted to double."],
          ["i * j", 0, "Both integral."],
        ]},
      ]},
      { k: "bug", title: "Spot the slip", b: [
        `<p>Section D.5.11's examples include:</p>`,
        c(`j + 1.0   // This expression is a float
i + 1.0   // This expression is a float`),
        { t: "mcq", q: "Using the appendix's own Section D.2.4.2 on floating point literals, what should those comments say?", opts: [["double: an unsuffixed 1.0 is a double, so the int or char is converted to double", true, "Only 1.0f would make them float."], ["float is correct", false, "That would need the f suffix."], ["int: the integer operand wins", false, "Integral types are converted to floating, never the reverse."]] },
      ]},
      { k: "check", title: "What does the cast cover?", b: [
        c(`int j;  float x = 2.7;  double y = 1.5;
j = (int) x + y;`),
        { t: "num", q: "What is j?", a: 3, tol: 0, why: "The cast binds tighter than +, so only x is converted: 2 + 1.5 = 3.5 (a double), and assigning to j drops the fraction: 3. Writing (int)(x + y) would give (int)4.2 = 4." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Control and the preprocessor", mins: 15,
    blurb: "The control statements on one card, a typo that won't compile, and why macro arguments need parentheses.",
    takeaway: "Expressions and statements (D.6): an expression is any legal combination of constants, variables, operators and calls with a type; a statement is an expression ended by ;; a compound statement (block) is { … } and can go wherever a statement can. Control (D.7): if (expression) statement; if-else; switch (integral expression) with distinct constant case labels, control jumps to the matching label and runs on until break, default catches the rest, and with no match and no default nothing runs; while (test first); for (initializer; term-expr; reinitializer) (initializer once, test before each iteration, reinitializer after each body); do-while (body at least once, ; after the while); break leaves the innermost loop or switch; continue ends the current iteration (in a for, the reinitializer still runs, then the test); return expression; converts to the function's return type (no return value → undefined). The book's for example writes X++ for x++: C is case-sensitive, so it won't compile. Preprocessor (D.8): directives need no semicolon. #define A B replaces the token A by B (not inside APPLE or \"A\"); a backslash continues a long definition. Macros with arguments: #define REMAINDER(X, Y) ((X) % (Y)); REMAINDER(valueA, valueB + 15) → ((valueA) % (valueB + 15)); the parentheses are required, and there's no function-call overhead. (The text calls it \"the macro COPY\" and its arguments \"A and B\": it means REMAINDER, X and Y.) #include <stdio.h> searches the system's predefined directory; #include \"program.h\" the source file's own directory.",
    steps: [
      { k: "learn", title: "The control statements", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>if</code> / <code>if-else</code></td><td>runs a statement when the expression is nonzero</td></tr>
          <tr><td><code>switch</code></td><td>jumps to the matching <code>case</code>; runs on until <code>break</code>; <code>default</code> catches the rest</td></tr>
          <tr><td><code>while</code></td><td>tests first; may run zero times</td></tr>
          <tr><td><code>for</code></td><td>initializer once; test before each pass; reinitializer after each body</td></tr>
          <tr><td><code>do-while</code></td><td>body first; always runs at least once</td></tr>
          <tr><td><code>break</code> / <code>continue</code></td><td>leave the loop or switch / skip to the next iteration</td></tr></tbody></table></div>`,
        seenPP("Every one of these, compiled to LC-3.", "13-control-structures.html", "Chapter 13"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Inside a <code>for</code> loop, <code>continue</code> runs. What happens next?", opts: [["The reinitializer (e.g. x++) runs, then the test", true, "continue skips the rest of the body only."], ["The loop ends", false, "That's break."], ["The test runs, skipping the reinitializer", false, "In a for loop the reinitializer still runs."]] },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>Section D.7.5's example, said to iterate 100 times:</p>`,
        c(`for (x = 0; x < 100; X++) {
  printf("x = %d\\n", x);
}`),
        { t: "mcq", q: "What will the compiler do with it?", opts: [["Reject it (unless some X happens to be declared): C is case-sensitive, so X is not x", true, "And if an X did exist, x would never change and the loop would never end. Either way, it should be x++."], ["Run it 100 times", false, "Only if it said x++."], ["Run it once", false, "It doesn't get that far."]] },
      ]},
      { k: "learn", title: "#define", b: [
        `<p><code>#define A B</code>: before compiling, every <b>token</b> A becomes B. The A inside <code>APPLE</code> and inside <code>"A"</code> is untouched. Directives need no semicolon.</p>`,
        `<p>Macros can take arguments, and then parentheses matter:</p>`,
      ]},
      { k: "play", title: "Why the parentheses?", b: [
        macro,
        `<p>A macro is text substitution, not a function call: no call overhead, but no protection either.</p>`,
        `<p class="aside">The book's paragraph calls this “the macro COPY” with arguments “A and B”. It means REMAINDER, X and Y: a leftover from an older example.</p>`,
      ]},
      { k: "learn", title: "#include", b: [
        c(`#include <stdio.h>       // look in the system's header directory
#include "program.h"     // look next to this source file`),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the REMAINDER macro put parentheses around X, around Y, and around the whole result?", model: "Because the preprocessor pastes the argument text in literally. If an argument is an expression like valueB + 15, without parentheses the % would bind to valueB alone and give the wrong value. The outer parentheses do the same job for the result, so the expansion stays one unit when the macro is used inside a bigger expression." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "The standard library", mins: 15,
    blurb: "A tour of the library sections: I/O, strings, math, memory and random numbers.",
    takeaway: "The ANSI C standard library has over 150 functions, available on every ANSI C installation, so programs that use them stay portable. stdio.h: int getchar(void) reads the next character of stdin (like the LC-3 input TRAP without a prompt; usually line-buffered until Enter); void putchar(int c) writes one character (like TRAP OUT; output may wait for a newline to be flushed); int scanf(const char *format, ptr1, …) converts input fields into the variables pointed to (Table D.5: %d signed decimal, %i decimal/octal (0)/hex (0x), %o, %x, %u, %c, %s non-white-space string with \\0 added, %f %e float, %lf double) and returns how many were assigned; int printf(const char *format, …) prints (Table D.6: %d %i, %o, %x %X, %u, %c, %s, %f, %e %E, %p) and returns the number of characters written or a negative value on error. string.h (about 15 functions): strcmp(a, b) returns 0 if equal, > 0 if a comes later in dictionary order, < 0 if earlier; strcpy(a, b) copies b into a up to and including the null and returns a. math.h: sin, cos, tan (radians), exp, log (natural), sqrt, pow(x, y), all taking and returning double. stdlib.h: void *malloc(<code>size_t</code> size) returns a pointer to size bytes or NULL (<code>size_t</code> is sizeof's type, usually unsigned); void free(void *ptr) returns a previously allocated chunk; int rand(void) gives pseudo-random 0 to <code>RAND_MAX</code> (at least 32,767), the same sequence for the same seed; void srand(unsigned int seed) sets the seed.",
    steps: [
      { k: "learn", title: "stdio.h", b: [
        `<p><b>getchar</b> and <b>putchar</b> are one character in or out, like the LC-3's IN (without the prompt) and OUT traps. Input is usually buffered until Enter; output until a newline.</p>`,
        `<p><b>scanf</b> takes a format string plus <b>pointers</b> to the variables to fill. <b>printf</b> takes a format string plus the values.</p>`,
        seenPP("Streams, buffering, printf and scanf.", "18-io-in-c.html", "Chapter 18"),
      ]},
      { k: "play", title: "One number, many formats", b: [
        printfW,
      ]},
      { k: "learn", title: "Strings, math, memory", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>&lt;string.h&gt;</code></td><td><code>strcmp(a, b)</code>: 0 if equal, &gt; 0 if a comes later in a dictionary, &lt; 0 if earlier. <code>strcpy(a, b)</code>: copy b into a, null included (a must be big enough).</td></tr>
          <tr><td><code>&lt;math.h&gt;</code></td><td>sin, cos, tan (radians), exp, log (natural), sqrt, pow(x, y). All double in, double out.</td></tr>
          <tr><td><code>&lt;stdlib.h&gt;</code></td><td><code>malloc(n)</code>: n bytes or NULL. <code>free(p)</code>: give back a chunk you allocated.</td></tr></tbody></table></div>`,
        seenPP("malloc, free and the heap.", "19-dynamic-data.html", "Chapter 19"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What is the sign of <code>strcmp(\"apple\", \"banana\")</code>?", opts: [["Negative", true, "\"apple\" comes before \"banana\" in a dictionary."], ["Positive", false, "That would mean apple comes later."], ["Zero", false, "Zero means the strings are equal."]] },
        { t: "mcq", q: "Why does <code>scanf(\"%d\", &n)</code> need the &, when <code>printf(\"%d\", n)</code> doesn't?", opts: [["scanf must store into n, so it needs n's address; printf only needs n's value", true, "Pass by reference vs pass by value."], ["& converts n to ASCII", false, "Conversion is the format string's job."], ["Both need it; printf adds it automatically", false, "printf gets a copy of the value."]] },
      ]},
      { k: "play", title: "rand and srand", b: [
        `<p><code>rand()</code> returns a number from 0 to <code>RAND_MAX</code> (at least 32,767). The numbers only <i>look</i> random: the same seed always gives the same sequence. Click each button twice:</p>`,
        randW,
        `<p>That repeatability is useful for debugging. For different numbers each run, seed with something that changes, such as the time.</p>`,
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ppD", eyebrow: "Patt & Patel · Appendix D", title: "The C Programming Language",
    intro: `<p>Eight parts, one tour of the C reference manual: literals, types, storage classes, derived types, operators, precedence and conversions, control and the preprocessor, and the standard library.</p><p>Things Chapters 11–20 already taught get one line and a link back; the time goes to what's new (octal, unions, static locals, macros, conversions) and to reading the reference critically. It has several slips. Arrow keys ← → move between steps.</p>`,
    after: `<p>This appendix has no exercises. Keep it open as your reference while doing the exercises in Chapters 11–20, and check what the reference says against what your compiler actually does.</p><p>Stuck on a C detail? Tell Claude what you expected and what happened. You'll get a guiding question first.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Lexical</h3>
      <p>.c + .h; // and /* */; 0127 octal, 0x57 hex, 87U, 87L; 1.0 double, 1.0f float; escapes \\n \\t \\0 \\\\ \\' \\" \\nnn \\xnn; "…" gets a \\0; arrays can't be assigned.</p>
      <h3>Types</h3>
      <p>int, float, double, char, enum (0, 1, 2… or from a set value); signed/unsigned, short/long (only an order is guaranteed), const (initialize it). Automatic vs static (persists, starts at 0); register, extern. Arrays (no bounds check), pointers, struct, union (largest member), typedef.</p>
      <h3>Expressions</h3>
      <p>A op= B is A = A op (B); bit-wise on integers only; && || short-circuit; ++x vs x++; ?:; sizeof(array) = whole array. Table D.4 precedence; mixed types convert up (integral → floating); a cast covers only its operand.</p>
      <h3>Preprocessor and library</h3>
      <p>#define (parenthesize macro arguments), #include &lt;…&gt; vs "…". getchar, putchar, scanf (pointers), printf; strcmp, strcpy; math in double and radians; malloc/free; rand/srand (same seed, same sequence).</p>`,
  };
  Course.start(window.CHAPTER);
})();

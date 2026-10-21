(function () {
  const { slider, toggle, readout, el } = Course;
  const seen = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  // C listings: // comments, line numbers optional
  const c = (t, o = {}) => {
    const lines = t.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n"), hl = [].concat(o.hl || []), w = String(lines.length).length;
    return `<pre class="code" style="font-variant-ligatures:none">${lines.map((ln, i) => {
      const k = ln.indexOf("//"), body = esc(k >= 0 ? ln.slice(0, k) : ln) + (k >= 0 ? `<span class="cm">${esc(ln.slice(k))}</span>` : "");
      const num = o.nums ? `<span class="cm" style="font-style:normal">${String(i + 1).padStart(w)} </span>` : "";
      return hl.includes(i + 1) ? `<span class="hl">${num}${body}</span>` : num + body;
    }).join("\n")}</pre>`;
  };
  const PP = "../pp/";

  /* ---------- a small stepper: code on top, state below ---------- */
  function stepper(host, o) {
    let i = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), count = el(`<span class="aside"></span>`);
    const bB = btn("◀ Back"), bN = btn("Step ▶", "primary"), bR = btn("Reset");
    const draw = () => {
      const f = o.frames[i];
      out.innerHTML = c(o.code, { nums: true, hl: f.l }) + (f.html || "") + (f.note ? `<p>${f.note}</p>` : "");
      count.textContent = `${i + 1} / ${o.frames.length}`;
      bB.disabled = i === 0; bN.disabled = i === o.frames.length - 1;
    };
    bB.addEventListener("click", () => { i--; draw(); });
    bN.addEventListener("click", () => { i++; draw(); });
    bR.addEventListener("click", () => { i = 0; draw(); });
    row.append(bB, bN, bR, count);
    host.append(row, out);
    draw();
  }
  const mem = (rows) => `<div class="tbl"><table style="font-family:var(--mono);font-size:13px"><thead><tr><th>Address</th><th>Data</th><th>Variable</th></tr></thead><tbody>${rows.map(([a, v, n, hot]) => `<tr style="${hot ? "background:var(--accent);color:var(--paper)" : ""}"><td>${a}</td><td>${v}</td><td>${n || ""}</td></tr>`).join("")}</tbody></table></div>`;

  /* ---------- widgets ---------- */
  // Figure C.2: the bytes of C Code Example C.3
  function bytesC3(host) {
    const B = [["0", "?", ""], ["1", "00101010", "x"], ["2", "11110110", "y"], ["3", "11111111", "y"], ["4", "00000000", "z"], ["5", "00000000", "z"], ["6", "00000000", "z"], ["7", "00000000", "z"]];
    const V = { x: ["unsigned char x = 42;", "1 byte", "42 = 00101010"], y: ["short y = -10;", "2 bytes", "−10 = 11111111 11110110 (low byte at the lower address)"], z: ["unsigned long z = 0;", "4 bytes", "0 = 32 zero bits"] };
    const out = el(`<div></div>`);
    const draw = (n) => {
      out.innerHTML = mem(B.slice().reverse().map(([a, v, k]) => [a, v, k, k === n])) + readout([["declaration", esc(V[n][0])], ["size", V[n][1]], ["bits", V[n][2]]]);
    };
    host.append(toggle(["x", "y", "z"], (i) => draw("xyz"[i])), out);
    draw("y");
  }

  // Code Example C.7: predict, then reveal each result
  function c7(host) {
    const R = [
      ["44 / 14", "3", "integer division truncates"], ["44 % 14", "2", "44 mod 14"],
      ["0x2C && 0xE", "1", "logical AND: both nonzero"], ["0x2C || 0xE", "1", "logical OR"],
      ["0x2C & 0xE", "0xC (0b001100)", "bitwise AND: 101100 & 001110"], ["0x2C | 0xE", "0x2E (0b101110)", "bitwise OR"],
      ["0x2C ^ 0xE", "0x22 (0b100010)", "bitwise XOR"], ["0xE << 2", "0x38 (0b111000)", "left shift by 2"], ["0x2C >> 3", "0x5 (0b101)", "right shift by 3"],
    ];
    const t = el(`<div class="tbl"><table style="font-family:var(--mono);font-size:13px"><thead><tr><th>Expression</th><th>Result</th></tr></thead><tbody></tbody></table></div>`);
    R.forEach(([e, r, n]) => {
      const tr = el(`<table><tbody><tr><td>${esc(e)}</td><td></td></tr></tbody></table>`).querySelector("tr");
      const b = btn("Show", "small");
      b.addEventListener("click", () => { tr.lastElementChild.innerHTML = `<b>${r}</b> <span class="aside" style="font-family:inherit">${n}</span>`; });
      tr.lastElementChild.append(b);
      t.querySelector("tbody").append(tr);
    });
    host.append(el(`<p>Work each one out in binary (0x2C = 101100, 0xE = 001110), then check:</p>`), t);
  }

  // C Code Example C.18 with Figure C.3's addresses
  const C18 = `int salary1, salary2; // 32-bit numbers
int *ptr;               // a pointer to an int
salary1 = 67500;        // = 0x000107AC
ptr = &salary1;         // ptr = 0x70
salary2 = *ptr + 1000;  // contents of 0x70, plus 1000`;
  const c18frames = (() => {
    const W = (s1, s2, p, hot) => mem([["0x78", p, "ptr", hot === 2], ["0x74", s2, "salary2", hot === 1], ["0x70", s1, "salary1", hot === 0]]);
    return [
      { l: [1, 2], html: W("?", "?", "?"), note: "Declared: four bytes each, at addresses the compiler chooses (here 0x70, 0x74, 0x78). Nothing is initialized yet." },
      { l: 3, html: W("0x000107AC", "?", "?", 0), note: "67,500 = 0x000107AC is stored in the four bytes at 0x70–0x73." },
      { l: 4, html: W("0x000107AC", "?", "0x00000070", 2), note: "&salary1 is the address of its lowest byte, 0x70. ptr now holds that address." },
      { l: 5, html: W("0x000107AC", "0x00010B94", "0x00000070", 1), note: "*ptr reads the int at address 0x70 (67,500); adding 1000 gives 68,500 = 0x00010B94 in salary2." },
    ];
  })();

  // Figure C.3(b): the same memory byte by byte, little-endian
  function bytesC18(host) {
    const W = [["0x70", 0x000107AC, "salary1"], ["0x74", 0x00010B94, "salary2"], ["0x78", 0x70, "ptr"]];
    const rows = [];
    W.slice().reverse().forEach(([a, v, n]) => { for (let k = 3; k >= 0; k--) rows.push(["0x" + (parseInt(a, 16) + k).toString(16).toUpperCase(), "0x" + ((v >>> (8 * k)) & 255).toString(16).toUpperCase().padStart(2, "0"), k === 0 ? n : ""]); });
    host.append(el(mem(rows)));
  }

  // printf %w.df
  function printfW(host) {
    const V = [["pi", 3.14159], ["e", 2.7182], ["c", 2.998e8]];
    let vi = 0, w = 4, d = 2;
    const out = el(`<div></div>`);
    const draw = () => {
      const [n, v] = V[vi], s = v.toFixed(d), p = s.length >= w ? s : " ".repeat(w - s.length) + s;
      const vis = p.replace(/ /g, "·");
      out.innerHTML = c(`printf("${n} = %${w}.${d}f\\n", ${n});`) + `<pre class="code" style="font-variant-ligatures:none">${n} = ${esc(vis)}</pre>` +
        readout([["characters printed", p.length], ["requested width", w], ["digits after the point", d]]) +
        `<p class="aside">· marks a padding space. ${s.length > w ? "Too wide for the requested width, so the width is ignored; the digits after the point are kept." : "The decimal point counts toward the width."}</p>`;
    };
    host.append(toggle(V.map((x) => x[0]), (i) => { vi = i; draw(); }),
      slider({ id: "pfw", label: "width w", min: 0, max: 14, step: 1, value: w, show: (x) => Math.round(x) }, (x) => { w = Math.round(x); draw(); }).el,
      slider({ id: "pfd", label: "decimal places d", min: 0, max: 6, step: 1, value: d, show: (x) => Math.round(x) }, (x) => { d = Math.round(x); draw(); }).el, out);
    draw();
  }

  // C Code Example C.39: a fixed sequence of list operations
  const LL = `insertUser("ben",    "pw1", 1, 0);
insertUser("alyssa", "pw2", 2, 1);
insertUser("ivan",   "pw3", 3, 0);
n = numUsers();
deleteUser(2);
p = findUser(1);
q = findUser(2);`;
  const list = (ids, hot) => `<pre class="code" style="font-variant-ligatures:none">users → ${ids.map((u) => (u === hot ? `[uid ${u}]*` : `[uid ${u}]`)).join(" → ")}${ids.length ? " → " : ""}NULL</pre>`;
  const llFrames = [
    { l: 1, html: list([1], 1), note: "malloc a new userL, copy the fields in, point its next at the old head (NULL), and make users point to it." },
    { l: 2, html: list([2, 1], 2), note: "insertUser always adds at the <b>head</b>: the new node's next is the old first node." },
    { l: 3, html: list([3, 2, 1], 3), note: "So the list ends up in reverse order of insertion." },
    { l: 4, html: list([3, 2, 1]) + readout([["n", 3]]), note: "numUsers walks cur from users until NULL, counting." },
    { l: 5, html: list([3, 1]), note: "deleteUser finds uid 2 with prev pointing at uid 3, sets prev->next = cur->next (skipping it) and frees the node. Had it been the head (prev == NULL), users itself would change." },
    { l: 6, html: list([3, 1], 1) + readout([["p", "→ uid 1's node"]]), note: "findUser returns a pointer to the node, so the caller can read or change it." },
    { l: 7, html: list([3, 1]) + readout([["q", "NULL"]]), note: "uid 2 is gone: findUser runs off the end and returns NULL. Always check before dereferencing." },
  ];

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Welcome to C", mins: 10,
    blurb: "Why a hardware book teaches C, and Hello world taken apart.",
    takeaway: "The book's levels run from transistors up to software; this appendix fits logically between Chapters 5 and 6 as the highest level of abstraction. Table C.1 languages by decreasing abstraction: Matlab (math), Perl (scripting), Python (readability), Java (runs securely anywhere), C (flexibility and system access, including device drivers), assembly (human-readable machine language), machine language (binary). C was created at Bell Labs (Dennis Ritchie, Brian Kernighan and others, 1969–1973) to rewrite UNIX from assembly; K&R's book 1978; ANSI C/C89 (1989), ISO/IEC 1990, C99 (used here). Popular because it's available everywhere from supercomputers to microcontrollers, easy to use with a huge user base, moderately abstract yet predictable, high-performance and able to touch hardware directly (addresses in memory). C lacks protections (e.g., against writing past the end of an array), which hackers exploit. A program is one or more .c text files; C Code Example C.1 hello.c: header #include <code>&lt;stdio.h&gt;</code> (library functions such as printf), exactly one main function (int main(void), returning an int status), body of statements each ending in ;. Run: gcc hello.c produces a.out (a.exe on Windows); type ./a.out.",
    steps: [
      { k: "learn", title: "Why C, in a hardware book?", b: [
        `<p>Table C.1 lines up languages by abstraction: Matlab, Perl, Python, Java, <b>C</b>, assembly, machine language. C sits just above assembly. It is abstract enough to be productive, but close enough that you can predict the machine code, and it can touch memory addresses directly.</p>`,
        `<p>That's why device drivers, operating systems (Linux, Windows, iOS) and microcontroller code are written in C, and why Section 8.6 programs the PIC32 in it.</p>`,
      ]},
      { k: "learn", title: "Hello world, dissected", b: [
        c(`// Write "Hello world!" to the console
#include <stdio.h>
int main(void){
  printf("Hello world!\\n");
}`),
        `<div class="tbl"><table><tbody>
          <tr><td>Header</td><td><code>#include &lt;stdio.h&gt;</code> brings in the standard I/O library, which has printf</td></tr>
          <tr><td>main</td><td>exactly one per program; execution starts here; returns an int status</td></tr>
          <tr><td>Body</td><td>statements, each ending in a semicolon</td></tr></tbody></table></div>`,
        `<p>To run it: <code>gcc hello.c</code> makes <code>a.out</code> (<code>a.exe</code> on Windows); then type <code>./a.out</code>.</p>`,
        seen("The same first program, and how it becomes LC-3 code.", PP + "11-intro-c.html", "Chapter 11"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A project has three .c files and each one has a main function. What happens?", opts: [["It won't link: a program must have exactly one main", true, "The linker finds three definitions of main."], ["All three run in order", false, "Only one main can exist; it's where execution starts."], ["The first file's main is used", false, "C doesn't choose; it's an error."]] },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Compiling, #define and #include", mins: 10,
    blurb: "What the compiler does, named constants instead of magic numbers, and your own header files.",
    takeaway: "Compiler steps: (1) preprocess (include referenced libraries, expand macros), (2) ignore unnecessary information such as comments, (3) translate into the processor's machine language, (4) combine everything into one binary executable; machine language is processor-specific, so a program is compiled for its target. Comments: // to end of line, /* … */ for several lines; ignored by the compiler; a header comment gives file name, author, dates, purpose. #define MAXGUESSES 5: the preprocessor replaces each occurrence before compilation; such globally defined constants are called macros, written in capitals at the top of the file; they remove magic numbers (unnamed constants that cause bugs when changed in one place and not another). C Code Example C.2: #define INCH2CM 2.54, 5.5 inches = 13.970000 cm. Number constants default to decimal; hex prefix 0x, octal prefix 0; 0b binary is not C99 but some compilers accept it (char x = 37; = 0x25; = 045). #include <code>&lt;stdio.h&gt;</code> searches system directories; #include \"myfunctions.h\" searches the C file's own directory (give a relative path for others, e.g. \"other/myFuncs.h\"). Names: case-sensitive, not a reserved word, not starting with a digit, no special characters except underscore.",
    steps: [
      { k: "learn", title: "Four steps", b: [
        `<ol><li><b>Preprocess</b>: paste in #included files, expand #defines.</li><li>Throw away comments.</li><li><b>Translate</b> into the processor's machine language (MIPS in Chapter 6).</li><li>Combine everything into one <b>executable</b>.</li></ol>`,
        `<p>Machine language is processor-specific, so the same C file is compiled separately for each machine.</p>`,
      ]},
      { k: "learn", title: "#define: no magic numbers", b: [
        c(`// Convert inches to centimeters
#include <stdio.h>
#define INCH2CM 2.54

int main(void) {
  float inch = 5.5;   // 5.5 inches
  float cm;
  cm = inch * INCH2CM;
  printf("%f inches = %f cm\\n", inch, cm);
}`),
        `<p>Output: <code>5.500000 inches = 13.970000 cm</code>. A <b>magic number</b> is an unnamed constant buried in code. Change it in one place but not another and you have a bug. A #define gives it one name in one place.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which of these does <b>not</b> set x to 37?", opts: [["<code>char x = 037;</code>", true, "Leading 0 means octal: 3 × 8 + 7 = 31."], ["<code>char x = 0x25;</code>", false, "2 × 16 + 5 = 37."], ["<code>char x = 045;</code>", false, "Octal: 4 × 8 + 5 = 37."]] },
        { t: "mcq", q: "Your header <code>myfile.h</code> is in a folder called <code>othercode</code> next to your C file. Which line finds it?", opts: [["<code>#include \"othercode/myfile.h\"</code>", true, "Quotes search from the C file's directory; add the relative path."], ["<code>#include &lt;myfile.h&gt;</code>", false, "Angle brackets search the system directories."], ["<code>#include \"myfile.h\"</code>", false, "That only looks next to the C file itself."]] },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Variables in memory", mins: 15,
    blurb: "C sees memory as numbered bytes. Each type takes a fixed number of them, and int's size depends on the machine.",
    takeaway: "A variable has a type, name, value and memory location; a declaration states type and name (char x;) and the compiler chooses the location. C views memory as consecutive bytes, each with an address; a multi-byte variable's address is its lowest-numbered byte; the type says how to interpret the bytes. Table C.2 (the book's 32-bit system): char 8 bits (−128…127), unsigned char 0…255, short 16 (−32,768…32,767), unsigned short 0…65,535, long 32 (±2,147,483,648), unsigned long 0…4,294,967,295, long long 64, unsigned long long 64 (the table prints this row as \"unsigned long\" a second time), int and unsigned int machine-dependent (the native word size: 32 bits on MIPS), float 32, double 64. (The double row's range is misprinted as ±2^−1023 to ±2^1022; with an 11-bit exponent and bias 1023, normalized doubles run from 2^−1022 to just under 2^1024.) C Code Example C.3 / Figure C.2: unsigned char x = 42 (00101010) at address 1; short y = −10 (11111111 11110110) at 2–3; unsigned long z = 0 at 4–7. Variable names are case-sensitive. int's machine dependence: a bank balance in cents as an int is fine on a 64-bit PC but overflows past $327.67 on a 16-bit microcontroller. Global variables (outside all functions) are visible everywhere, but break modularity: use sparingly (C Code Example C.4 findMax/printMax with global max); local variables live only inside their function and don't keep values between calls (C.5 getMax returns result, the preferred style). Scope: where a variable can be used. Initialize every variable before reading it: newly reserved memory holds whatever was there (C.4's global max is set by findMax before printMax reads it; the text says getMax).",
    steps: [
      { k: "learn", title: "Memory is numbered bytes", b: [
        `<p>C sees memory as a long row of <b>bytes</b>, each with an address. A variable occupies one or more bytes, and its address is its lowest byte. The type says how many bytes and how to read them.</p>`,
        `<div class="tbl"><table><thead><tr><th>Type</th><th>Bits</th><th>Range</th></tr></thead><tbody>
          <tr><td>char / unsigned char</td><td>8</td><td>−128…127 / 0…255</td></tr>
          <tr><td>short / unsigned short</td><td>16</td><td>−32,768…32,767 / 0…65,535</td></tr>
          <tr><td>long / unsigned long</td><td>32</td><td>±2.1 billion / 0…4.29 billion</td></tr>
          <tr><td>long long</td><td>64</td><td>−2<sup>63</sup>…2<sup>63</sup> − 1</td></tr>
          <tr><td>int / unsigned int</td><td>machine-dependent</td><td>the native word: 32 bits on MIPS</td></tr>
          <tr><td>float / double</td><td>32 / 64</td><td>IEEE single / double</td></tr></tbody></table></div>`,
        `<p class="aside">These are the book's sizes, for a 32-bit system. On 64-bit Linux, for example, long is 64 bits.</p>`,
      ]},
      { k: "play", title: "Figure C.2", b: [
        c(`unsigned char x = 42;  // x = 00101010
short y = -10;         // y = 11111111 11110110
unsigned long z = 0;   // z = 00000000 00000000 00000000 00000000`),
        bytesC3,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "The book's sidebar: a bank stores your balance in cents as an int. Ported to a 16-bit microcontroller, what's the largest balance in dollars it can hold?", a: 327.67, tol: 0.001, unit: "$", why: "A 16-bit int tops out at 2¹⁵ − 1 = 32,767 cents = $327.67. One more cent wraps to a large negative balance." },
      ]},
      { k: "bug", title: "Check the table", b: [
        `<p>Table C.2's last rows read: <code>float 32 ±2<sup>−126</sup> ±2<sup>127</sup></code> and <code>double 64 ±2<sup>−1023</sup> ±2<sup>1022</sup></code>. One row above, “unsigned long 64” appears for the second time.</p>`,
        { t: "mcq", q: "A double has an 11-bit exponent with bias 1023 (Chapter 5). Which is right?", opts: [["Normalized doubles run from about 2<sup>−1022</sup> to just under 2<sup>1024</sup>: the table's double row is off", true, "Exponent codes 1…2046 mean −1022…+1023, and the fraction can push the value almost to 2 × 2¹⁰²³. The repeated “unsigned long 64” should be unsigned long long."], ["The table is right", false, "Work out the smallest and largest unbiased exponents from 11 bits and bias 1023."], ["A double's range is the same as a float's", false, "A double has 11 exponent bits to float's 8."]] },
        seen("IEEE floating point.", PP + "02-bits-data-types.html", "Chapter 2"),
      ]},
      { k: "learn", title: "Global, local, initialized", b: [
        `<p>A <b>global</b> variable (declared outside every function) can be used anywhere, which makes big programs hard to follow. A <b>local</b> variable exists only inside its function, and is created fresh at each call. Prefer locals and pass values in and out (C Code Example C.5).</p>`,
        `<p>Declaring a variable reserves its bytes, but they still hold whatever was there before. <b>Initialize before you read.</b></p>`,
        `<p class="aside">A small slip: the text says the global max in C.4 is set “by the getMax function”. In C.4 the function is findMax; getMax is C.5's local-variable version.</p>`,
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Operators", mins: 15,
    blurb: "Table C.3 by precedence, the book's operator examples in hex and binary, and what counts as TRUE.",
    takeaway: "Table C.3 lists operators by decreasing precedence, by category: unary (post ++/−−, & address, ~ bitwise NOT, ! Boolean NOT, − negation, pre ++/−−, (type) cast, sizeof: sizeof(long int y) = 4), multiplicative (* / %; 9 / 3 = 3, 5 % 2 = 1), additive, bitwise shift (5 << 2 = 0b10100, 9 >> 3 = 1), relational (== != < > <= >=), bitwise (& ^ |), logical (&& ||), ternary ?:, assignment (= += −= *= /= %= >>= <<= &= |= ^=). Within the same category, operators are evaluated in the order they appear. Unary operators have one operand, ternary three, the rest two. C Code Example C.6: y = (a > b) ? a : b; is the same as an if/else. TRUE = nonzero, FALSE = zero; relational and logical operators produce 1 or 0. C Code Example C.7: 44 / 14 = 3 (truncates), 44 % 14 = 2, 0x2C && 0xE = 1, 0x2C || 0xE = 1, 0x2C & 0xE = 0xC, 0x2C | 0xE = 0x2E, 0x2C ^ 0xE = 0x22, 0xE << 2 = 0x38, 0x2C >> 3 = 0x5; x = 14; x += 2 → 16; y = 0x2C; y &= 0xF → 0xC; x = 14, y = 44: y = y + x++ → x = 15, y = 58; y = y + ++x → x = 15, y = 59.",
    steps: [
      { k: "learn", title: "Table C.3 in brief", b: [
        `<div class="tbl"><table><thead><tr><th>Category (high → low)</th><th>Operators</th></tr></thead><tbody>
          <tr><td>Unary</td><td><code>++ -- &amp; ~ ! - (type) sizeof()</code></td></tr>
          <tr><td>Multiplicative, additive</td><td><code>* / %</code>, then <code>+ -</code></td></tr>
          <tr><td>Shift, relational</td><td><code>&lt;&lt; &gt;&gt;</code>, then <code>== != &lt; &gt; &lt;= &gt;=</code></td></tr>
          <tr><td>Bitwise, logical</td><td><code>&amp; ^ |</code>, then <code>&amp;&amp; ||</code></td></tr>
          <tr><td>Ternary, assignment</td><td><code>?:</code>, then <code>= += -= …</code></td></tr></tbody></table></div>`,
        `<p><b>TRUE is any nonzero value; FALSE is zero.</b> Relational and logical operators always produce 1 or 0.</p>`,
        `<p class="aside">This table is coarser than Patt & Patel's Table D.4: it lumps == with &lt; and & with ^ and |. For real precedence questions, use D.4 or parentheses.</p>`,
      ]},
      { k: "play", title: "Code Example C.7", b: [
        c7,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is <code>0x2C &amp;&amp; 0xE</code> equal to 1 when <code>0x2C &amp; 0xE</code> is 0xC?", opts: [["&& only asks whether both are nonzero (TRUE) and answers 1; & combines the bits", true, "Logical vs bitwise: one answer per operand, or one per bit."], ["&& rounds the result to 1 bit", false, "It never looks at individual bits."], ["They differ because of precedence", false, "There's only one operator in each."]] },
        { t: "num", q: "<code>x = 3; y = 10; y = y + ++x;</code> What is y?", a: 14, tol: 0, why: "++x makes x 4 first, then y = 10 + 4. With x++ instead, y would be 13 and x would still end at 4." },
      ]},
      { k: "learn", title: "The ternary operator", b: [
        c(`y = (a > b) ? a : b;   // parentheses not necessary, but clearer

if (a > b) y = a;      // the same thing, longer
else       y = b;`),
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Functions and control flow", mins: 15,
    blurb: "Functions and prototypes, then if, switch, while, do/while and for: including a switch without break and a loop test written with &.",
    takeaway: "Functions (C.6): return type, name, inputs in parentheses, body in braces; return gives the single output (int sum3(int a, int b, int c); y = sum3(10, 15, 17) → 42). void before the name: returns nothing; void (or nothing) in the parentheses: no inputs. A function must be declared before it is called: define it earlier in the file, or put a prototype (its first line plus ;) near the top or in a header; prototypes are unavoidable when f1 calls f2 and f2 calls f1. C Code Example C.10 prints \"sum3 result: 45\". main returns int: 0 for normal completion, nonzero for an error; reaching the end of main returns 0. Names: case-sensitive, verbs for functions; camelCase or underscores, consistently. Control flow (C.7): if, if/else, switch/case (execution continues at the matching case until break; without break it falls through to the cases below; default if none match; C.13 vs nested if/else C.14), while (test first; C.15 computes 9! = 362,880), do/while (body first, condition after, then a semicolon; C.16 guessing game), for (initialization; condition; loop operation), equivalent to a while with the loop operation at the end of the body. C.16's condition uses & where && is meant: it works only because both sides are already 0 or 1.",
    steps: [
      { k: "learn", title: "Functions and prototypes", b: [
        c(`#include <stdio.h>

// function prototypes
int sum3(int a, int b, int c);
void printPrompt(void);

int main(void)
{
  int y = sum3(10, 15, 20);
  printf("sum3 result: %d\\n", y);
  printPrompt();
}

int sum3(int a, int b, int c) {
  int result = a+b+c;
  return result;
}`),
        `<p>A function must be <b>declared</b> before it's called. Here the bodies come after main, so the prototypes at the top tell the compiler their types. main returns an int to the operating system: 0 means success.</p>`,
        seen("How a function call works on the run-time stack.", PP + "14-functions.html", "Chapter 14"),
      ]},
      { k: "predict", title: "A switch without break", b: [
        c(`char x = 'd';
switch (x) {
  case 'u': direction = 1;
  case 'd': direction = 2;
  case 'l': direction = 3;
  case 'r': direction = 4;
  default:  direction = 0;
}`),
        `<p>What is direction afterwards?</p>`,
        { t: "reveal", label: "Show me", html: `<p><b>0.</b> Execution jumps to case 'd', sets 2, then <b>falls through</b> every case below it: 3, 4, then 0. Each case needs a <code>break;</code> to stop (C Code Mistake C.8).</p>` },
      ]},
      { k: "learn", title: "Loops", b: [
        c(`// Compute 9!
int i;
int fact = 1;
for (i=1; i<10; i++)
  fact *= i;`),
        `<p><b>while</b> tests first. <b>do/while</b> runs the body once before testing, and ends with a semicolon. <b>for</b> packs initialization, condition and loop operation into one line.</p>`,
        seen("Each loop compiled to LC-3.", PP + "13-control-structures.html", "Chapter 13"),
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>C Code Example C.16's loop condition:</p>`,
        c(`} while ( (numGuesses < MAXGUESSES) & (guess != CORRECTNUM) );`),
        { t: "mcq", q: "It works. What's still wrong with it?", opts: [["It uses bitwise & where logical && is meant; it works only because both sides happen to be exactly 0 or 1", true, "With values like 2 and 1, 2 & 1 is 0 (FALSE) even though both are TRUE. && also stops early when the left side is FALSE. The book's own Mistake C.7 warns about mixing these up."], ["The parentheses are wrong", false, "They're fine."], ["do/while can't have two conditions", false, "Any expression is allowed."]] },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Pointers, arrays and strings in memory", mins: 20,
    blurb: "Watch C Code Example C.18 fill memory byte by byte, then arrays and \"Hello!\" laid out the same way.",
    takeaway: "Pointers (C.8.1): a pointer is the address of a variable. int *ptr declares a pointer to int; * dereferences (the value at the address); & gives the address of a variable. C Code Example C.18 on a 32-bit system: salary1 at 0x70–73, salary2 at 0x74–77, ptr at 0x78–7B; salary1 = 67500 (0x000107AC); ptr = &salary1 = 0x70; salary2 = *ptr + 1000 = 68500 (0x00010B94); Figure C.3(b) shows it byte by byte, little-endian (0x70 holds 0xAC). Dereferencing a nonexistent or out-of-range address usually crashes the program (segmentation fault). Pass by reference: void quadruple(int *a) { *a = *a * 4; } called as quadruple(&x) turns x = 5 into 20. NULL is the pointer to address 0, pointing at nothing. Arrays (C.8.2): elements 0 to N−1 at consecutive addresses; long scores[3] takes 12 bytes, at 0x40, 0x44, 0x48; initialize with {93, 81, 97} only at declaration, or element by element (often in a for loop); no bounds checking. An array passed to a function is just the address of its first element (int arr[] ≡ int *arr; the declared length is ignored), so the function can change the caller's array (C.25 sort); multi-dimensional arrays as arguments must give all but the first dimension (int arr[][8]). Arrays can't be copied or compared with = or ==. (The book calls the array variable \"a pointer to the 1st element\": it converts to one in most expressions, but sizeof(scores) is the whole 12 bytes.) Characters (C.8.3): 8-bit, a number or an ASCII code; 'A' + 3 = 0x44 = 'D'; Table C.4 \\r 0x0D, \\n 0x0A, \\t 0x09, \\0 0x00, \\\\ 0x5C, \\\" 0x22, \\' 0x27, \\a 0x07; Windows ends lines with \\r\\n, UNIX with \\n. Strings (C.8.4): char arrays ending with the null terminator 0x00 (Pascal's P-strings store the length in a prefix byte instead, limited to 255); char greeting[10] = \"Hello!\"; uses 7 of the 10 bytes (0x48 0x65 0x6C 0x6C 0x6F 0x21 0x00 at 0x50–0x56); char *greeting = \"Hello!\"; points to a 7-element array; print with %s; copy element by element (C.30 strcpy with do { dst[i] = src[i]; } while (src[i++]);), and dst must be big enough.",
    steps: [
      { k: "play", title: "C Code Example C.18", b: [
        (host) => stepper(host, { code: C18, frames: c18frames }),
      ]},
      { k: "play", title: "The same, byte by byte", b: [
        `<p>Figure C.3(b): each int is four bytes, least significant byte at the lowest address (little-endian).</p>`,
        bytesC18,
        `<p>Dereferencing an address your program doesn't own usually crashes it: a <b>segmentation fault</b>.</p>`,
      ]},
      { k: "learn", title: "Pass by reference", b: [
        c(`void quadruple(int *a)
{
  *a = *a * 4;
}
...
int x = 5;
quadruple(&x);    // x is now 20`),
        `<p>A function can't change its inputs, but it can change what an input <i>points to</i>. <code>NULL</code> is a pointer to address 0, meaning “points at nothing”.</p>`,
        seen("Pointers and pass by reference.", PP + "16-pointers-arrays.html", "Chapter 16"),
      ]},
      { k: "learn", title: "Arrays", b: [
        c(`long scores[3] = {93, 81, 97};   // 3 × 4 = 12 bytes, at 0x40, 0x44, 0x48`),
        `<ul><li>Braces only at declaration; later, assign element by element.</li><li>No bounds checking: writing past the end compiles fine and tramples other data.</li><li>Passed to a function, an array is just the address of element 0, so the function can change the caller's array. <code>int arr[]</code> and <code>int *arr</code> mean the same parameter.</li><li><code>=</code> and <code>==</code> don't copy or compare whole arrays.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The book says “the array variable, in this case scores, is a pointer to the 1st element.” With <code>long scores[3]</code> on this 32-bit system, what is <code>sizeof(scores)</code>?", opts: [["12: the whole array. An array isn't a pointer; it converts to a pointer to element 0 in most expressions", true, "That conversion is why passing it to a function passes an address. But sizeof (and &) see the real array. Patt & Patel's Appendix D says the same: sizeof(list) is 45 × sizeof(int)."], ["4: the size of a pointer", false, "That's what you'd get inside a function that received it as a parameter."], ["3: the number of elements", false, "sizeof counts bytes."]] },
      ]},
      { k: "learn", title: "Characters and strings", b: [
        `<p>A char is 8 bits: a small number or an ASCII code. <code>'A' + 3</code> is 0x44, which is <code>'D'</code>. Table C.4's special characters: \\n 0x0A, \\r 0x0D, \\t 0x09, \\0 0x00, \\\\ 0x5C, \\" 0x22, \\' 0x27, \\a 0x07.</p>`,
        c(`char greeting[10] = "Hello!";   // 0x50: 48 65 6C 6C 6F 21 00, then 3 unused bytes`),
        `<p>A C string ends with the <b>null terminator</b> 0x00, so its length can be anything, but finding the length means scanning for the zero. (Pascal's P-strings store the length in a first byte instead.)</p>`,
        { t: "num", q: "How many bytes of greeting does \"Hello!\" actually use?", a: 7, tol: 0, why: "Six characters plus the null terminator. The other three of the ten are untouched." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Structures, dynamic memory, linked lists", mins: 15,
    blurb: "struct contact, typedef, malloc and free, and the book's linked list of user accounts, one call at a time.",
    takeaway: "Structures (C.8.5): struct name { type1 element1; … }; C Code Example C.31 struct contact { char name[30]; int phone; float height; }; struct contact c1; strcpy(c1.name, \"Ben Bitdiddle\"); c1.phone = 7226993; c1.height = 1.82;. Arrays of structures (struct contact classlist[200]; classlist[0].phone = 9642025;) and pointers to them: cptr = &classlist[42]; cptr->height = 1.9; (same as (*cptr).height). Passing by value copies the whole structure (slow for big ones); passing a pointer (by reference) is cheaper and lets the function change it (C.34 stretchByValue vs stretchByReference; the heading says \"by name\", meaning by reference). typedef (C.8.6): typedef struct contact {…} contact; contact c1;; typedef unsigned char byte; typedef char bool; with #define TRUE 1, FALSE 0; typedef double vector[3]; typedef double matrix[3][3];. Dynamic allocation (C.8.7): malloc from stdlib.h returns a pointer to a block of the requested bytes, or NULL if memory runs out: short *data = malloc(10*sizeof(short)); (20 bytes). C.38 reads len, nums = malloc(len*sizeof(int)), checks for NULL, reads the numbers, prints getMean, then free(nums). Forgetting to free is a memory leak. Linked lists (C.8.8): each element is a structure with data and a link to the next; the first is the head. C.39 userL { uname[80], passwd[80], uid, admin, struct userL *next }; global userL *users = NULL; insertUser mallocs a node, copies fields, links it at the head; deleteUser scans with cur and prev, unlinks (users = cur->next if it was the head, else prev->next = cur->next) and frees; findUser returns a pointer or NULL; numUsers counts.",
    steps: [
      { k: "learn", title: "Structures", b: [
        c(`struct contact {
  char name[30];
  int phone;
  float height;   // in meters
};
struct contact c1;
strcpy(c1.name, "Ben Bitdiddle");
c1.phone = 7226993;

struct contact classlist[200];
struct contact *cptr = &classlist[42];
cptr->height = 1.9;   // same as (*cptr).height = 1.9;`),
        `<p>Passing a structure by value copies every byte of it. Passing a pointer is cheaper, and lets the function change the original.</p>`,
      ]},
      { k: "learn", title: "typedef", b: [
        c(`typedef struct contact {
  char name[30];
  int phone;
  float height;
} contact;            // "contact" now means "struct contact"

typedef unsigned char byte;
typedef double vector[3];`),
      ]},
      { k: "learn", title: "malloc and free", b: [
        c(`short *data = malloc(10*sizeof(short));   // 20 bytes
...
nums = malloc(len*sizeof(int));
if (nums == NULL) printf("ERROR: out of memory.\\n");
...
free(nums);`),
        `<p>Use sizeof, never a guessed byte count. Check for NULL. Every malloc needs a free, or the program has a <b>memory leak</b>.</p>`,
        seen("The heap, malloc and free.", PP + "19-dynamic-data.html", "Chapter 19"),
      ]},
      { k: "play", title: "The user list (C Code Example C.39)", b: [
        `<p>Seven calls on the book's list functions. Step through and watch <code>users</code>:</p>`,
        (host) => stepper(host, { code: LL, frames: llFrames }),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "deleteUser keeps a <code>prev</code> pointer as it scans. Why?", opts: [["To unlink the node, the one before it must be changed to point past it", true, "prev->next = cur->next. If there is no previous node (prev == NULL), the head pointer users changes instead."], ["To free the previous node too", false, "Only cur is freed."], ["So it can scan the list backwards", false, "The list only links forward."]] },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "The standard libraries", mins: 20,
    blurb: "printf widths, scanf, files, random numbers, conversions and math, plus two library examples that don't do quite what they claim.",
    takeaway: "Libraries (C.9): each has a header (declarations, types, prototypes) and a precompiled object file linked in, which saves compile time. Table C.5: stdio.h (printf, fprintf, scanf, fscanf, fopen, fclose), stdlib.h (rand, srand, malloc, free, exit, atoi, atol, atof), math.h (sin, cos, asin, acos, sqrt, log, log10, exp, floor, ceil), string.h (compare, copy, concatenate, length). printf format codes (Table C.6): %d, %u, %x, %o, %f (float or double), %e (scientific), %c, %s; floats print 6 decimals by default; %w.df sets minimum width w (the point counts) and d decimals; too wide → width ignored, decimals kept (C.41: pi %4.2f → 3.14, e %8.3f → \"   2.718\", c %5.3f → 299800000.000); %% prints %, \\\\ prints \\. scanf waits for input and needs pointers (&a; a string array str needs no &). Files: FILE *fptr = fopen(name, mode) with \"w\" (overwrite), \"r\", \"a\" (append, create if missing); NULL on failure; fprintf/fscanf like printf/scanf with the file pointer; fclose writes everything out and frees resources; feof tests for end of file. (C.44 calls fopen twice, once leftover before the if; C.45's while (!feof(fptr)) loop prints the last number twice if the file ends with a newline, because feof only turns true after a read fails; the reliable test is while (fscanf(fptr, \"%d\", &data) == 1).) sprintf/sscanf print to and read from strings; fgetc reads a character, fgets a line. stdlib: rand() pseudo-random (same sequence each run), rand() % 10 gives 0–9; srand(time(NULL)) seeds from the time (seconds since 1 Jan 1970 UTC; 32-bit UNIX clocks overflow in 2038); exit(status) ends the program early (0 = normal); atoi(\"42\"), atol(\"833\"), atof(\"3.822\"). math.h works in radians: cos(0) = 1, 2*acos(0) = π, sqrt(144) = 12, exp(2) = 7.389056, log(7.389056) = 2, log10(1000) = 3, floor(178.567) = 178, pow(2, 10) = 1024. string.h: strcpy(dst, src), strcat(dst, src), strcmp(s1, s2) (0 if equal), strlen(str) (not counting the null).",
    steps: [
      { k: "learn", title: "Four libraries", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>stdio.h</code></td><td>printf, scanf; files: fopen, fprintf, fscanf, fclose</td></tr>
          <tr><td><code>stdlib.h</code></td><td>rand, srand, malloc, free, exit, atoi, atol, atof</td></tr>
          <tr><td><code>math.h</code></td><td>sin, cos, sqrt, log, log10, exp, floor, ceil, pow (radians)</td></tr>
          <tr><td><code>string.h</code></td><td>strcpy, strcat, strcmp, strlen</td></tr></tbody></table></div>`,
        `<p>Each has a header (the prototypes) and an already-compiled object file that the compiler links in.</p>`,
      ]},
      { k: "play", title: "printf widths", b: [
        `<p>The book's C.41: <code>%w.df</code> asks for at least w characters, d of them after the point.</p>`,
        printfW,
      ]},
      { k: "learn", title: "scanf and files", b: [
        c(`scanf("%d", &a);     // needs the address of a
scanf("%s", str);    // str is already an address: no &

FILE *fptr;
if ((fptr = fopen("result.txt", "w")) == NULL) {
  printf("Unable to open result.txt for writing.\\n");
  exit(1);
}
fprintf(fptr, "Testing file write.\\n");
fclose(fptr);`),
        `<p>Modes: <code>"w"</code> overwrites, <code>"r"</code> reads, <code>"a"</code> appends (creating the file if needed).</p>`,
        `<p class="aside">The book's C.44 also has a line <code>fptr = fopen("result.txt", "w");</code> just before this <code>if</code>, so it opens the file twice and loses the first handle. Delete that line.</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        c(`while (!feof(fptr)) {  // check that the end of the file hasn't been reached
  fscanf(fptr, "%d", &data);
  printf("Read data: %d\\n", data);
}`),
        `<p>The book shows data.txt holding <code>25 32 14 89</code> and the output reading each number once. Most text files, though, end with a newline.</p>`,
        { t: "mcq", q: "If data.txt ends with a newline after 89, what does this loop print last?", opts: [["“Read data: 89” twice", true, "After 89 is read, only the newline is left, so feof is still false. The next fscanf fails and leaves data unchanged, and the loop prints 89 again. feof only turns true after a read hits the end. Test the read itself: while (fscanf(fptr, \"%d\", &data) == 1)."], ["“Read data: 89” once, as in the book", false, "That only happens when 89 is the very last byte of the file."], ["Nothing: it stops at the newline", false, "fscanf skips white space, so the newline doesn't stop it."]] },
      ]},
      { k: "learn", title: "stdlib and math", b: [
        c(`y = rand() % 10;      // a "random" number from 0 to 9
srand(time(NULL));    // seed from the clock: different each run
x = atoi("42");       // ASCII string to int
g = floor(178.567);   // 178
h = pow(2, 10);       // 1024`),
        `<p>Without srand, rand gives the same sequence every run. time counts seconds from 1 January 1970, and 32-bit UNIX clocks overflow in 2038.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "<code>printf(\"%5.1f\", 3.14159);</code> prints what (· = space)?", opts: [["··3.1", true, "One decimal: 3.1 is 3 characters, padded to 5."], ["3.14159", false, "%5.1f rounds to one decimal."], ["3.1··", false, "Padding goes on the left."]] },
        { t: "mcq", q: "What does <code>strlen(\"Hello!\")</code> return?", opts: [["6", true, "The null terminator isn't counted."], ["7", false, "That's the bytes the string occupies."], ["10", false, "That was the array size in C.28, not the string's length."]] },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Compiling for real, and common mistakes", mins: 15,
    blurb: "Several files, compiler options, command-line arguments, and the book's gallery of eighteen classic C mistakes.",
    takeaway: "Multiple files: gcc main.c file2.c file3.c (exactly one main, conventionally in main.c). Table C.7 options: -o outfile (gcc -o hello hello.c), -S (assembly output hello.s), -v (verbose), -Olevel (optimization 0–3, e.g. -O3), --version, --help, -Wall (all warnings). Command-line arguments: int main(int argc, char *argv[]); argc counts the words on the command line including the program name; ./testargs arg1 25 lastarg! gives argc = 4 and argv = {\"./testargs\", \"arg1\", \"25\", \"lastarg!\"}; numeric arguments arrive as strings (convert with atoi). Debugging hints: fix the first compiler error first and recompile; when a valid line is flagged, look above it (missing ; or brace); split complicated statements; print intermediate results; debug from the first point results deviate; read every warning. Common mistakes (C.11): C.1 missing & in scanf; C.2 = instead of == (always TRUE for nonzero); C.3 indexing past the last element (array[10] of int array[10]); C.4 = in #define (NUM becomes \"= 4\"); C.5 uninitialized variable; C.6 user header without its path; C.7 logical (!, ||, &&) instead of bitwise (~, |, &): !5 = 0 but ~5 = 0b11111010, 5||2 = 1 but 5|2 = 7, 5&&2 = 1 but 5&2 = 0 (the corrected column labels 5&2 \"logical AND\"; it's bitwise); C.8 missing break in switch; C.9 missing braces (exit always runs); C.10 calling a function before it's declared; C.11 a local and a global with the same name; C.12 initializing an array with {} after declaration; C.13 assigning one array to another; C.14 missing ; after do/while; C.15 commas instead of semicolons in for; C.16 integer division (9 / 4 = 2; 9.0 / 4 = 2.25); C.17 writing through an uninitialized pointer (int *y = 77;); C.18 writing a whole program before testing anything, or having no expected results to test against. Microcontrollers (Section 8.6) are usually programmed in C: almost assembly's control, far more succinct.",
    steps: [
      { k: "learn", title: "gcc for real projects", b: [
        c(`gcc main.c file2.c file3.c     // several files, one main
gcc -o hello hello.c           // name the executable
gcc -S hello.c                 // stop at assembly: hello.s
gcc -O3 hello.c                // optimize hard
gcc -Wall hello.c              // print all warnings`),
        `<p><code>-S</code> is worth trying: it shows the assembly your C turns into, the bridge to Chapter 6.</p>`,
      ]},
      { k: "learn", title: "Command-line arguments", b: [
        c(`int main(int argc, char *argv[])
{
  int i;
  for (i=0; i<argc; i++)
    printf("argv[%d] = %s\\n", i, argv[i]);
}`),
        { t: "num", q: "The program is run as <code>./testargs arg1 25 lastarg!</code>. What is argc?", a: 4, tol: 0, why: "The program's own name counts: argv = {\"./testargs\", \"arg1\", \"25\", \"lastarg!\"}. And \"25\" arrives as a string; use atoi to get the number." },
      ]},
      { k: "check", title: "Which ones compile?", b: [
        `<p>Section C.11 lists eighteen classic mistakes. Here are eight of them.</p>`,
        { t: "sort", q: "For each mistake from Section C.11: does the compiler stop you, or does the program compile and misbehave?", bins: ["Won't compile", "Compiles, then misbehaves"], items: [
          ["<code>if (x = 1)</code>", 1, "Legal C: assigns 1, which is TRUE, every time. -Wall warns."],
          ["<code>scanf(\"%d\", a);</code>", 1, "Compiles (maybe with a warning); scanf writes to whatever address a's garbage value names."],
          ["<code>int scores[3]; scores = {93, 81, 97};</code>", 0, "Braces only work at declaration."],
          ["<code>float x = 9 / 4;</code>", 1, "Integer division gives 2, then 2.0. Write 9.0 / 4."],
          ["<code>for (i=0, i &lt; 200, i++)</code>", 0, "A for needs two semicolons."],
          ["<code>array[10] = 42;</code> with <code>int array[10];</code>", 1, "No bounds check: it silently overwrites whatever follows."],
          ["<code>} while (num &lt; 100)</code> with no semicolon", 0, "do/while must end with ;."],
          ["<code>if (ptr == NULL)</code> followed by two indented lines and no braces", 1, "Only the first line is inside the if; the exit runs every time."],
        ]},
      ]},
      { k: "bug", title: "Check the corrected code", b: [
        `<p>Mistake C.7's “corrected” column:</p>`,
        c(`char x=~5;  // bitwise NOT: x = 0b11111010
char y=5|2; // bitwise OR:  y = 0b00000111
char z=5&2; // logical AND: z = 0b00000000`),
        { t: "mcq", q: "One comment is mislabelled. Which?", opts: [["The last: 5&2 is a bitwise AND", true, "101 & 010 = 000. Logical AND (5&&2) would give 1. The whole point of the mistake is this distinction, so the label matters."], ["The first: ~5 is logical NOT", false, "~ is bitwise; ! is logical."], ["None: all three are right", false, "Read the third comment again."]] },
      ]},
      { k: "why", title: "Great expectations", b: [
        `<p>The book's last mistake, C.18, isn't about syntax. Writing a whole program before testing any of it makes debugging exponentially harder. And running it without knowing what the right answer is only proves it produces <i>an</i> answer.</p>`,
        { t: "say", q: "Before you run a new function, what should you already have written down, and why?", model: "A few inputs together with the outputs I expect for them, including edge cases, worked out independently. Without expected results I can only see that the code produces something, not that it's correct. Testing each function this way as I write it keeps bugs small and local instead of tangled up in a whole program." },
        seen("Testing and debugging, systematically.", PP + "15-testing-debugging.html", "Chapter 15"),
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hhC", eyebrow: "Harris & Harris · Appendix C", title: "C Programming",
    intro: `<p>Nine parts: why C, compiling and #define, variables as bytes in memory, operators, functions and control flow, pointers, arrays and strings in memory, structures and linked lists, the standard libraries, and compiling for real with the book's common mistakes.</p><p>If you've done Patt & Patel 11–20, much of this is review: those parts move fast and link back. The new material is the hardware view (bytes, addresses, little-endian), the libraries, and the bug gallery. Arrow keys ← → move between steps.</p>`,
    after: `<p>This appendix has no exercises. The real test is writing and running C: install gcc (or use any online C compiler), type in a few of the book's code examples, and change them. Try <code>gcc -S</code> on one and read the assembly next to Chapter 6.</p><p>Stuck on a C program? Tell Claude what you expected and what happened. You'll get a guiding question first.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Basics</h3>
      <p>One main; #include &lt;lib.h&gt; vs "mine.h"; #define names constants; gcc hello.c → a.out. Memory is bytes; char 8, short 16, long 32, long long 64 bits; int is the machine's word. Prefer locals; initialize before reading.</p>
      <h3>Expressions and control</h3>
      <p>TRUE = nonzero; logical (&& || !) vs bitwise (& | ~); x++ vs ++x; ?:. Declare (or prototype) before calling. switch needs break; do/while ends with ;.</p>
      <h3>Data</h3>
      <p>Pointers: &, *, NULL, pass by reference. Arrays: no bounds check, passed as an address, not assignable. Strings end in 0x00. struct, ->, typedef. malloc (check NULL) and free. Linked lists: head pointer, prev/cur to delete.</p>
      <h3>Libraries and tools</h3>
      <p>printf %w.df, scanf with &; fopen/fprintf/fscanf/fclose (test the read, not feof); rand/srand; atoi; math in radians; strcpy, strcat, strcmp, strlen. gcc -o -S -O3 -Wall; argc/argv.</p>`,
  };
  Course.start(window.CHAPTER);
})();

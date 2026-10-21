(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { code, trace, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const lc3 = (t) => Digital.listing(t, { comment: ";" });
  const field = "font:inherit;font-family:var(--mono);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink)";

  /* ---------- Figure 14.1 ---------- */
  const FIG141 = `#include <stdio.h>

void PrintBanner(); // Function declaration

int main(void)
{
   PrintBanner(); // Function call
   printf("A simple C program.\\n");
   PrintBanner();
}

void PrintBanner() // Function definition
{
   printf("============================\\n");
}`;
  const BAN = "============================\n";
  const bannerTrace = (host) => trace(host, { code: FIG141, console: true, stateTitle: "Running in", frames: [
    { l: 7, v: [["function", "main"]], out: "", note: "main calls PrintBanner: control jumps to the definition." },
    { l: 14, v: [["function", "PrintBanner (called from line 7)"]], out: BAN },
    { l: 15, v: [["function", "PrintBanner"]], out: BAN, note: "End of a void function: control returns to the caller, just after the call." },
    { l: 8, v: [["function", "main"]], out: BAN + "A simple C program.\n" },
    { l: 9, v: [["function", "main"]], out: BAN + "A simple C program.\n", note: "The same function, called from a second place." },
    { l: 14, v: [["function", "PrintBanner (called from line 9)"]], out: BAN + "A simple C program.\n" + BAN },
    { l: 10, v: [["function", "main"]], out: BAN + "A simple C program.\n" + BAN, note: "main ends, so the program ends." },
  ] });

  /* ---------- Figure 14.2 ---------- */
  const FIG142 = `#include <stdio.h>

int Factorial(int n);      // Function Declaration

int main(void)             // Definition for main
{
   int number;             // Number from user
   int answer;             // Answer of factorial

   printf("Input a number: ");   // Call to printf

   scanf("%d", &number);         // Call to scanf

   answer = Factorial(number);   // Call to factorial

   printf("The factorial of %d is %d\\n", number, answer);
}

int Factorial(int n)       // Function Definition
{
   int result = 1;         // Initialized result

   for (int i = 1; i <= n; i++)  // Calculate factorial
      result = result * i;

   return result;          // Return to caller
}`;
  function anatomy(host) {
    const P = [
      ["Declaration", [3], "Also called the <b>prototype</b>: return type, name, and the types (optionally names) of the parameters, ending in a semicolon. It lets the compiler check every call before it has seen the definition."],
      ["Call", [14], "main calls Factorial with the <b>argument</b> number. The value of the call expression is the returned value, which is assigned to answer."],
      ["Definition", [19, 20, 21, 22, 23, 24, 25, 26, 27], "The first line matches the declaration (minus the semicolon). <code>int n</code> is the <b>formal parameter</b>: a local variable initialized with the argument's value. The body's variables (result, i) are local to Factorial."],
      ["Return", [26], "<code>return result;</code> sends the value back to the caller. Its type must match the declared return type, int."],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => { out.innerHTML = code(FIG142, { hl: P[i][1] }) + `<p>${P[i][2]}</p>`; };
    host.append(toggle(P.map((p) => p[0]), draw, 0), out); draw(0);
  }
  function factFrames() {
    const f = [{ l: 14, v: [["main: number", 4], ["main: answer", "?"]], note: "You typed 4. main calls Factorial(number): the <b>value</b> 4 is copied into the parameter n." }];
    let result = 1;
    f.push({ l: 21, v: [["main: number", 4], ["main: answer", "?"], ["Factorial: n", 4], ["Factorial: result", 1]], note: "Factorial's own variables. It can't see number or answer." });
    for (let i = 1; i <= 4; i++) { result *= i; f.push({ l: 24, v: [["main: number", 4], ["main: answer", "?"], ["Factorial: n", 4], ["Factorial: i", i], ["Factorial: result", result]] }); }
    f.push({ l: 26, v: [["main: number", 4], ["main: answer", "?"], ["Factorial: result", 24]], note: "return result: 24 goes back to the caller, and Factorial's variables are gone." });
    f.push({ l: 16, v: [["main: number", 4], ["main: answer", 24]], out: "The factorial of 4 is 24\n" });
    return f;
  }
  const factTrace = (host) => trace(host, { code: FIG142, frames: factFrames() });

  /* ---------- Figure 14.3 ---------- */
  function ring(host) {
    let inner = 2, outer = 5;
    const A = (r) => 3.14159265 * r * r;
    const out = el(`<div></div>`);
    const draw = () => {
      const R = 110, sc = R / 10;
      const s = `<circle cx="130" cy="125" r="${outer * sc}" style="fill:var(--accent-soft);stroke:var(--ink)"/><circle cx="130" cy="125" r="${Math.min(inner, outer) * sc}" style="fill:var(--paper);stroke:var(--ink)"/>`;
      out.innerHTML = fig(S.svg(260, 250, s, { max: 260, label: "A ring: outer circle minus inner circle" })) +
        readout([["AreaOfCircle(outer)", A(outer).toFixed(4)], ["AreaOfCircle(inner)", A(inner).toFixed(4)], ["areaOfRing", (A(outer) - A(inner)).toFixed(4)]]);
    };
    host.append(slider({ id: "pp14i", label: "inner radius", min: 0, max: 10, step: 0.5, value: inner, show: (x) => x.toFixed(1) }, (x) => { inner = x; draw(); }).el,
      slider({ id: "pp14o", label: "outer radius", min: 0, max: 10, step: 0.5, value: outer, show: (x) => x.toFixed(1) }, (x) => { outer = x; draw(); }).el, out); draw();
  }

  /* ---------- Figure 14.5: stack snapshots ---------- */
  const SNAP = [["(a) start", ["main"]], ["(b) main calls Watt", ["main", "Watt"]], ["(c) Watt calls Volt", ["main", "Watt", "Volt"]], ["(d) Volt returns", ["main", "Watt"]], ["(e) Watt returns", ["main"]], ["(f) main calls Volt", ["main", "Volt"]]];
  const FCOL = { main: "var(--cool-soft)", Watt: "var(--accent-soft)", Volt: "var(--good-soft)" };
  function snapshots(host) {
    const out = el(`<div></div>`);
    const draw = (i) => {
      const fr = SNAP[i][1]; let s = S.t(150, 16, "x0000 (top of memory map)", { cls: "lab" }), y = 250;
      fr.forEach((f, k) => {
        y -= 56; s += `<rect x="80" y="${y}" width="140" height="52" style="fill:${FCOL[f]};stroke:var(--ink)"/>` + S.t(150, y + 31, f + "'s frame");
        if (k === fr.length - 1) s += S.arrow(290, y + 6, 224, y + 6, "") + S.t(296, y + 10, "R6 (top)", { a: "start" }) + S.arrow(290, y + 30, 224, y + 30, "") + S.t(296, y + 34, "R5 (frame)", { a: "start" });
      });
      s += S.t(150, 270, "xFFFF (bottom of the stack)", { cls: "lab" });
      out.innerHTML = fig(S.svg(400, 280, s, { max: 400, label: "Run-time stack snapshot" }));
    };
    host.append(toggle(SNAP.map((x) => x[0]), draw, 0), out); draw(0);
  }

  /* ---------- Figures 14.6–14.8: w = Volt(w, 10) ---------- */
  const CALL = `Watt:  ...
       AND R0, R0, #0    ; R0 <- 10
       ADD R0, R0, #10
       ADD R6, R6, #-1   ; push 10
       STR R0, R6, #0
       LDR R0, R5, #0    ; load w
       ADD R6, R6, #-1   ; push w
       STR R0, R6, #0
       JSR Volt
       LDR R0, R6, #0    ; load the return value
       STR R0, R5, #0    ; w = Volt(w, 10);
       ADD R6, R6, #3    ; pop return value and arguments
       ...
Volt:  ADD R6, R6, #-1   ; allocate spot for the return value
       ADD R6, R6, #-1   ; push R7 (return address)
       STR R7, R6, #0
       ADD R6, R6, #-1   ; push R5 (caller's frame pointer)
       STR R5, R6, #0
       ADD R5, R6, #-1   ; set frame pointer for Volt
       ADD R6, R6, #-2   ; allocate Volt's local variables
       ...               ; Volt performs its work
       LDR R0, R5, #0    ; load local variable k
       STR R0, R5, #3    ; write it in the return value slot (R5 + 3)
       ADD R6, R5, #1    ; pop local variables
       LDR R5, R6, #0    ; pop the frame pointer
       ADD R6, R6, #1
       LDR R7, R6, #0    ; pop the return address
       ADD R6, R6, #1
       RET`;
  const ADDR = ["xEFE9", "xEFEA", "xEFEB", "xEFEC", "xEFED", "xEFEE", "xEFEF", "xEFF0", "xEFF1"];
  const LBL = ["m (Volt local)", "k (Volt local)", "Watt's frame pointer", "return address for Watt", "return value to Watt", "q = value of w (parameter)", "r = 10 (parameter)", "w (Watt local)", "… rest of Watt's frame"];
  function callFrames() {
    const mem = ["", "", "", "", "", "", "", "7", "…"];
    const regs = { R0: "?", R5: "xEFF0", R6: "xEFF0", R7: "?" };
    const live = (top) => (i) => ADDR.indexOf(top) <= i;
    const fr = [];
    const snap = (l, note, voltFrame) => {
      const top = regs.R6, on = live(top);
      fr.push({ l, v: Object.entries(regs), note,
        m: ADDR.map((a, i) => [a + (a === regs.R6 ? " ← R6" : "") + (a === regs.R5 ? " ← R5" : ""), on(i) ? mem[i] || "?" : mem[i] ? `(${mem[i]})` : "", on(i) ? LBL[i] : "<span style=\"opacity:.5\">popped</span>", !on(i) ? "" : i >= 7 ? "Watt's frame" : voltFrame ? "Volt's frame" : i >= 5 ? "arguments" : ""]) });
    };
    snap(1, "Before the call: Watt's frame pointer and stack pointer both point at its one local, w = 7.");
    regs.R0 = 10; snap([2, 3], "Step 1, the caller: prepare the rightmost argument first.");
    regs.R6 = "xEFEF"; mem[6] = "10"; snap([4, 5], "Push 10: decrement R6, then store at R6.");
    regs.R0 = 7; regs.R6 = "xEFEE"; mem[5] = "7"; snap([6, 7, 8], "Push w. Arguments go on right to left, so the first argument ends up on top.");
    regs.R7 = "x3050"; snap(9, "JSR Volt: R7 gets the return address (say x3050), PC goes to Volt.");
    regs.R6 = "xEFED"; snap(14, "Step 2, the callee's preamble: leave a slot for the return value.", true);
    regs.R6 = "xEFEC"; mem[3] = "x3050"; snap([15, 16], "Push R7, so Volt can still get home even if it calls other functions.", true);
    regs.R6 = "xEFEB"; mem[2] = "xEFF0"; snap([17, 18], "Push Watt's frame pointer, to restore it later.", true);
    regs.R5 = "xEFEA"; regs.R6 = "xEFE9"; snap([19, 20], "R5 = base of Volt's locals; R6 moves past both locals. Volt's frame is built. Its locals are uninitialized.", true);
    mem[1] = "42"; snap(21, "Step 3: Volt does its work. Say it computes k = 42.", true);
    regs.R0 = 42; mem[4] = "42"; snap([22, 23], "Step 4, the callee's teardown: write the return value at R5 + 3.", true);
    regs.R6 = "xEFEB"; snap(24, "Pop the locals by moving R6 just past R5. The values stay in memory until overwritten, but they're no longer on the stack.", true);
    regs.R5 = "xEFF0"; regs.R6 = "xEFEC"; snap([25, 26], "Restore Watt's frame pointer.", true);
    regs.R7 = "x3050"; regs.R6 = "xEFED"; snap([27, 28, 29], "Restore R7 and RET back to Watt.");
    regs.R0 = 42; mem[7] = "42"; snap([10, 11], "Back in the caller: load the return value from the top of the stack and store it in w.");
    regs.R6 = "xEFF0"; snap(12, "Pop the return value and both arguments. The stack is exactly as it was before the call, except w now holds the result.");
    return fr;
  }
  const callTrace = (host) => trace(host, { code: CALL, title: "LC-3 code (Figure 14.8)", stateTitle: "Registers and stack", frames: callFrames() });

  /* ---------- Figure 14.10 ---------- */
  function upper(host) {
    const inp = el(`<input type="text" value="Hello, lc-3!" aria-label="text to convert" style="${field};width:16em">`), out = el(`<div></div>`);
    const draw = () => {
      const s = inp.value;
      const cells = [...s].map((c) => { const lo = c >= "a" && c <= "z", u = lo ? String.fromCharCode(c.charCodeAt(0) - 32) : c; return `<td style="${lo ? "background:var(--accent-soft)" : ""}">${esc(c)}<br>${c.charCodeAt(0)}<br>→ ${esc(u)}</td>`; });
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);font-size:12px;text-align:center"><tbody><tr>${cells.join("")}</tr></tbody></table></div><pre class="code">${esc(s.replace(/[a-z]/g, (c) => c.toUpperCase()))}</pre><p class="aside">'a' − 'A' = 97 − 65 = 32. Each lowercase letter (highlighted) is moved down by 32; everything else passes through.</p>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>Type input: </label>`); lab.append(inp);
    host.append(lab, out); draw();
  }

  /* ---------- Figure 14.11 ---------- */
  function triples(host) {
    let maxC = 20;
    const out = el(`<div></div>`);
    const draw = () => {
      const found = [];
      for (let c = 1; c <= maxC; c++) for (let b = 1; b <= maxC; b++) for (let a = 1; a <= maxC; a++) if (c * c === a * a + b * b) found.push(`${a} ${b} ${c}`);
      out.innerHTML = `<pre class="code" style="max-height:220px;overflow:auto">${found.join("\n") || "(none)"}</pre>` + readout([["Triples printed", found.length], ["Combinations checked (maxC³)", (maxC ** 3).toLocaleString("en-US")], ["Calls to Squared (3 per check)", (3 * maxC ** 3).toLocaleString("en-US")]]);
    };
    host.append(slider({ id: "pp14c", label: "maxC", min: 5, max: 60, step: 1, value: maxC, show: String }, (x) => { maxC = x; draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why functions?", mins: 15,
    blurb: "Functions are C's subroutines: named building blocks you write once and call from anywhere. The first example takes no input and returns nothing.",
    takeaway: "Functions (procedures, subroutines, methods) are the basic building blocks of large-scale code; so important that ISAs support them directly. They enable abstraction: separate what a component does from how it does it, then use it as a building block. Same concepts as LC-3 subroutines. A C program is a collection of functions; every statement belongs to exactly one; execution starts and finishes in main; main may call functions that call others; control returns to main and the program ends when main ends. (C++ ties functions to types to build objects: Chapter 20.) Figure 14.1: main calls PrintBanner twice; PrintBanner takes no arguments and returns no value (void). main is the caller, PrintBanner the callee.",
    steps: [
      { k: "learn", title: "Abstraction again", b: [
        `<p>A function separates <b>what</b> a piece of code does from <b>how</b>. Once it works, you use it as a building block and stop thinking about its insides, the same move as gates → adders → ALUs.</p>`,
        `<p>You already know the idea: LC-3 <b>subroutines</b>. A C program is just a collection of functions. Execution starts in <code>main</code>, which calls others, which may call others; when main ends, the program ends.</p>`,
        seenPP("Subroutines, JSR and RET.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "play", title: "The simplest function (Figure 14.1)", b: [
        `<p>PrintBanner takes no input and returns nothing: <code>void</code>. main is the <b>caller</b>; PrintBanner is the <b>callee</b>. Predict the output before stepping.</p>`,
        bannerTrace,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What happens to control flow when main calls PrintBanner?", model: "Execution jumps from the call in main to the first statement of PrintBanner's definition. When PrintBanner finishes, control comes back to main at the statement right after the call, and main carries on. Calling it again from another place does the same thing and returns to that place." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Parameters, arguments and return values", mins: 25,
    blurb: "Factorial: a function that takes a value and gives one back. Its declaration, call, definition and return, and why it can't touch the caller's variables.",
    takeaway: "Figure 14.2: Factorial(n) = 1 × 2 × … × n. Four parts: declaration (line 3), call (line 14), definition (line 19), return (line 26). Declaration (function prototype): return type, name, parameter types and order (names optional), ending in a semicolon; void for no return value; empty list for no inputs. Book convention: capitalize function names (Factorial) to tell them from variables. Call: arguments (any legal expressions matching the expected types) in parentheses after the name; the call's value is the return value (answer = Factorial(number)). Definition: header matches the declaration; formal parameter list = variable declarations initialized with the corresponding arguments (first argument to first parameter, …); the body's variables are local. Arguments are passed by value: Factorial can't modify number. return expression; sends a value of the declared type; non-void functions need at least one return; void functions may omit it (control returns after the last statement). main is int and should strictly return 0 (the book omits it); main(void) because the book doesn't use main's arguments.",
    steps: [
      { k: "play", title: "Four places to look", b: [
        anatomy,
      ]},
      { k: "learn", title: "The words", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Declaration</b> (prototype)</td><td>tells the compiler the name, return type and parameter types</td></tr><tr><td><b>Definition</b></td><td>the actual code</td></tr><tr><td><b>Argument</b></td><td>a value the caller passes, in the call</td></tr><tr><td><b>Parameter</b></td><td>the callee's local variable that receives it</td></tr><tr><td><b>Return value</b></td><td>the single output passed back</td></tr></tbody></table></div>`,
        `<p>Arguments match parameters by <b>position</b>: first to first, second to second.</p>`,
      ]},
      { k: "play", title: "Run it", b: [
        `<p>Watch which variables exist in each function, and what crosses between them.</p>`,
        factTrace,
        `<p>Only <b>values</b> cross: 4 goes in, 24 comes out. C passes arguments <b>by value</b>, so the callee works on copies and can't change the caller's variables.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Given <code>double Power(double base, int exp);</code>, which call matches the declaration?", opts: [["x = Power(2.5, 3);", true, "A double, then an int, in that order."], ["x = Power(3);", false, "Two arguments are required."], ["Power(double 2.5, int 3);", false, "Types belong in the declaration, not in the call."]] },
        { t: "mcq", q: "A function is declared <code>void Beep(int times);</code>. What's wrong with <code>n = Beep(3);</code>?", opts: [["Beep returns nothing, so there's no value to assign", true, "void means no return value."], ["Beep needs two arguments", false, "One int is right."], ["Nothing", false, "Look at the return type."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the difference between an argument and a parameter?", model: "An argument is the value written in the call, supplied by the caller, like number in Factorial(number). A parameter is the variable in the callee's definition that receives a copy of that value, like n in int Factorial(int n). Arguments are matched to parameters by position." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Example: the area of a ring", mins: 10,
    blurb: "One function called twice: encapsulate a primitive computation, and keep the caller's variables private.",
    takeaway: "Figure 14.3: areaOfRing = AreaOfCircle(outer) − AreaOfCircle(inner); double AreaOfCircle(double radius) { double pi = 3.14159265; return pi * radius * radius; }. scanf uses %lf to read a double. While AreaOfCircle runs it can see and modify only its local pi and its parameter radius, not main's variables. Encapsulating a primitive operation that is used in several places saves source code (easier maintenance), gives the program better structure, and makes its intent clearer than an in-line formula. (The listing's comments on outer and inner are swapped.)",
    steps: [
      { k: "learn", title: "A primitive, encapsulated", b: [
        code(`areaOfRing = AreaOfCircle(outer) - AreaOfCircle(inner);
...
double AreaOfCircle(double radius)
{
   double pi = 3.14159265; // This can be optionally declared as a const

   return pi * radius * radius;
}`, { nums: false }),
        `<p>The same function is called twice with different arguments. Each call gets its own radius. Reading the first line tells you the intent at a glance. (Note: <code>scanf("%lf", &amp;inner)</code> reads a double.)</p>`,
      ]},
      { k: "play", title: "Try it", b: [
        ring,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Could AreaOfCircle change main's variable outer?", opts: [["No: it only has its parameter radius (a copy) and its local pi", true, "Callees can't reach the caller's locals."], ["Yes, by assigning to outer", false, "outer isn't in scope inside AreaOfCircle."], ["Yes, by assigning to radius", false, "radius is a separate copy."]] },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The run-time stack", mins: 20,
    blurb: "Where do a function's local variables live? Not in a fixed spot: in a stack frame pushed when it's called and popped when it returns.",
    takeaway: "Four phases of a call: pass the arguments, transfer control, the callee executes, return control (with a return value). Functions must be caller-independent (callable from anywhere), so they compose. JSR and RET are the easy part; the sticky issues are passing arguments, returning values, and allocating locals: solved by the run-time stack. Option 1: a fixed memory chunk per function: fails for recursion (a function calling itself overwrites its own locals; Chapter 17) and wastes memory for functions not running. Option 2: allocate when the function starts, reclaim when it returns; each invocation gets its own space; calls nest like a stack. Each function has a template, its stack frame (activation record): locals, bookkeeping, parameters. Figure 14.4: main calls Watt, Watt calls Volt, then main calls Volt; Figure 14.5 snapshots: frames pushed and popped; the stack grows toward lower addresses. R5 = frame pointer (base of the current function's locals); R6 = stack pointer (top of the stack).",
    steps: [
      { k: "learn", title: "Where do locals go?", b: [
        `<div class="two"><div class="tile"><h3>Option 1: a fixed spot per function</h3><p>Simple, but if a function calls <b>itself</b> (recursion, Chapter 17), the new call overwrites the old call's variables. And every function hogs memory even when it isn't running.</p></div><div class="tile"><h3>Option 2: allocate on call</h3><p>Give each <b>invocation</b> fresh space when it starts and reclaim it on return. Calls nest, so the spaces come and go like a <b>stack</b>.</p></div></div>`,
        `<p>C uses option 2. Each function's template of locals, bookkeeping and parameters is its <b>stack frame</b> (or activation record).</p>`,
      ]},
      { k: "play", title: "Figure 14.5", b: [
        `<p>main calls Watt, Watt calls Volt, both return, then main calls Volt. Predict which frames are on the stack at each moment, then click through.</p>`,
        snapshots,
        `<p><b>R5</b>, the frame pointer, points at the base of the running function's locals. <b>R6</b>, the stack pointer, points at the top. The stack grows toward x0000.</p>`,
        seenPP("The stack data structure and push/pop in LC-3.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't C simply give each function a fixed block of memory for its local variables?", model: "Because a function can be active more than once at the same time, most obviously when it calls itself recursively. A second invocation would overwrite the first one's variables in the shared block. Allocating a fresh stack frame on every call gives each invocation its own space, and it also uses memory only for functions that are actually running." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "The calling convention, instruction by instruction", mins: 35,
    blurb: "Follow w = Volt(w, 10) through the LC-3: push arguments, JSR, build the frame, do the work, tear it down, collect the result.",
    takeaway: "LC-3 C protocol, four steps. (1) Caller pushes arguments right to left (push = decrement R6, then STR at R6), then JSR (R7 = return address). (2) Callee preamble: allocate the return-value slot; push R7 (return address, so it can call others); push R5 (caller's frame pointer); set R5 = R6 − 1 (base of locals) and move R6 past the locals (Volt: ADD R5, R6, #-1; ADD R6, R6, #-2). (3) Callee executes. (4) Callee teardown: write the return value at R5 + 3 (with this layout); pop locals (ADD R6, R5, #1); restore R5 (LDR R5, R6, #0; ADD R6, R6, #1); restore R7; RET. Popped values stay in memory until overwritten. Caller then pops the return value (loading it) and the arguments (ADD R6, R6, #3 combined in Figure 14.8). Every frame has the same structure: locals, bookkeeping (caller's frame pointer, return address), return value, parameters; the parameters are written by the caller. Locals start uninitialized. Registers: R4 global pointer, R5 frame pointer, R6 stack pointer, R7 return address; R0–R3 temporaries saved by caller-save (caller pushes them) or callee-save (callee saves them in its bookkeeping area). The generality (any function can call any other knowing only its interface) is why all these steps are needed.",
    steps: [
      { k: "learn", title: "Four steps", b: [
        `<ol><li><b>Caller</b>: push the arguments (right to left), JSR.</li><li><b>Callee</b>: make room for the return value, save R7 and the caller's R5, set up its own R5 and room for locals.</li><li><b>Callee</b>: do the work.</li><li><b>Callee</b>: store the return value, pop its locals, restore R5 and R7, RET. Then the <b>caller</b> takes the return value and pops it and the arguments.</li></ol>`,
      ]},
      { k: "play", title: "Step through w = Volt(w, 10)", b: [
        `<p>Watt has one local, w = 7. Volt has parameters q, r and locals k, m. Addresses are made up but the layout is the book's (Figures 14.6–14.8). Before each step, predict which register or memory cell changes.</p>`,
        callTrace,
      ]},
      { k: "learn", title: "Every frame looks the same", b: [
        `<p>From the top down: <b>locals</b>, the caller's <b>frame pointer</b>, the <b>return address</b>, the <b>return value</b>, the <b>parameters</b>. Because the layout is fixed relative to R5, the compiler always knows where things are: the first local at R5 + 0, the return value at R5 + 3, the first parameter at R5 + 4.</p>`,
        `<p>And it's all <b>caller-independent</b>: a caller only needs the callee's interface (types in and out). That generality is why so many instructions are needed.</p>`,
      ]},
      { k: "learn", title: "What about R0–R3?", b: [
        `<p>R4–R7 have fixed jobs (globals, frame pointer, stack pointer, return address). R0–R3 hold temporaries that a call could clobber. Either the <b>caller saves</b> the ones it needs (pushing them before the call), or the <b>callee saves</b> them in its bookkeeping area and restores them before returning.</p>`,
        seenPP("Caller-save and callee-save for subroutines.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does the callee push R7 at all? JSR already put the return address there.", opts: [["If the callee calls another function, that JSR overwrites R7", true, "Saving it on the stack lets any function call others and still find its way home."], ["RET needs it on the stack", false, "RET uses R7, not the stack."], ["To initialize a local", false, "It's bookkeeping."]] },
        { t: "mcq", q: "Volt's first parameter q sits at R5 + 4. Why does a function's code never need to know its caller's frame layout?", opts: [["Everything it needs is at fixed offsets from its own R5", true, "Parameters, return slot and bookkeeping are always in the same place relative to R5."], ["It reads the caller's symbol table", false, "Not at run time."], ["Parameters are in registers", false, "Not in this convention."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In one or two sentences each, what do the frame pointer R5 and the stack pointer R6 do during a function call?", model: "R6 always marks the top of the run-time stack; every push decrements it and every pop increments it. R5 marks the base of the currently running function's local variables, so the compiler can reach locals, the return value slot and parameters at fixed offsets from it; it is saved on entry and restored on exit so the caller gets its own R5 back." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Problem solving with functions", mins: 20,
    blurb: "Functions fall out of top-down design as natural components (case conversion), or as primitives you need in many places (squaring for Pythagorean triples).",
    takeaway: "Functions are natural division points in top-down design, and they encapsulate primitive operations, extending the language for the problem. Problem 1 (Figures 14.9–14.10): echo input (Figure 13.8's while loop) converting lowercase to uppercase: char ToUpper(char inchar) returns inchar − ('a' − 'A') if 'a' <= inchar <= 'z', else inchar; character literals are ASCII values. Problem 2 (Figure 14.11): Pythagorean triples c² = a² + b² with all sides up to maxC, by brute force: three nested for loops over sideC, sideB, sideA, testing Squared(sideC) == Squared(sideA) + Squared(sideB) with int Squared(int x) { return x * x; }; clearer than the raw expression. Better algorithms exist. (The listing prints sideC+ + with a stray space; it means sideC++.) Summary: declarations (name, return type, parameter types and order), definitions, calls with arguments; the stack-based calling convention; functions enable abstraction: write, debug, test once, use everywhere.",
    steps: [
      { k: "learn", title: "Two ways functions appear", b: [
        `<div class="two"><div class="tile"><h3>A natural component</h3><p>While refining a problem, a self-contained box appears: “convert this character”. Make it a function.</p></div><div class="tile"><h3>A primitive you keep needing</h3><p>An operation used in several places, like squaring. Make it a function and the code reads like the problem.</p></div></div>`,
      ]},
      { k: "play", title: "Problem 1: ToUpper (Figure 14.10)", b: [
        code(`char ToUpper(char inchar)
{
   char outchar;

   if ('a' <= inchar && inchar <= 'z')
      outchar = inchar - ('a' - 'A');
   else
      outchar = inchar;

   return outchar;
}`, { nums: false }),
        upper,
        seenPP("ASCII codes for letters.", "02-bits-data-types.html", "Chapter 2"),
      ]},
      { k: "play", title: "Problem 2: Pythagorean triples (Figure 14.11)", b: [
        code(`for (int sideC = 1; sideC <= maxC; sideC++) {
   for (int sideB = 1; sideB <= maxC; sideB++) {
      for (int sideA = 1; sideA <= maxC; sideA++) {
         if (Squared(sideC) == Squared(sideA) + Squared(sideB))
            printf("%d %d %d\\n", sideA, sideB, sideC);
      }
   }
}`, { nums: false }),
        `<p>Look at the output as you raise maxC. What's wasteful about it?</p>`,
        triples,
        `<p>Every triple appears twice (3 4 5 and 4 3 5), and the work grows as maxC³. The book asks whether you can make it faster; a first idea is to start sideB at sideA's value.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is it better to write Squared(sideA) than sideA * sideA here, even though both compute the same value?", model: "The function name says what is being computed, so the test reads like the formula c² = a² + b² and the intent is obvious. It's also written and checked once, and if the operation ever needed to change it would change in one place." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp14", eyebrow: "Patt & Patel · Chapter 14", title: "Functions",
    intro: `<p>Six parts: why functions, their syntax (declaration, call, definition, return), an example, the run-time stack, the full LC-3 calling convention instruction by instruction, and two problems solved with functions.</p><p>The centrepiece is part 5: one function call traced through every push, pop and register. Take it slowly. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For any question about the stack, draw it: one row per memory location, top of stack at the top, with R5 and R6 marked, and update it one instruction at a time.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>Syntax</h3>
      <p>Declaration (prototype) <code>int Factorial(int n);</code>: return type, name, parameter types. Definition: header + body. Call: <code>answer = Factorial(number);</code>, arguments matched to parameters by position, passed by value. <code>return expr;</code> (<code>void</code>: none needed).</p>
      <h3>Run-time stack</h3>
      <p>Each invocation gets a stack frame: locals, caller's frame pointer, return address, return value, parameters. R5 = frame pointer, R6 = stack pointer, R7 = return address, R4 = globals.</p>
      <h3>Calling convention</h3>
      <p>Caller pushes arguments right to left, JSR. Callee: return slot, push R7, push R5, R5 = base of locals, allocate locals; work; write return value (R5 + 3), pop locals, restore R5, R7, RET. Caller pops return value and arguments. Caller-save or callee-save for R0–R3.</p>`,
  };
  Course.start(window.CHAPTER);
})();

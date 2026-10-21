(function () {
  const { slider, toggle, readout, el } = Course;
  const { code, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);

  /* ---------- leap years (Figure 15.5) ---------- */
  function leapWidget(host) {
    let y = 1996;
    const out = el(`<div></div>`);
    const draw = () => {
      const buggy = y % 4 === 0, right = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      const odd = []; for (let k = 1800; k <= 2400; k += 4) if ((k % 4 === 0) !== ((k % 4 === 0 && k % 100 !== 0) || k % 400 === 0)) odd.push(k);
      out.innerHTML = readout([["Figure 15.5 says", buggy ? "leap year" : "not a leap year"], ["The real calendar says", right ? "leap year" : "not a leap year"], ["Verdict", buggy === right ? "agree" : `<span style="color:var(--bad)">the program is wrong for ${y}</span>`]]) +
        `<p class="aside">Between 1800 and 2400 the two disagree only in: ${odd.join(", ")}. Most tests would never hit those.</p>`;
    };
    host.append(slider({ id: "pp15y", label: "year", min: 1800, max: 2400, step: 1, value: y, show: String }, (x) => { y = x; draw(); }).el, out); draw();
  }

  /* ---------- black-box testing AllSum against a checker ---------- */
  function blackBox(host) {
    let seed = 7, garbage = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const run = (n) => {
      const results = [];
      for (let k = 0; k < n; k++) {
        const inp = 1 + Math.floor(rnd() * 50), got = garbage + (inp * (inp + 1)) / 2, want = (inp * (inp + 1)) / 2;
        results.push([inp, got, want]);
        garbage = Math.floor(rnd() * 3) ? garbage : Math.floor(rnd() * 400) - 100; // whatever happened to be in memory
      }
      const fails = results.filter((r) => r[1] !== r[2]).length;
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);font-size:13px"><thead><tr><th>input</th><th>AllSum says</th><th>checker says</th><th></th></tr></thead><tbody>${results.map(([i, g, w]) => `<tr><td>${i}</td><td>${g}</td><td>${w}</td><td style="color:${g === w ? "var(--good)" : "var(--bad)"}">${g === w ? "pass" : "FAIL"}</td></tr>`).join("")}</tbody></table></div><p>${fails} of ${n} trials failed.${fails && fails < n ? " Some passed: when the leftover garbage happened to be 0, the bug was invisible." : ""}</p>`;
    };
    const b1 = btn("Run 8 random trials", "primary"); b1.addEventListener("click", () => run(8));
    row.append(b1); host.append(row, out); run(8);
  }

  /* ---------- a tiny source-level debugger on Figure 15.3 ---------- */
  const ALLSUM = `int AllSum(int n)
{
   int result;              // Result to be returned
   int i;                   // Iteration count

   for (i = 1; i <= n; i++) // This calculates sum
      result = result + i;

   return result;           // Return to caller
}`;
  function debuggerWidget(host) {
    const G = 6732; // leftover bits in result's memory location
    const states = [{ l: 3, v: { n: 4, result: G, i: "?" } }];
    let r = G;
    for (let i = 1; i <= 5; i++) { states.push({ l: 6, v: { n: 4, result: r, i } }); if (i > 4) break; r += i; states.push({ l: 7, v: { n: 4, result: r, i } }); }
    states.push({ l: 9, v: { n: 4, result: r, i: 5 } });
    const bps = new Set([7]);
    let k = -1;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), bpRow = el(`<div class="row"></div>`);
    const bRun = btn("Run / Continue ▶", "primary"), bStep = btn("Step"), bReset = btn("Restart");
    const draw = () => {
      const s = states[k];
      const lines = ALLSUM.split("\n").map((ln, i) => `${bps.has(i + 1) ? "●" : " "} ${String(i + 1).padStart(2)} ${ln}`).join("\n");
      out.innerHTML = code(lines, { hl: s ? s.l : [], nums: false }) + (s ? `<div class="tbl"><table style="font-family:var(--mono)"><thead><tr><th>Variable</th><th>Value</th></tr></thead><tbody>${Object.entries(s.v).map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</tbody></table></div><p class="aside">Paused at line ${s.l}. AllSum(4) should return 10.</p>` : `<p class="aside">Not started. AllSum is called with n = 4. ● marks a breakpoint.</p>`) + (k === states.length - 1 ? `<p>Returns <b>${r}</b>, not 10.</p>` : "");
      bRun.disabled = bStep.disabled = k === states.length - 1;
    };
    bStep.addEventListener("click", () => { if (k < states.length - 1) k++; draw(); });
    bRun.addEventListener("click", () => { do { k++; } while (k < states.length - 1 && !bps.has(states[k].l)); draw(); });
    bReset.addEventListener("click", () => { k = -1; draw(); });
    [3, 6, 7, 9].forEach((ln) => { const b = btn(""); const show = () => { b.textContent = `${bps.has(ln) ? "● " : ""}breakpoint line ${ln}`; }; b.addEventListener("click", () => { bps.has(ln) ? bps.delete(ln) : bps.add(ln); show(); draw(); }); show(); bpRow.append(b); });
    row.append(bRun, bStep, bReset);
    host.append(bpRow, row, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why testing and debugging matter", mins: 10,
    blurb: "Two lost Mars missions, and why experienced programmers spend more time debugging than writing.",
    takeaway: "December 1999: the Mars Polar Lander most probably crashed because software mistook landing-gear deployment vibrations for touchdown and shut the engines off 40 m above the surface. Months earlier the Mars Climate Orbiter ($655 million) was lost because a ground subsystem computed in imperial units while the rest used metric. Software is as integral as any subsystem and harder to get right because it is invisible. Programs are not correct by construction, especially in C/C++. Experienced coders spend more than half their time debugging; the best programmers have mastered it. Testing exposes bugs (subject the code to as many input conditions as possible, e.g., every ASCII value into ToUpper); debugging fixes them, by gathering evidence systematically, like a detective.",
    steps: [
      { k: "learn", title: "Two bugs, two spacecraft", b: [
        `<div class="two"><div class="tile"><h3>Mars Polar Lander, 1999</h3><p>Software probably read the jolt of the landing legs deploying as touchdown and shut the engines off <b>40 m up</b>.</p></div><div class="tile"><h3>Mars Climate Orbiter, 1999</h3><p>One ground subsystem computed thruster data in <b>imperial</b> units; everything else expected <b>metric</b>. $655 million lost.</p></div></div>`,
        `<p>Software is invisible: you can't look at it the way you'd inspect a rocket nozzle. And C programs are not correct just because they compile.</p>`,
      ]},
      { k: "learn", title: "Two different jobs", b: [
        `<div class="two"><div class="tile"><h3>Testing</h3><p><b>Exposes</b> bugs: throw as many input conditions at the code as you can and compare with the specification.</p></div><div class="tile"><h3>Debugging</h3><p><b>Fixes</b> them: gather evidence (variable values, control flow) and deduce where it goes wrong.</p></div></div>`,
        `<p>Experienced programmers spend more than half their time debugging. Better to find the bug on Earth than 40 m above Mars.</p>`,
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Four kinds of errors", mins: 25,
    blurb: "Syntactic, semantic, algorithmic and specification errors: from typos the compiler catches to designs that were wrong from the start.",
    takeaway: "Syntactic (syntax, parse) errors: code that doesn't conform to the language; always caught by the compiler, often with the line (Figure 15.1: missing semicolon after int i); easy to fix. Semantic errors: syntactically fine, runs, but doesn't do what was meant; typographic in nature like syntax errors. Figure 15.2: missing braces make the for loop's body only j = i * 7, so the printf runs once after the loop: '11 x 7 = 70' (a control-flow error). Figure 15.3: result in AllSum is never initialized (an initialization error). Run-time errors: illegal actions such as accessing protected memory (scanf(\"%d\", in) without &) make the OS terminate the program. Algorithmic errors: the code does what was designed but the design is flawed; may hide for many runs; reduce by planning before coding. Off-by-one (Figure 15.4: for (int i = 1; i < iterations; i++) does iterations − 1 trips). Leap years (Figure 15.5: year % 4 == 0 ignores the rule that century years are leap only if divisible by 400: 2000 yes, 2100 no). Specification errors: the code meets a flawed or miscommunicated or misinterpreted spec: Y2K (two-digit years). Bugs also arise in hardware, flaky sensors, transient failures; security bugs (Heartbleed, Meltdown, Spectre) are a separate topic.",
    steps: [
      { k: "learn", title: "Typos the compiler catches", b: [
        code(`int main(void)
{
   int i
   int j;

   for (i = 0; i <= 10; i++) {
      j = i * 7;
      printf("%d x 7 = %d\\n", i, j);
   }
}`),
        `<p>A <b>syntactic error</b>: the missing semicolon on line 3. The compiler refuses and points (sometimes confusingly) near the spot. Annoying but cheap.</p>`,
      ]},
      { k: "check", title: "Typos the compiler can't catch", b: [
        code(`for (i = 0; i <= 10; i++)
   j = i * 7;
   printf("%d x 7 = %d\\n", i, j);`, { nums: false }),
        `<p>The semicolon is fixed and the braces are gone. The book says the only output is <code>11 x 7 = 70</code>.</p>`,
        { t: "mcq", q: "Why only that one line?", opts: [["Without braces the loop body is just j = i * 7; the printf runs once, after the loop, when i is 11 and j is still 70", true, "A semantic, control-flow error: valid C that doesn't say what was meant."], ["printf only works once per program", false, "No such rule."], ["The loop runs once", false, "It runs 11 times; it just doesn't print."]] },
      ]},
      { k: "learn", title: "More semantic errors", b: [
        code(`int AllSum(int n)
{
   int result;              // Result to be returned
   int i;                   // Iteration count

   for (i = 1; i <= n; i++) // This calculates sum
      result = result + i;

   return result;           // Return to caller
}`),
        `<p>An <b>initialization error</b>: result starts with whatever bits were in its memory location (Chapter 12), so the sum is off by an unpredictable amount.</p>`,
        `<p>Some errors are caught at <b>run time</b>: write <code>scanf("%d", in)</code> without the &amp; and the program tries to write somewhere it isn't allowed. The operating system stops it.</p>`,
        seenPP("Local variables start uninitialized.", "12-variables-operators.html", "Chapter 12"),
      ]},
      { k: "learn", title: "The design itself is wrong", b: [
        `<p><b>Algorithmic errors</b>: the code does exactly what you designed, but the design is flawed. The classic small one is <b>off-by-one</b>:</p>`,
        `<pre class="code" style="font-variant-ligatures:none">for (int i = 1; i < iterations; i++)
   printf("Executing iteration %d\\n", i);</pre>`,
        `<p>Ask for 10 iterations and you get 9. A deeper one: Figure 15.5 decides leap years with <code>year % 4 == 0</code>. But century years are leap years only if divisible by 400.</p>`,
      ]},
      { k: "play", title: "Hunt the leap-year bug", b: [
        `<p>Predict first: in which years between 1800 and 2400 does the program give the wrong answer?</p>`,
        leapWidget,
        `<p>That's what makes algorithmic bugs dangerous: they can pass almost every test.</p>`,
      ]},
      { k: "learn", title: "The spec was wrong", b: [
        `<p><b>Specification errors</b>: the code meets the spec, but the spec was flawed, poorly written, or misread. The famous one is <b>Y2K</b>: to save scarce memory, old systems stored years as two digits, assuming the 1900s. In 2000, “00” meant 1900 again. Huge effort went into fixing it before 1 January 2000.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "What kind of error is each?", bins: ["Syntactic", "Semantic", "Algorithmic", "Specification"], items: [
          ["A missing closing parenthesis in an if condition", 0, "The compiler can't parse it."],
          ["if (count = 0) where count == 0 was meant", 1, "Legal C that does something else."],
          ["Averaging by dividing a sum by (n − 1) instead of n", 2, "The method is wrong, by one."],
          ["The client wanted prices in euros, the requirements document said dollars", 3, "The code met a wrong spec."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are syntactic errors the cheapest kind and algorithmic errors among the most expensive?", model: "The compiler always finds syntactic errors, usually pointing at the line, and they are quick to fix. Algorithmic errors produce a program that runs and does what was designed, so nothing flags them; they may only appear for rare inputs after many runs, and fixing them can mean redesigning part of the program." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Testing: black-box and white-box", mins: 20,
    blurb: "You can't try every input, so test systematically: against the specification from outside, and against the structure from inside.",
    takeaway: "Adage: untested code is probably buggy. Testing = synthetic trials before release (real software: millions). Exhaustive testing is usually impossible: a prime finder between two 32-bit inputs has (2^32)^2 combinations: at a million trials per second, about half a million years. Random inputs help but aren't enough. Black-box testing checks inputs and outputs against the specification, ignoring the internals (what, not how), e.g., type a number into AllSum and compare with a hand calculation; automate with random inputs and a checker program developed independently (testers often may not see the code) so it is unlikely to share the bug. White-box testing uses knowledge of the construction: test each function in isolation, extra calls with known answers, printf of internal variables (disabled or removed for release), assertions: error-detecting code checking that conditions hold (e.g., if (area < 0) printf(\"Error in function CalculateArea!\\n\");) and taking corrective action. Use both: white-box tests can miss parts of the spec; black-box tests can miss lines of code.",
    steps: [
      { k: "check", title: "Why not test everything?", b: [
        `<p>The book's example: a program that finds primes between two 32-bit inputs A and B has (2<sup>32</sup>)<sup>2</sup> input combinations. At a million trials per second that's about half a million years.</p>`,
        { t: "num", q: "Same idea, but the two inputs are 16-bit. At a million trials per second, how many minutes to try every combination?", a: 71.6, tol: 0.02, why: "(2¹⁶)² = 2³² ≈ 4.29 × 10⁹ trials; ÷ 10⁶ per second ≈ 4295 s ≈ 71.6 minutes. Every extra bit doubles it." },
      ]},
      { k: "learn", title: "Black-box", b: [
        `<p>Treat the program as a sealed box: feed inputs, compare outputs with the <b>specification</b>. It tests <b>what</b> the code does, not how.</p>`,
        `<p>To run thousands of trials, automate: generate random inputs and compare with a <b>checker program</b> written independently, often by someone not allowed to see the code, so it's unlikely to contain the same bug.</p>`,
      ]},
      { k: "play", title: "Black-box test the buggy AllSum", b: [
        `<p>The checker computes n(n+1)/2. AllSum is the uninitialized version from part 2. Run some trials. Would one hand-picked test have been enough?</p>`,
        blackBox,
      ]},
      { k: "learn", title: "White-box", b: [
        `<p>Use what you know about the <b>insides</b>: test each function on its own, add calls with known answers, print internal variables, and add <b>assertions</b>, checks that something that must be true really is:</p>`,
        `<pre class="code" style="font-variant-ligatures:none">area = CalculateArea(height1, height2, width1, width2);
if (area < 0)
   printf("Error in function CalculateArea!\\n");</pre>`,
        `<p class="aside">(The book's listing misspells CalculateArea and height2 here; it's the idea that matters.)</p>`,
        `<p>You need both: white-box tests can cover every line yet miss part of the spec; black-box tests can satisfy the spec yet never run some lines.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why should a black-box checker program be written by someone who hasn't seen the code being tested?", model: "If the checker's author knew how the original works, they might copy the same approach and the same mistakes, so both programs would agree on the wrong answer. An independently developed checker is unlikely to have the same bug in the same place, so disagreements reveal bugs." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Debugging", mins: 20,
    blurb: "From reading the code and adding printfs to breakpoints, single-stepping and watching variables in a source-level debugger.",
    takeaway: "Debugging: isolate, fix, verify; deduce the bug's location from symptoms, like a detective or a physician running tests. Ad hoc techniques: visual inspection of the suspected region (check initialization, off-by-one, other semantic errors) and inserting printfs for key variables and control flow (e.g., inside a loop to count iterations); fine for small programs. Source-level debuggers (in IDEs: Visual Studio, Xcode, Android Studio, Eclipse) examine variables, memory, registers and the stack at any point; the program must be compiled with extra information mapping machine instructions to source lines and names to locations (the symbol table). Control: breakpoints at a line or function; conditional breakpoints (stop only when, e.g., x == 16 in a loop calling PerformCalculation(x)); watchpoints (stop wherever a condition becomes true, e.g., LastItem == 4, not tied to a line); single-stepping one C statement at a time (verify loop counts, if-else conditions), with variants that step over functions or skip to a loop's last iteration. Examine values: variables, memory, stack, registers (e.g., hover over a variable).",
    steps: [
      { k: "learn", title: "Quick and dirty first", b: [
        `<p><b>Read the code</b> near where things go wrong, looking for the usual suspects: uninitialized variables, off-by-one bounds, = for ==, missing braces.</p>`,
        `<p><b>Add printfs</b> to show key variables or which branch ran. Fine for small programs; tedious for big ones, since every change means editing and recompiling.</p>`,
      ]},
      { k: "learn", title: "A source-level debugger", b: [
        `<ul><li><b>Breakpoint</b>: pause when execution reaches a line or function.</li><li><b>Conditional breakpoint</b>: pause there only if a condition holds, like x == 16.</li><li><b>Watchpoint</b>: pause at <i>any</i> line where a condition becomes true, like LastItem == 4.</li><li><b>Single-step</b>: run one C statement, then pause again (or step over a whole function call).</li><li><b>Examine</b>: variables, memory, the stack, registers.</li></ul>`,
        `<p>It works because the compiler can include the mapping from machine instructions back to source lines, and its symbol table.</p>`,
        seenPP("The LC-3 simulator's single-step and breakpoints.", "06-programming.html", "Chapter 6"),
      ]},
      { k: "play", title: "Debug AllSum", b: [
        `<p>Run with the breakpoint on line 7, then Continue a few times and watch result. Then restart with a breakpoint on line 3 instead. Where can you first see the problem?</p>`,
        debuggerWidget,
        `<p>At line 3 result already holds 6732: the leftover bits. The fix is <code>int result = 0;</code>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A loop runs 10,000 times and the bug shows only when count reaches 9,999. Which tool fits best?", opts: [["A conditional breakpoint inside the loop, count == 9999", true, "Stop exactly where it matters, without stepping 9,999 times."], ["Single-step from the start", false, "Thousands of steps."], ["A printf on every iteration", false, "Works, but buries you in 10,000 lines of output."]] },
        { t: "mcq", q: "A global variable gets a wrong value somewhere in a 3,000-line program. You don't know which line does it. Which tool?", opts: [["A watchpoint on that variable", true, "It stops wherever the condition becomes true, on any line."], ["A breakpoint at main", false, "That doesn't find the culprit."], ["Read all 3,000 lines", false, "Possible, but slow."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the difference between a breakpoint and a watchpoint?", model: "A breakpoint is attached to a place in the code: execution pauses whenever it reaches that line or function (optionally only if a condition holds). A watchpoint is attached to a condition on the program's data and isn't tied to any line: execution pauses at whatever statement makes the condition true." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Programming for correctness", mins: 20,
    blurb: "Stop bugs before they're written: pin down the specification, build from tested modules, and program defensively.",
    takeaway: "Nail down specifications: \"calculate the factorial of an integer from the keyboard\" leaves negative numbers, zero and overflow undefined; Figure 15.6 adds a range check to Factorial returning −1 for bad input. (Book slip: it allows n up to 31, reasoning n! must stay below 2^31; but 13! = 6,227,020,800 already exceeds 2^31, so with 32-bit ints n must be ≤ 12; on the 16-bit LC-3, ≤ 7.) Modular design: functions extend the language; test each one in isolation (white-box), then integrate; libraries are collections of pretested components; the same philosophy applies to circuits and hardware. Defensive programming: comment your code (it makes you rethink special cases); adopt a consistent style (aligned braces expose missing ones; meaningful names); avoid assumptions (e.g., about parameter ranges) or check them with assertions; avoid global variables; rely on the compiler's warnings (uninitialized variables, = vs ==).",
    steps: [
      { k: "learn", title: "Pin down the specification", b: [
        `<p>“Read an integer and print its factorial.” What about −3? 0? A number so big the answer overflows? The spec doesn't say, so the code is buggy for those inputs no matter how carefully it's written. Figure 15.6 tightens it:</p>`,
        code(`int Factorial(int n)
{
   int result = 1;

   if ((n < 1) || (n > 31))  // Bad parameter
      return -1;

   for (int i = 1; i <= n; i++)
      result = result * i;

   return result;
}`),
      ]},
      { k: "check", title: "Check the book", b: [
        `<p>The book reasons that n! must stay below 2<sup>31</sup> for a 32-bit int, and concludes n ≤ 31. Test that claim.</p>`,
        { t: "num", q: "What is the largest n whose factorial is below 2³¹ = 2,147,483,648?", a: 12, tol: 0, why: "12! = 479,001,600 fits; 13! = 6,227,020,800 doesn't. The check should be n > 12, so the book's own range check has a specification bug." },
      ]},
      { k: "learn", title: "Build from tested pieces", b: [
        `<p>Write a function, test it alone, then integrate. Small pieces are easier to test than a whole program. A <b>library</b> is a collection of pretested components everyone reuses. Hardware is designed the same way.</p>`,
      ]},
      { k: "learn", title: "Program defensively", b: [
        `<ul><li><b>Comment</b>: explaining code makes you notice the special case you forgot.</li><li><b>Consistent style</b>: aligned braces expose a missing one; names say what they hold.</li><li><b>Avoid assumptions</b>: if a parameter “will always be positive”, check it, or assert it.</li><li><b>Avoid globals</b>: anything can change them.</li><li><b>Rely on the compiler</b>: turn on warnings for uninitialized variables and = in conditions.</li></ul>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can a program be buggy even if every line does exactly what the programmer intended?", model: "If the specification is incomplete or wrong. If it never said what to do with, say, negative or huge inputs, the program will do something arbitrary for them, and if it was based on a wrong requirement, like two-digit years, it faithfully implements the wrong thing. Pinning down the specification before coding prevents these." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp15", eyebrow: "Patt & Patel · Chapter 15", title: "Testing and Debugging",
    intro: `<p>Five parts: why it matters, the four kinds of errors, black-box and white-box testing, debugging with printfs and a source-level debugger, and habits that prevent bugs in the first place.</p><p>You'll hunt the leap-year bug, black-box test a broken function, and use a little debugger with breakpoints. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book, ideally with a real compiler and debugger. Before changing any code, write down what you expect each variable to be at one point, then check it.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <h3>Errors</h3>
      <p>Syntactic (compiler catches), semantic (runs, wrong behaviour: control flow, uninitialized variables; run-time errors like a missing &amp;), algorithmic (flawed design: off-by-one, leap years), specification (flawed or misread spec: Y2K).</p>
      <h3>Testing</h3>
      <p>Exhaustive is impossible. Black-box: against the spec, automated with an independent checker. White-box: per function, printfs, assertions. Use both.</p>
      <h3>Debugging and prevention</h3>
      <p>Inspection and printfs; source-level debugger: breakpoints (conditional), watchpoints, single-stepping, examining values. Nail down specs, modular design, defensive programming: comments, consistent style, no assumptions, no globals, compiler warnings.</p>`,
  };
  Course.start(window.CHAPTER);
})();

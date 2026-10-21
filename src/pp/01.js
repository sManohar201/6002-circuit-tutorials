(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;

  /* The seven levels of transformation, top (problem) to bottom (devices). */
  const LEVELS = [
    ["Problem", "Stated in English: “Add up my monthly expenses.”", "Anyone"],
    ["Algorithm", "A precise, finite recipe: start a total at 0; for each expense, add it to the total; stop after the last one.", "Programmers, mathematicians"],
    ["Program (language)", "The recipe written in C, Python or assembly: total = total + x; inside a loop.", "Programmers"],
    ["ISA", "The instructions this computer understands, such as ADD, LOAD, BRANCH, and the data types and addressing modes they use.", "Compiler writers, architects"],
    ["Microarchitecture", "One way to build hardware that obeys the ISA: registers, an ALU, a control unit, how many instructions at once.", "Processor designers"],
    ["Logic circuits", "Gates arranged to make each block: the adder inside the ALU, the decoders, the latches.", "Logic designers"],
    ["Devices", "Transistors on silicon. CMOS today. Electrons move, voltages change, and the sum appears.", "Chip and device designers"],
  ];

  /* Stack of boxes, one per level; `on` is the highlighted index. */
  function ladder(on, o = {}) {
    let s = "";
    LEVELS.forEach(([name], i) => {
      const y = 12 + i * 40, hot = i === on, chip = o.chip && i >= 4;
      s += `<rect x="70" y="${y}" width="260" height="32" rx="7" style="fill:${hot ? "var(--accent-soft)" : chip ? "var(--cool-soft)" : "var(--card)"};stroke:${hot ? "var(--accent)" : "var(--line)"};stroke-width:${hot ? 2.5 : 1.2}"/>`;
      s += S.t(200, y + 21, name, { cls: hot ? "b" : "" });
      if (i < LEVELS.length - 1) s += `<line class="w" x1="200" y1="${y + 32}" x2="200" y2="${y + 40}"/>`;
    });
    s += S.t(40, 30, "people", { cls: "s" }) + S.t(40, 290, "electrons", { cls: "s" });
    s += `<line class="w" x1="40" y1="40" x2="40" y2="272" style="stroke-dasharray:4 4"/>`;
    if (o.chip) s += S.t(345, 218, "chip", { a: "start", cls: "s c" }) + S.t(345, 236, "design", { a: "start", cls: "s c" });
    return S.svg(420, 300, s, { max: 420, label: "The levels of transformation, from problem down to devices" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "No magic", mins: 15,
    blurb: "A computer is a huge pile of very simple parts. This book builds it from the bottom up.",
    takeaway: "A computer is deterministic: same starting state, same inputs, same result, every time. It is an “electronic idiot” that does exactly what it's told. What looks complex is a very large, systematically connected collection of very simple parts. The book builds it like a house, bottom up: Chapter 2 bits (all information as 0s and 1s); Chapter 3 transistors, gates and storage; Chapters 4–5 the von Neumann model and the LC-3 (Little Computer 3), a small but real computer; Chapters 5–7 programming it in machine language and assembly; Chapters 8–10 data structures, I/O and a calculator; Chapters 11–20 C and C++, always tied back to the LC-3.",
    steps: [
      { k: "learn", title: "An electronic idiot", b: [
        `<p>The book's first promise: <b>there is no magic in computing.</b></p>`,
        `<div class="two"><div class="tile"><h3>Deterministic</h3><p>Same starting state, same inputs → <b>same result</b>, every single time.</p></div><div class="tile"><h3>Simple parts</h3><p>Billions of them, each one dumb. The cleverness is in how they're <b>connected</b>.</p></div></div>`,
        `<p>A computer has no mind of its own. It does exactly what it's told, nothing more.</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "You run the same program twice on the same input and get different answers. What does “deterministic” tell you?", opts: [
          ["Something in the starting state or the inputs differed (a clock reading, a random seed, a file, a timing race)", true, "Right. Determinism means a different result must have a cause you can find. That's what makes debugging possible."],
          ["The computer made a creative choice", false, "Computers don't choose. They follow instructions exactly."],
          ["Computers are just unreliable sometimes", false, "Real hardware faults are rare. Almost always, something about the start or the inputs was different."],
        ]},
      ]},
      { k: "learn", title: "The plan: build it like a house", b: [
        `<p>Start at the foundation and add one layer at a time. Each new layer is explained in terms of the one below.</p>`,
        `<ol><li><b>Bits</b> (Ch 2): everything as 0s and 1s. The letter a is 01100001.</li><li><b>Transistors and gates</b> (Ch 3): the parts that compute and remember.</li><li><b>A whole computer</b> (Ch 4–5): the von Neumann model and the <b>LC-3</b>, “Little Computer 3”.</li><li><b>Programming it</b> (Ch 5–10): machine language, assembly, stacks, input/output.</li><li><b>C and C++</b> (Ch 11–20): high-level code, always traced back down to the LC-3.</li></ol>`,
        `<p class="aside">The LC-3 is small, but it has every important feature of real processors such as Intel's and ARM's, without the clutter.</p>`,
      ]},
      { k: "check", title: "Which chapter?", b: [
        { t: "sort", q: "Where in the book does each topic live?", bins: ["Ch 2–3", "Ch 4–10", "Ch 11–20"], items: [
          ["Writing 35 as 00100011", 0, "Chapter 2: representing information in bits."],
          ["How transistors make an AND gate", 0, "Chapter 3: digital logic structures."],
          ["The LC-3's instruction set", 1, "Chapters 4 and 5."],
          ["Getting a keypress into the computer", 1, "Chapter 9: I/O."],
          ["A for loop in C", 2, "Chapter 13: control structures."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In your own words: why does the book say computers are not magic?", model: "Because a computer is deterministic and made of a huge number of very simple parts connected in an organized way. It does exactly what it's told. Once you understand the simple parts and how they're connected, layer by layer, nothing about it is mysterious." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Abstraction, and un-abstraction", mins: 20,
    blurb: "Hide the details so you can think. But be ready to open the box when something breaks.",
    takeaway: "Abstraction: a simpler way to interact with a system that hides the details you don't need (“take me to the airport” instead of turn-by-turn directions). It makes you far more productive. The catch: it only works while the details below are working. When they're not, you need to un-abstract (deconstruct): go back down to the parts. Stories: a car's “cooling system” fine for Palo Alto failed in the Arizona desert; the expert's bill: turning a screw $0.75, knowing which screw to turn $999.25. In computers: transistors → gates (think in 0s and 1s, not voltages) → logic circuits → bigger blocks. Rule: work at the highest level of abstraction that gets the job done, but when you combine components into a system, don't let their abstractions be the deepest level you understand.",
    steps: [
      { k: "learn", title: "Take me to the airport", b: [
        `<p>You say “take me to the airport”. You <i>could</i> give every turn, or even explain the pedals and the steering wheel. But you don't need to.</p>`,
        `<div class="key"><b>Abstraction</b> = a simpler way to deal with a system, hiding the details you don't need right now.</div>`,
        `<p>It saves time and brain power. You think about the big picture while the details stay in the background.</p>`,
      ]},
      { k: "learn", title: "When the details aren't fine", b: [
        `<p>Abstraction assumes everything underneath is working. When it isn't, you must <b>un-abstract</b>: go back down to the parts.</p>`,
        `<div class="two"><div class="tile"><h3>The cooling system</h3><p>“Check the cooling system” was fine for mild Palo Alto. In the Arizona desert, the same system wasn't enough. Two days waiting for a head gasket.</p></div><div class="tile"><h3>The expert's bill</h3><p>Turning one screw 35°: <b>$0.75</b>.<br>Knowing which screw to turn, and how far: <b>$999.25</b>.</p></div></div>`,
        `<p>Both stories say the same thing: the person who can see below the abstraction fixes the problem.</p>`,
      ]},
      { k: "play", title: "The computer's abstractions", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), note = el(`<p></p>`);
          const L = [
            ["Transistors", "Voltages and currents. Analog, messy, continuous.", "Debugging a gate that switches too slowly, or leaks."],
            ["Gates", "Think in 0s and 1s instead of voltages: AND, OR, NOT.", "A circuit gives a wrong output only when it's hot: look inside the gate."],
            ["Logic circuits", "Adders, decoders, latches: built from gates, used as blocks.", "An adder is too slow for the clock: look at the gates inside it."],
            ["Processor blocks", "ALU, registers, memory, control: the parts of the LC-3.", "A program crashes only on one machine: look at the hardware below."],
          ];
          function draw(k) {
            let s = "";
            L.forEach(([n], i) => {
              const y = 14 + (3 - i) * 50, hot = i === k;
              s += `<rect x="40" y="${y}" width="${200 + i * 40}" height="38" rx="8" style="fill:${hot ? "var(--accent-soft)" : "var(--card)"};stroke:${hot ? "var(--accent)" : "var(--line)"};stroke-width:${hot ? 2.5 : 1.2}"/>`;
              s += S.t(50, y + 24, n, { a: "start", cls: hot ? "b" : "" });
            });
            f.innerHTML = S.svg(420, 220, s, { max: 420, label: "Abstraction layers inside a computer" });
            note.innerHTML = `<b>${L[k][0]}:</b> ${L[k][1]}<br><span class="aside">When you'd go down to this level: ${L[k][2]}</span>`;
          }
          host.append(toggle(L.map((x) => x[0]), draw, 1), f, note);
          draw(1);
        },
        `<p class="aside">Each layer is built from the one below. Once you trust a layer, you stop thinking about what's inside it, until something goes wrong.</p>`,
      ]},
      { k: "predict", title: "Which way to go?", b: [
        { t: "mcq", q: "Your logic circuit, built from gates, gives the right answers on paper but fails on the real chip. What's the best next move?", opts: [
          ["Un-abstract: look inside the gates (timing, voltages, loading) to see what the 0/1 picture hides", true, "Yes. The gate abstraction says “output = A AND B”. It doesn't mention delay or voltage levels. That's where to look."],
          ["Re-check the truth table again and again", false, "If the logic is right on paper, the bug is below the logic abstraction."],
          ["Give up on gates and design with transistors from now on", false, "No. Keep the abstraction for designing; go down only to find this problem."],
        ]},
      ]},
      { k: "check", title: "The rule of thumb", b: [
        { t: "mcq", q: "Which sentence matches the book's advice?", opts: [
          ["Work at the highest level that gets the job done, but know the level below, especially when you combine parts into a system", true, "Exactly. Abstraction for speed; understanding below it for when parts don't work together."],
          ["Always work at the lowest level, so nothing is hidden", false, "You'd never finish anything. The book says to celebrate abstraction."],
          ["Never look below an abstraction; that defeats its purpose", false, "Then you're stuck the first time something breaks."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is abstraction, and when is it not enough?", model: "Abstraction is dealing with a system through a simpler view that hides details I don't need, like saying “take me to the airport”. It's not enough when something underneath isn't working, or when parts that each work fine don't work together. Then I need to un-abstract and look at the components below." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Hardware and software: no wall", mins: 15,
    blurb: "The best designers on either side understand the other side.",
    takeaway: "Hardware: the physical computer and its specifications. Software: programs (operating systems, databases, applications). Many people call themselves one or the other, as if a wall separated them. The book's second theme: don't build that wall. Hardware designers who know what programs need design better processors (example: video became common, so Intel added MMX instructions and special hardware; Motorola, IBM and Apple added AltiVec). Software designers who know the hardware write faster programs (example: which sorting program is best depends on the hardware; Knuth spent 391 pages on sorting). Later chapters tie software ideas to hardware: data types to word length, functions to the stack, recursion's cost, pointers to memory.",
    steps: [
      { k: "learn", title: "Two camps?", b: [
        `<div class="two"><div class="tile"><h3>Hardware</h3><p>The physical computer: processor, memory, wires, and their specifications.</p></div><div class="tile"><h3>Software</h3><p>The programs: Android, Linux, Windows; databases; apps like Chrome and Excel.</p></div></div>`,
        `<p>Many people say “I'm a hardware person” or “I'm a software person”, as if there were a wall between them.</p>`,
        `<div class="key">The book's second theme: <b>there is no wall.</b> Each side works best when designed by people who understand the other.</div>`,
      ]},
      { k: "learn", title: "Two examples", b: [
        `<div class="two"><div class="tile"><h3>Hardware that knows software</h3><p>Chip makers saw that programs would be full of video. So Intel added <b>MMX</b> instructions and special hardware to run them; Motorola, IBM and Apple added <b>AltiVec</b>.</p></div><div class="tile"><h3>Software that knows hardware</h3><p>There are many ways to sort a list. Which one is fastest depends heavily on the hardware it runs on.</p></div></div>`,
      ]},
      { k: "check", title: "Which direction?", b: [
        { t: "sort", q: "Is this hardware designed with software in mind, or software designed with hardware in mind?", bins: ["Hardware knows software", "Software knows hardware"], items: [
          ["Adding special instructions because phones will run lots of camera filters", 0, "The chip designer looked at what programs would need."],
          ["Choosing a sorting method that suits the computer's memory", 1, "The programmer used knowledge of the hardware."],
          ["Arranging an array so the program reads memory in order, which the hardware does fastest", 1, "Software shaped around how memory hardware behaves."],
          ["Adding hardware for AI math because neural-network programs need it", 0, "Hardware shaped by the programs it will run."],
        ]},
      ]},
      { k: "why", title: "Why this matters for a chip designer", b: [
        `<p>A chip designer who doesn't know what software will run on the chip can make it fast at the wrong things.</p>`,
        `<p>That's why this library has you learn the LC-3's programs (Patt & Patel) <i>and</i> the processor's hardware (Harris & Harris), before the transistors (CMOS VLSI).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Give one reason a hardware designer should understand software.", model: "The hardware is there to run programs. If you know what the programs need, like lots of video or AI math, you can add hardware that makes those jobs fast. Without that knowledge you might make the chip fast at things nobody uses." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const MPU = [[1971, 2300, "Intel 4004"], [1992, 3.1e6, "Pentium"], [2019, 5e9, "today (book)"]];
  const p4 = {
    id: "p4", title: "A computer system, then and now", mins: 20,
    blurb: "From a 30-ton room to a chip in your pocket. A factor of a million, twice over.",
    takeaway: "A computer = software (programs that direct the processing) + hardware (that does it). The hardware that does the processing is the CPU (central processing unit), processor or microprocessor: this book is about it and its programs. A computer system adds keyboard, mouse, monitor, memory, disks and USB storage, printers and the software. History: ENIAC (1943–45) had over 17,000 vacuum tubes, filled about 300 square feet, weighed 30 tons and used 140 kW. A 1980s Burroughs A-series machine: about 1 ton and 25 kW. Microprocessors: Intel 4004 (1971) had 2300 transistors; Pentium (1992) 3.1 million; today over 5 billion at up to 4 GHz. That's roughly a factor of a million in both transistor count and speed since 1971. A smartphone computes more than four million times faster than ENIAC. Much apparent “magic” (speech, face recognition) is simple operations done blazingly fast, many at once.",
    steps: [
      { k: "learn", title: "Software + hardware", b: [
        `<p>A <b>computer</b> is two things working together:</p>`,
        `<div class="two"><div class="tile"><h3>Software</h3><p>Programs that say what processing to do.</p></div><div class="tile"><h3>Hardware</h3><p>The parts that actually do it. The part that does the adding and deciding is the <b>CPU</b>, also called the <b>processor</b> or <b>microprocessor</b>.</p></div></div>`,
        `<p>A <b>computer system</b> adds the rest: keyboard, mouse, monitor, memory, disks, USB sticks, printer. This book is about the CPU and its programs.</p>`,
      ]},
      { k: "learn", title: "From ENIAC to your pocket", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>ENIAC (1945)</th><th>Burroughs A (1980s)</th><th>Smartphone</th></tr></thead><tbody>
          <tr><td>Size</td><td>~300 ft² of floor</td><td>50–60 ft²</td><td>fits in a pocket</td></tr>
          <tr><td>Weight</td><td>30 tons</td><td>~1 ton</td><td>~0.2 kg</td></tr>
          <tr><td>Power</td><td>140 kW</td><td>~25 kW</td><td>a few watts</td></tr>
          <tr><td>Parts</td><td>17,000+ vacuum tubes</td><td>boards of ICs</td><td>one chip, billions of transistors</td></tr></tbody></table></div>`,
        `<p>The book estimates a smartphone computes <b>more than four million times</b> faster than ENIAC.</p>`,
      ]},
      { k: "play", title: "A factor of a million", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let T = 2;
          function draw() {
            const pred = (y) => Math.log10(2300) + ((y - 1971) / T) * Math.log10(2);
            f.innerHTML = plot({ x: [1970, 2020], y: [3, 10.5], xt: [1970, 1980, 1990, 2000, 2010, 2020], yt: [3, 4, 5, 6, 7, 8, 9, 10], ytf: (v) => "10" + String(v).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join(""), xl: "year", yl: "transistors per chip", padL: 58,
              series: [{ f: pred, cls: "s2" }],
              marks: MPU.map(([y, n, lab]) => ({ x: y, y: Math.log10(n), label: lab, a: y > 2000 ? "end" : "start", dx: y > 2000 ? -12 : 12, dy: 18 })),
              label: "Transistor counts of microprocessors on a log scale, with a doubling line" });
            ro.innerHTML = readout([["Doubling every", fmt(T, 2) + " years"], ["Line predicts for 2019", si(Math.pow(10, pred(2019)), "") + " transistors"], ["Actual (book)", "about 5 billion"]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Doubling time", min: 1, max: 4, step: 0.05, value: T, show: (v) => fmt(v, 3) + " years" }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each grid line up is ×10. Find the doubling time that makes the line pass through all three chips. That steady doubling is called <b>Moore's law</b>.</p>`,
      ]},
      { k: "math", title: "Count the doublings", b: [
        `<p>From 2300 transistors to 5 billion. How many times did the count double? Solve 2300 × 2<sup>n</sup> = 5×10<sup>9</sup>:</p>`,
        `<div class="eq">n = log<sub>2</sub>(5×10<sup>9</sup> / 2300) = ln(5×10<sup>9</sup>/2300) / ln 2</div>`,
        { t: "num", q: "How many doublings is that?", a: 21.05, tol: 0.03, unit: "doublings", hint: "5×10⁹/2300 ≈ 2.17 million. Take ln of that and divide by ln 2 ≈ 0.693.", hint2: "ln(2.17×10⁶) ≈ 14.59. Divide by 0.693.", why: "About 21 doublings. 2²¹ ≈ 2.1 million: a factor of about two million, done by doubling 21 times in 48 years, roughly every 2.3 years." },
      ]},
      { k: "why", title: "Where the “magic” comes from", b: [
        `<p>Phones that understand speech and recognise faces look like magic. The book's point: it's <b>very simple operations, done blazingly fast, many at the same time</b>.</p>`,
        `<p>A million times faster lets you do a million things in the time one used to take. A million times more transistors lets you do many of them at once.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What two things improved by about a million times since 1971, and what does each buy you?", model: "The number of transistors on a chip and the speed each operation runs at. Speed means each operation takes a millionth of the time, so you can do a million things in the time one used to take. More transistors means you can do many things at the same time." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  /* Binary increment Turing machine: head starts on the rightmost bit. */
  function tmStep(st) {
    if (st.halt) return st;
    const sym = st.tape[st.pos];
    const tape = st.tape.slice();
    if (sym === "1") { tape[st.pos] = "0"; return { tape, pos: st.pos - 1, halt: false, n: st.n + 1, rule: "Read 1: write 0, carry, move left" }; }
    if (sym === "0") { tape[st.pos] = "1"; return { tape, pos: st.pos, halt: true, n: st.n + 1, rule: "Read 0: write 1, done (halt)" }; }
    tape[st.pos] = "1"; return { tape, pos: st.pos, halt: true, n: st.n + 1, rule: "Read blank: write 1, done (halt)" };
  }
  function tmFig(st) {
    const N = st.tape.length, w = 40, x0 = (420 - N * w) / 2;
    let s = "";
    st.tape.forEach((c, i) => {
      s += `<rect x="${x0 + i * w}" y="60" width="${w}" height="44" style="fill:${i === st.pos ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>`;
      s += S.t(x0 + i * w + w / 2, 89, c === " " ? "" : c, { cls: "big m" });
    });
    const hx = x0 + st.pos * w + w / 2;
    s += `<polygon class="nd" points="${hx},56 ${hx - 9},40 ${hx + 9},40"/>` + S.t(hx, 32, st.halt ? "halted" : "head", { cls: "s" });
    s += S.t(x0 - 6, 89, "…", { a: "end" }) + S.t(x0 + N * w + 6, 89, "…", { a: "start" });
    return S.svg(420, 130, s, { max: 420, label: "Turing machine tape with the head position" });
  }
  const p5 = {
    id: "p5", title: "Idea 1: every computer can compute the same things", mins: 25,
    blurb: "Digital beats analog, and a programmable machine is universal. Turing showed why.",
    takeaway: "Idea 1: all computers, big or small, fast or slow, cheap or expensive, can compute exactly the same things, given enough time and memory. Analog machines (slide rule, weights on a scale) compute by measuring a physical quantity, and their accuracy is hard to improve. Digital machines manipulate a finite set of digits: add digits for more accuracy (like a watch reading 10:35.16). Old digital machines (adding machines, the abacus, card sorters) each did one kind of computation. A computer is different: give it a new program and it does a new computation. It's a universal computational device. Alan Turing (1937) defined a Turing machine for each computation (e.g., TADD, TMUL; black-box models show what, not how). Turing's thesis: every computation can be done by some Turing machine (unproven, but well supported). He also described a universal Turing machine U that, given a description of any Turing machine plus data, does what that machine does. A computer with enough memory and U compute the same things, because both are programmable.",
    steps: [
      { k: "learn", title: "Analog vs digital", b: [
        `<div class="two"><div class="tile"><h3>Analog</h3><p>Computes by <b>measuring</b> something physical: a length on a slide rule, a weight on a scale. More accuracy needs ever finer measurement. Hard.</p></div><div class="tile"><h3>Digital</h3><p>Computes with a <b>finite set of digits</b>. More accuracy? Add a digit: a watch reading 10:35.16 instead of 10:35.</p></div></div>`,
        `<p>An analog watch accurate to 1/100 s would need a <i>very</i> long second hand. In this book “computer” always means a digital machine.</p>`,
        seen("Why digital systems tolerate noise: the static discipline and noise margins.", "05-digital-abstraction.html#p1", "Chapter 5"),
      ]},
      { k: "learn", title: "One machine, any computation", b: [
        `<p>Old digital machines did <b>one</b> job each: an adding machine adds, a card sorter sorts. Owning an adding machine and needing to multiply meant pencil and paper.</p>`,
        `<div class="key">A computer is different: give it a new <b>program</b> and it does a new computation. No new hardware. That makes it a <b>universal computational device</b>.</div>`,
      ]},
      { k: "learn", title: "Turing machines", b: [
        `<p>In 1937 Alan Turing asked: what <i>is</i> computation? He described simple machines that read and write symbols on a tape, following fixed rules.</p>`,
        fig(S.svg(420, 110, S.box(20, 30, 120, 50, "T_ADD") + S.arrow(-0, 55, 18, 55) + S.t(10, 22, "a, b", { a: "start", cls: "s" }) + S.arrow(142, 55, 190, 55) + S.t(166, 45, "a + b", { cls: "s" }) + S.box(230, 30, 120, 50, "T_MUL") + S.arrow(352, 55, 400, 55) + S.t(378, 45, "a × b", { cls: "s" }) + S.t(240, 22, "a, b", { a: "start", cls: "s" }), { label: "Black-box models of Turing machines that add and multiply" })),
        `<p>A <b>black box</b> says <i>what</i> a machine computes, not <i>how</i>. There are many ways to add.</p>`,
        `<p><b>Turing's thesis:</b> every computation can be done by some Turing machine. It's never been proved, but nothing has ever beaten it.</p>`,
      ]},
      { k: "play", title: "Run a Turing machine", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const inputs = ["1011", "0111", "1111"];
          let st;
          function reset(k) { const t = (" " + inputs[k] + " ").split(""); st = { tape: t, pos: t.length - 2, halt: false, n: 0, rule: "Start on the rightmost bit" }; draw(); }
          function draw() {
            f.innerHTML = tmFig(st);
            const val = parseInt(st.tape.join("").trim() || "0", 2);
            ro.innerHTML = readout([["Steps", String(st.n)], ["Tape reads (binary)", st.tape.join("").trim()], ["Value", String(val)]]);
            vd.className = "verdict " + (st.halt ? "ok" : "mid");
            vd.textContent = st.rule;
          }
          const stepBtn = el(`<button type="button" class="btn primary">Step</button>`);
          stepBtn.addEventListener("click", () => { st = tmStep(st); draw(); });
          let cur = 0;
          const row = el(`<div class="row"></div>`), rs = el(`<button type="button" class="btn">Reset</button>`);
          host.append(toggle(inputs.map((s) => "Start: " + s), (k) => { cur = k; reset(k); }), f, row, vd, ro);
          rs.addEventListener("click", () => reset(cur));
          row.append(stepBtn, rs);
          reset(0);
        },
        `<p class="aside">This machine adds 1 to a binary number using just three rules. Try 1111: watch the carry ripple all the way left.</p>`,
      ]},
      { k: "predict", title: "The universal machine", b: [
        `<p>Turing then described a machine <b>U</b>. You give U a <i>description</i> of any Turing machine, plus that machine's input, and U does what that machine would do.</p>`,
        fig(S.svg(420, 110, S.box(150, 30, 130, 50, "U") + S.arrow(30, 55, 148, 55) + S.t(30, 40, "T_ADD, T_MUL", { a: "start", cls: "s" }) + S.t(30, 78, "e, f, g", { a: "start", cls: "s" }) + S.arrow(282, 55, 330, 55) + S.t(336, 60, "g × (e + f)", { a: "start", cls: "s" }), { label: "Universal Turing machine computing g times e plus f" })),
        { t: "mcq", q: "What modern thing is U?", opts: [
          ["A programmable computer: the descriptions are the program, e, f, g are the data", true, "Yes. A computer with enough memory and U can compute exactly the same things, because both are programmable."],
          ["A very fast adding machine", false, "An adding machine does one job. U does any job you describe to it."],
          ["A machine more powerful than every Turing machine", false, "Turing showed U is itself a Turing machine. Trying to beat Turing machines this way fails."],
        ]},
      ]},
      { k: "check", title: "So which computer is more capable?", b: [
        { t: "mcq", q: "A $5000 workstation and a $5 microcontroller, both with enough memory. Which can compute more kinds of things?", opts: [
          ["Neither: they can compute exactly the same things; the workstation just does it faster", true, "Idea 1. Money buys speed, a nicer screen, more memory. Not new kinds of computation."],
          ["The workstation", false, "It's faster, not more capable. Given time and memory, the cheap one gets the same answers."],
          ["The microcontroller, because it's simpler", false, "Simpler doesn't mean more capable either. Both are universal."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a computer called a universal computational device?", model: "Because it's programmable. Instead of building a new machine for each kind of computation, you give it a new program. Turing showed a single universal machine can do whatever any particular Turing machine does, given its description and data. So any computer with enough time and memory can compute anything that can be computed." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Idea 2: the levels of transformation", mins: 25,
    blurb: "From English to electrons in seven steps. Problem, algorithm and program first.",
    takeaway: "Idea 2: problems are stated in human language but solved by electrons, so we transform them through levels: Problem → Algorithm → Program (language) → ISA → Microarchitecture → Logic circuits → Devices. At every level there are choices; ignoring a level means you can't make the best use of the system. Natural languages are ambiguous (“Time flies like an arrow” has at least three meanings), unacceptable to a computer. An algorithm is a step-by-step procedure with three properties: definiteness (each step precisely stated; “stir until lumpy” fails), effective computability (each step can be carried out; “take the largest prime” fails) and finiteness (it terminates). A problem has many algorithms: fewest steps, or more steps that run at the same time. Programs are written in mechanical (invented, unambiguous) languages. High-level languages (C, C++, Fortran, COBOL, Pascal, LISP, Prolog) are machine independent; low-level means assembly language, one per computer.",
    steps: [
      { k: "learn", title: "Seven levels", b: [
        `<p>We describe problems in English. Electrons solve them. In between is a sequence of <b>transformations</b>:</p>`,
        fig(ladder(-1)),
        `<p>At every level there are <b>choices</b>, and each choice affects cost and speed.</p>`,
      ]},
      { k: "play", title: "One problem, all the way down", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), note = el(`<div class="key"></div>`);
          function draw(k) {
            f.innerHTML = ladder(k);
            note.innerHTML = `<b>${LEVELS[k][0]}.</b> ${LEVELS[k][1]}<br><span class="aside">Who works here: ${LEVELS[k][2]}.</span>`;
          }
          host.append(toggle(LEVELS.map((l) => l[0].replace(" (language)", "")), draw, 0), f, note);
          draw(0);
        },
      ]},
      { k: "learn", title: "Why not just use English?", b: [
        `<p>Natural languages are full of <b>ambiguity</b>. “Time flies like an arrow” could be a simile about time, an order to time some flies the way an arrow would, or news that a kind of fly (“time flies”) likes an arrow.</p>`,
        `<p>People resolve ambiguity with tone and context. A computer can't. So the first step is to turn the problem into an <b>algorithm</b>.</p>`,
      ]},
      { k: "learn", title: "What makes an algorithm", b: [
        `<p>An <b>algorithm</b> is a step-by-step procedure that always ends, where every step is precise and doable. Three properties:</p>`,
        `<div class="two"><div class="tile"><h3>Definiteness</h3><p>Each step is precisely stated. “Stir until lumpy” fails: how lumpy?</p></div><div class="tile"><h3>Effective computability</h3><p>Each step can be carried out. “Take the largest prime” fails: there isn't one.</p></div></div>`,
        `<div class="tile"><h3>Finiteness</h3><p>The procedure terminates.</p></div>`,
      ]},
      { k: "check", title: "Which property fails?", b: [
        { t: "sort", q: "Each “algorithm” breaks one rule. Which?", bins: ["Definiteness", "Effective computability", "Finiteness"], items: [
          ["“Add a pinch of salt.”", 0, "How much is a pinch? Not precise."],
          ["“Write down every digit of π, then stop.”", 2, "π never ends, so this never terminates. (Each step is clear and doable; it just never stops.)"],
          ["“Divide the total by the number of items” when there might be zero items", 1, "Dividing by zero can't be carried out. The step isn't always doable."],
          ["“Keep adding 1 to x while x > 0”, starting at x = 1", 2, "x only grows. It loops forever (on paper, at least)."],
          ["“Sort them nicely.”", 0, "What order is “nicely”?"],
        ]},
      ]},
      { k: "learn", title: "Many algorithms, then a program", b: [
        `<p>Every problem has many algorithms. One takes the fewest steps; another takes more steps but lets several run <b>at the same time</b>, finishing sooner on a machine that can do that.</p>`,
        `<p>The algorithm is then written as a <b>program</b> in a <b>mechanical language</b>: invented on purpose, so it has no ambiguity.</p>`,
        `<div class="two"><div class="tile"><h3>High-level</h3><p>C, C++, Fortran, COBOL, Pascal, LISP, Prolog. Far from the hardware; ideally <b>machine independent</b>.</p></div><div class="tile"><h3>Low-level</h3><p><b>Assembly language</b>: tied to one computer. Usually one per computer.</p></div></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't we give a computer a problem in plain English, and what fixes that?", model: "English is ambiguous: one sentence can mean several things, and people use tone and context to pick. A computer can't. So we turn the problem into an algorithm, a procedure where every step is precise, doable, and the whole thing ends, and then write it in a programming language that was designed to have no ambiguity." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "ISA, microarchitecture, circuits, devices", mins: 25,
    blurb: "The contract between software and hardware, and the many ways to honour it.",
    takeaway: "ISA (instruction set architecture): the complete specification of the interface between programs and the hardware that runs them. It specifies the opcodes (operations), the data types (representations of operands the hardware can operate on), the addressing modes (how to find operands), and the number of memory locations and bits in each. ISAs range from about six opcodes to several hundred; x86 has over 200 opcodes, more than a dozen data types and over two dozen addressing modes. Others: ARM and THUMB, POWER, z/Architecture, SPARC. A compiler translates a high-level language to an ISA (one per language and target); an assembler translates assembly. Car analogy: the pedals and wheel are the car's “ISA” (same in every car, one driver's license); what's under the hood is the microarchitecture. A microarchitecture is one implementation of an ISA, a cost/performance/energy trade-off: x86 has had the 8086, 80286, 80386, 80486, Pentium IV, Skylake… Below that, logic circuits (several adder designs, each a speed/cost trade-off) and devices (CMOS, NMOS, gallium arsenide). At every level, the choices set the cost and performance of the computer.",
    steps: [
      { k: "learn", title: "The ISA: a contract", b: [
        `<p>The <b>instruction set architecture</b> is the full specification of what software can ask the hardware to do. It lists:</p>`,
        `<ul><li><b>Opcodes</b>: the operations (ADD, LOAD, BRANCH…).</li><li><b>Data types</b>: the representations of operands the hardware can operate on (integers, floating point…). An operand is one data value.</li><li><b>Addressing modes</b>: how an instruction says where its operands are.</li><li><b>Memory</b>: how many locations, and how many bits in each.</li></ul>`,
        `<p class="aside">Sizes vary a lot: some ISAs have about six opcodes. x86 has over 200 opcodes, more than a dozen data types and over two dozen addressing modes.</p>`,
      ]},
      { k: "learn", title: "The car analogy", b: [
        `<div class="two"><div class="tile"><h3>The car's “ISA”</h3><p>Brake in the middle, accelerator on the right, steering wheel, ignition. The <b>same in every car</b>: one driver's license works for all.</p></div><div class="tile"><h3>The car's “microarchitecture”</h3><p>Under the hood: disc or drum brakes, 4 or 8 cylinders, turbo or not. <b>Different in every model</b>, chosen for cost vs performance.</p></div></div>`,
        `<div class="key">ISA = <b>what</b> the hardware promises. Microarchitecture = <b>how</b> one particular chip keeps that promise.</div>`,
      ]},
      { k: "check", title: "ISA or microarchitecture?", b: [
        { t: "sort", q: "Is this part of the ISA (the contract) or the microarchitecture (one implementation)?", bins: ["ISA", "Microarchitecture"], items: [
          ["There is an ADD instruction that adds two registers", 0, "Programs rely on it, so it's in the contract."],
          ["The adder uses a fast carry-lookahead circuit", 1, "Programs can't tell how the adder is built, only how fast it is."],
          ["Each memory location holds 16 bits", 0, "The ISA specifies the size of each location."],
          ["The chip works on 4 instructions at the same time", 1, "An implementation choice. The program's results are the same."],
          ["The ways an instruction can say where its operand is", 0, "Addressing modes are part of the ISA."],
          ["How much cache memory the chip has", 1, "Affects speed, not what programs mean."],
        ]},
      ]},
      { k: "learn", title: "One ISA, many chips", b: [
        `<p>x86 has been built many ways: 8086 (1979), 80286, 80386, 80486, Pentium IV (2001), Skylake (2015)… Same programs run on all of them. Each is a different trade-off between <b>cost, performance and energy</b>.</p>`,
        `<p><b>Translators</b> carry programs down to the ISA:</p>`,
        `<div class="two"><div class="tile"><h3>Compiler</h3><p>High-level language → ISA. You need one for each language and each target ISA (a C-to-x86 compiler, a C-to-ARM compiler…).</p></div><div class="tile"><h3>Assembler</h3><p>That computer's assembly language → its ISA.</p></div></div>`,
      ]},
      { k: "learn", title: "The bottom two levels", b: [
        `<p><b>Logic circuits:</b> each block of the microarchitecture is built from gates. Even an adder has several designs: faster ones cost more gates.</p>`,
        `<p><b>Devices:</b> each circuit is built in a device technology. CMOS circuits differ from NMOS circuits, which differ from gallium arsenide circuits.</p>`,
        fig(ladder(-1, { chip: true })),
        `<p class="aside">The shaded levels are where chip designers work. Harris & Harris covers microarchitecture and logic; CMOS VLSI covers circuits and devices.</p>`,
      ]},
      { k: "predict", title: "Where does this choice live?", b: [
        { t: "mcq", q: "A team makes a phone chip use less battery by running the same instructions with simpler, slower hardware. Which level did they change?", opts: [
          ["The microarchitecture: same ISA, a different cost/performance/energy trade-off", true, "Yes. The programs don't change, so the ISA didn't change."],
          ["The ISA", false, "If the ISA changed, existing programs might stop working. Here they run unchanged."],
          ["The algorithm", false, "The programs and their algorithms are the same. Only the hardware underneath changed."],
        ]},
      ]},
      { k: "check", title: "Put them in order", b: [
        { t: "mcq", q: "A C program reaches the electrons. Which order is right?", opts: [
          ["C program → (compiler) → ISA instructions → microarchitecture → logic circuits → transistors", true, "That's the path down the levels."],
          ["C program → (assembler) → microarchitecture → ISA → transistors", false, "C goes through a compiler, and the ISA sits above the microarchitecture."],
          ["C program → logic circuits → ISA → transistors", false, "The ISA is the interface right below the program; circuits come later."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain the difference between an ISA and a microarchitecture, using any analogy you like.", model: "The ISA is the contract: the instructions, data types and addressing modes a program can use, the same on every chip that implements it. The microarchitecture is how one particular chip carries out that contract: its adders, how many instructions it works on at once, its cache. Like a car: every car has the same pedals and wheel (the ISA), but the engine and brakes underneath differ from model to model (the microarchitecture)." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp1", eyebrow: "Patt & Patel · Chapter 1", title: "Welcome Aboard",
    intro: `<p>Seven short parts: why computers aren't magic, the book's two themes (abstraction, and hardware and software together), a little history, and the two big ideas: every computer can compute the same things, and problems reach the electrons through seven levels of transformation.</p><p>No math or circuits needed. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. They test whether the ideas stuck, so don't expect them to look like the questions here.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>Two themes</h3>
      <p><b>Abstraction:</b> hide details to work faster; un-abstract (go down a level) when something breaks or parts don't fit together. <b>Hardware and software:</b> no wall; each is designed best by people who understand the other.</p>
      <h3>History</h3>
      <p>ENIAC: 17,000+ tubes, 30 tons, 140 kW. Intel 4004 (1971): 2300 transistors. Today: 5 billion+, ~4 GHz. About ×10<sup>6</sup> in both count and speed.</p>
      <h3>Idea 1: universality</h3>
      <p>Given enough time and memory, every computer can compute the same things. Digital beats analog (add digits for accuracy). Turing machines; Turing's thesis; the universal Turing machine U ≈ a programmable computer.</p>
      <h3>Idea 2: levels of transformation</h3>
      <div class="eq">Problem → Algorithm → Program → ISA → Microarchitecture → Logic circuits → Devices</div>
      <p>Algorithm: definiteness, effective computability, finiteness. ISA: opcodes, data types, addressing modes, memory size. Compiler: high-level language → ISA. Assembler: assembly → ISA. Microarchitecture: one implementation of an ISA (cost, performance, energy).</p>`,
  };
  Course.start(window.CHAPTER);
})();

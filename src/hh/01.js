(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { bits, uval, sval, bitRow, bitButtons, truthTable, gate, inverter, nand2, nor2 } = Digital;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="../pp/${href}">${where} →</a></div>`;
  const seenB = (html, href, where) => `<div class="key"><b>Seen in Boylestad:</b> ${html} <a href="../edc/${href}">${where} →</a></div>`;
  const mono = (s) => `<span class="mono">${s}</span>`;

  const HLEV = [["Application software", "programs"], ["Operating systems", "device drivers"], ["Architecture", "instructions, registers"], ["Microarchitecture", "datapaths, controllers"], ["Logic", "adders, memories"], ["Digital circuits", "AND gates, NOT gates"], ["Analog circuits", "amplifiers, filters"], ["Devices", "transistors, diodes"], ["Physics", "electrons"]];
  function levels(on) {
    let s = "";
    HLEV.forEach(([n, ex], i) => {
      const y = 8 + i * 30, hot = i === on, book = i >= 2 && i <= 5;
      s += `<rect x="20" y="${y}" width="200" height="25" rx="6" style="fill:${hot ? "var(--accent-soft)" : book ? "var(--cool-soft)" : "var(--card)"};stroke:${hot ? "var(--accent)" : "var(--line)"};stroke-width:${hot ? 2.5 : 1}"/>`;
      s += S.t(30, y + 17, n, { a: "start", cls: hot ? "s b" : "s" }) + S.t(232, y + 17, ex, { a: "start", cls: "s m" });
    });
    return S.svg(420, 282, s, { max: 420, label: "Levels of abstraction for an electronic computing system" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Managing complexity", mins: 20,
    blurb: "Abstraction, discipline, and the three -y's: hierarchy, modularity, regularity.",
    takeaway: "A microprocessor may be the first system you build that's too complex to hold in your head; managing complexity is the book's main theme. Abstraction hides details that don't matter. Levels for a computer: physics (electrons) → devices (transistors, diodes) → analog circuits (amplifiers, filters) → digital circuits (gates) → logic (adders, memories) → microarchitecture (datapaths, controllers) → architecture (instructions, registers; the programmer's view, e.g. x86) → operating systems → application software. This book covers digital circuits to architecture. Know the levels just above and below yours. Discipline: intentionally restricting your design choices so you can work productively at a higher level (interchangeable rifle parts; digital circuits are a restricted subset of analog circuits but far easier to combine). The three -y's: hierarchy (divide into modules, then submodules), modularity (well-defined functions and interfaces, no side effects), regularity (uniform, reusable modules).",
    steps: [
      { k: "learn", title: "Too big for one head", b: [
        `<p>A microprocessor has millions or billions of transistors. Nobody can write and solve the equations for all of them at once.</p>`,
        `<p>This book's goal is that you design and build your own microprocessor. To get there you need ways to <b>manage complexity</b>. Three of them: abstraction, discipline, and the three -y's.</p>`,
      ]},
      { k: "play", title: "Levels of abstraction", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          function draw(k) { f.innerHTML = levels(k); }
          host.append(toggle(["Physics", "Devices", "Digital circuits", "Microarchitecture", "Architecture"], (k) => draw([8, 7, 5, 3, 2][k]), 2), f);
          draw(5);
        },
        `<p>This book works in the shaded levels: from <b>digital circuits</b> up to <b>architecture</b>. Microarchitecture links logic to architecture: one architecture (x86) can be built by many microarchitectures (Core i7, 80486, Athlon).</p>`,
        seenPP("The same idea as the levels of transformation, from problem down to devices.", "01-welcome-aboard.html#p6", "Chapter 1, Part 6"),
      ]},
      { k: "why", title: "Know your neighbours", b: [
        `<p>When you work at one level, know a little about the levels just <b>above and below</b>. A programmer can't fully optimize code without knowing the architecture. A device engineer can't make wise transistor trade-offs without knowing the circuits they'll be used in.</p>`,
      ]},
      { k: "learn", title: "Discipline", b: [
        `<p><b>Discipline</b> = deliberately restricting your choices so you can work at a higher level.</p>`,
        `<div class="two"><div class="tile"><h3>Interchangeable parts</h3><p>Until the 1800s, each rifle part was hand-filed to fit. Standard parts with set tolerances meant rifles could be built and repaired fast, with less skill.</p></div><div class="tile"><h3>The digital discipline</h3><p>Digital circuits use only discrete voltages: a <b>subset</b> of what analog circuits can do. But they combine so easily that digital systems end up beating analog ones (TV, CDs, phones).</p></div></div>`,
      ]},
      { k: "learn", title: "The three -y's", b: [
        `<div class="tile"><h3>Hierarchy</h3><p>Divide the system into modules, then divide those, until each piece is easy to understand. Rifle → lock, stock, barrel → the lock's trigger, hammer, flint…</p></div>`,
        `<div class="tile"><h3>Modularity</h3><p>Each module has a well-defined <b>function</b> and <b>interface</b>, and no side effects. Any stock of the right length and mounting pins fits the barrel.</p></div>`,
        `<div class="tile"><h3>Regularity</h3><p>Make modules uniform so the same one is reused many times. Identical barrels come off an assembly line.</p></div>`,
      ]},
      { k: "check", title: "Which principle?", b: [
        { t: "sort", q: "Which complexity tool does each design decision use?", bins: ["Hierarchy", "Modularity", "Regularity", "Discipline"], items: [
          ["A processor is split into datapath and control, and the datapath into ALU, registers and multiplexers", 0, "Breaking a system into modules and submodules."],
          ["An adder block has inputs A, B and output S, and works the same whatever is around it", 1, "A clear function and interface, no side effects."],
          ["A 32-bit adder is built from 32 copies of the same 1-bit cell", 2, "One module, reused many times."],
          ["Every gate output must be a valid 0 or 1, never something in between", 3, "Restricting voltages to two levels: the digital discipline."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between abstraction and discipline?", model: "Abstraction is hiding details that don't matter, so I can think about a system at a higher level, like treating a gate as AND instead of transistors. Discipline is deliberately restricting my own design choices so that higher-level thinking stays valid, like only allowing voltages that are clearly 0 or 1, so gates can be connected freely." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The digital abstraction and information", mins: 15,
    blurb: "Discrete values instead of continuous ones, and how many bits a variable carries.",
    takeaway: "Most physical variables (voltage, frequency, position) are continuous. Digital systems use discrete-valued variables with a finite number of values. Babbage's Analytical Engine (1834–1871) used gears with ten positions, 25 rows for 25-digit precision. Electronic computers use binary (two values) because two voltages are easier to tell apart than ten. Information in a variable with N distinct states: D = log₂N bits. A binary variable carries 1 bit; a 10-position gear log₂10 ≈ 3.322 bits. A continuous signal in theory carries infinite information, but noise and measurement error limit it to about 10–16 bits in practice (about 8 if measured fast). George Boole's logic: variables TRUE or FALSE. In this book 1 = TRUE = HIGH and 0 = FALSE = LOW. The digital abstraction lets designers ignore whether bits are voltages, gears or fluid levels.",
    steps: [
      { k: "learn", title: "Continuous vs discrete", b: [
        `<p>Voltage on a wire, a frequency, a position: <b>continuous</b>, any value in a range. Digital systems use <b>discrete</b> variables with a finite number of values.</p>`,
        `<p>Babbage's Analytical Engine (1834–1871) was digital and mechanical: gears with <b>ten</b> positions, 0–9, in 25 rows for 25-digit numbers. Electronic computers use <b>two</b> values, because two voltages are much easier to tell apart than ten.</p>`,
      ]},
      { k: "learn", title: "How much information?", b: [
        `<p>A variable that can be in one of N distinct states carries</p>`,
        `<div class="eq">D = log<sub>2</sub>N bits</div>`,
        `<p>A binary variable: log<sub>2</sub>2 = <b>1 bit</b>. One of Babbage's gears: log<sub>2</sub>10 ≈ <b>3.322 bits</b>, since 2<sup>3.322</sup> = 10.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many bits of information are in one card drawn from a 52-card deck?", a: 5.70, tol: 0.01, unit: "bits", hint: "log₂52 = ln 52 / ln 2.", why: "log₂52 ≈ 5.70 bits. So you'd need 6 wires to send it as a binary code." },
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "In theory a continuous voltage can take infinitely many values, so it holds infinite information. Why don't we get that in practice?", opts: [
          ["Noise and measurement error blur values that are close together, leaving about 10–16 usable bits (fewer if you measure fast)", true, "That's the real limit. And it's why discrete values, far apart, are so robust."],
          ["Wires can only carry a few voltages", false, "A wire can carry any voltage. The problem is reading it accurately."],
          ["Infinite information would take infinite power", false, "Not the reason the book gives. Noise is."],
        ]},
      ]},
      { k: "learn", title: "1, TRUE, HIGH", b: [
        `<p>George Boole (1854) built a logic of variables that are TRUE or FALSE, with three operations: AND, OR, NOT. That's <b>Boolean logic</b>.</p>`,
        `<p>In this book, 1 = TRUE = HIGH (a positive voltage) and 0 = FALSE = LOW (0 V). The digital abstraction lets you think in 1s and 0s without caring whether they're voltages, gear positions or water levels.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do electronic computers use two values per variable instead of ten, like Babbage's gears?", model: "Because it's much easier, and more reliable in the presence of noise, to tell two voltages apart than ten. Each binary variable carries less information (1 bit instead of about 3.3), but you just use more of them." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Number systems, bytes and powers of two", mins: 20,
    blurb: "A quick recap of binary and hex, plus bytes, words, msb and lsb, and estimating 2^N in your head.",
    takeaway: "Base 10 column weights 1, 10, 100…; an N-digit decimal number has range 0 to 10^N − 1. Base 2: weights 1, 2, 4… (learn them up to 2^16 = 65536); N bits give 0 to 2^N − 1. Write the base as a subscript: 10110₂ = 22₁₀. Decimal to binary: from the left (subtract the largest power of 2 that fits) or from the right (divide by 2, remainders). Hexadecimal (base 16): digits 0–9, A–F; each hex digit is 4 bits; 2ED₁₆ = 2×256 + 14×16 + 13 = 749. Decimal to hex: divide by 16 repeatedly. Byte = 8 bits (256 values); nibble = 4 bits (one hex digit); word = the chunk a processor handles (64 bits on most computers in 2012; 8 or 16 bits in simple gadgets). lsb/msb = least/most significant bit; LSB/MSB = least/most significant byte. 2^10 = 1024 ≈ 10³ (kilo), 2^20 ≈ 10⁶ (mega), 2^30 ≈ 10⁹ (giga): 2^24 = 2^4 × 2^20 ≈ 16 million. KB, MB, GB for bytes (memory); Kb, Mb for bits (communication speed, bits/s).",
    steps: [
      { k: "learn", title: "Recap", b: [
        `<p>You've seen binary and hex in Patt & Patel. Harris & Harris adds one habit: write the <b>base as a subscript</b> when it could be confused.</p>`,
        `<div class="eq">10110<sub>2</sub> = 16 + 4 + 2 = 22<sub>10</sub>     2ED<sub>16</sub> = 2×256 + 14×16 + 13 = 749<sub>10</sub></div>`,
        seenPP("Unsigned integers, conversions and hexadecimal.", "02-bits-data-types.html#p2", "Chapter 2, Parts 2, 5 and 10"),
      ]},
      { k: "learn", title: "Decimal → hex", b: [
        `<p>Two ways, like binary:</p>`,
        `<div class="two"><div class="tile"><h3>From the left</h3><p>500: 256 goes in once (1), leaving 244. 16 goes in 15 times (F), leaving 4. So <b>1F4</b>.</p></div><div class="tile"><h3>From the right</h3><p>500/16 = 31 r <b>4</b>. 31/16 = 1 r <b>15 (F)</b>. 1/16 = 0 r <b>1</b>. Read up: <b>1F4</b>.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "What is 3A7₁₆ in decimal?", a: 935, tol: 0, hint: "3×256 + A×16 + 7, with A = 10.", why: "768 + 160 + 7 = 935." },
        { t: "mcq", q: "What is 1101 0110 1011₂ in hex?", opts: [["D6B", true, "1101 = D, 0110 = 6, 1011 = B."], ["B6D", false, "That's backwards. Keep the groups in order."], ["D5B", false, "0110 is 6, not 5."]] },
      ]},
      { k: "learn", title: "Bytes, nibbles, words", b: [
        `<div class="two"><div class="tile"><h3>Byte</h3><p>8 bits, 256 values. Memory sizes are measured in bytes.</p></div><div class="tile"><h3>Nibble</h3><p>4 bits. One hex digit. (Not used much now, “but the term is cute”.)</p></div></div>`,
        `<p>A <b>word</b> is the chunk a processor handles at once: 64 bits for most computers in 2012, 32 for older ones, 8 or 16 in toasters.</p>`,
        fig(S.svg(420, 110, bitRow("101100", { x0: 20, y: 30, w: 30 }) + S.t(35, 92, "msb", { cls: "s a" }) + S.t(185, 92, "lsb", { cls: "s a" }) + S.t(330, 54, "DEAFDAD8", { cls: "big m" }) + S.t(285, 92, "MSB", { cls: "s a" }) + S.t(378, 92, "LSB", { cls: "s a" }) + S.t(110, 18, "a 6-bit number", { cls: "s" }) + S.t(330, 18, "a 4-byte word in hex", { cls: "s" }), { label: "Most and least significant bit and byte" })),
        `<p class="aside">Lowercase msb/lsb = <b>bit</b>; uppercase MSB/LSB = <b>byte</b>.</p>`,
      ]},
      { k: "play", title: "Powers of two in your head", b: [
        (host, id) => {
          const ro = el(`<div></div>`), note = el(`<p class="aside"></p>`);
          let n = 24;
          const names = ["", "thousand (kilo)", "million (mega)", "billion (giga)", "trillion (tera)"];
          function draw() {
            const hi = Math.floor(n / 10), lo = n % 10;
            ro.innerHTML = readout([["2^" + n, "= 2^" + lo + " × 2^" + hi * 10], ["Estimate", (2 ** lo) + (hi ? " " + names[hi] : "")], ["Exact", (2 ** n).toLocaleString()]]);
            note.textContent = hi ? `Split ${n} into ${hi * 10} + ${lo}. 2^${hi * 10} ≈ 1 ${names[hi].split(" ")[0]}, and 2^${lo} = ${2 ** lo}.` : `Below 2^10, just know it: 2^${lo} = ${2 ** lo}.`;
          }
          host.append(slider({ id: id + "-n", label: "Exponent N", min: 0, max: 42, step: 1, value: n, show: (x) => String(x) }, (x) => { n = x; draw(); }).el, ro, note);
          draw();
        },
        `<div class="key">2<sup>10</sup> = 1024 ≈ 10<sup>3</sup>. So kilo, mega, giga mean 2<sup>10</sup>, 2<sup>20</sup>, 2<sup>30</sup> for memory: 1 KB = 1024 bytes.</div>`,
      ]},
      { k: "check", title: "Estimate", b: [
        { t: "mcq", q: "About how many different addresses can a 34-bit address name?", opts: [["About 16 billion", true, "2³⁴ = 2⁴ × 2³⁰ ≈ 16 × 1 billion."], ["About 34 billion", false, "Exponents don't scale linearly: 2³⁴ is 2⁴ × 2³⁰."], ["About 1.6 million", false, "2³⁴ is far bigger than 2²⁰ ≈ 1 million."]] },
        { t: "mcq", q: "A link runs at “100 Mb/s”. Is that megabits or megabytes per second?", opts: [["Megabits: lowercase b means bits, and communication speed is usually given in bits/s", true, "100 Mb/s is 12.5 MB/s."], ["Megabytes", false, "Uppercase B is bytes. Speeds use bits."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How would you estimate 2^27 without a calculator?", model: "Split the exponent into a multiple of ten plus the rest: 2^27 = 2^7 × 2^20. 2^20 is about a million and 2^7 is 128, so 2^27 is about 128 million." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Addition, overflow and signed numbers", mins: 20,
    blurb: "Unsigned overflow is a carry out. In 2's complement, the msb simply weighs −2^(N−1).",
    takeaway: "Binary addition carries when a column sum exceeds 1. Digital systems use a fixed number of bits; unsigned addition overflows when the result exceeds 2^N − 1, detected by a carry out of the msb (the extra bit is discarded). Sign/magnitude: msb is the sign, the other N−1 bits the magnitude; range [−2^(N−1)+1, 2^(N−1)−1]; two zeros; ordinary addition fails. Two's complement: like unsigned, except the msb has weight −2^(N−1). Zero is all 0s; most positive 01…1 = 2^(N−1) − 1; most negative 10…0 = −2^(N−1) (the “weird number”, whose negation is itself); −1 is all 1s. Negate by inverting and adding 1. Range [−2^(N−1), 2^(N−1) − 1]. Ordinary addition works; discard the carry out. A carry out does NOT mean overflow; overflow is when both addends have the same sign and the result has the opposite sign. Sign extension copies the sign bit. The Ariane 5 rocket (1996) was lost when its control computer overflowed a 16-bit range: code tested on the slower Ariane 4 met larger values.",
    steps: [
      { k: "learn", title: "Unsigned overflow", b: [
        `<p>A 4-bit unsigned number holds 0 to 15. Add 11 + 6:</p>`,
        `<div class="eq mono">  1011<br>+ 0110<br>= <b>1</b>0001</div>`,
        `<p>17 needs 5 bits. Stored in 4, the top bit is dropped and you get 0001 = 1. For unsigned numbers, <b>a carry out of the msb means overflow</b>.</p>`,
      ]},
      { k: "learn", title: "A new way to see 2's complement", b: [
        `<p>Harris & Harris defines 2's complement in one line: <b>it's unsigned binary, except the msb's weight is negative</b>, −2<sup>N−1</sup>.</p>`,
        fig(S.svg(420, 90, bitRow("1011", { top: ["−8", "4", "2", "1"], w: 40 }), { label: "Four-bit two's complement weights" })),
        `<div class="eq">1011 = −8 + 2 + 1 = −5</div>`,
        seenPP("2's complement built from “A + (−A) = 0”, and the flip-and-add-1 rule.", "02-bits-data-types.html#p4", "Chapter 2, Part 4"),
      ]},
      { k: "play", title: "Three systems, one number line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          function draw(b) {
            const sm = (b[0] === "1" ? -1 : 1) * uval(b.slice(1));
            f.innerHTML = S.svg(420, 90, bitRow(b, { top: ["−8 | 8 | ±", "4", "2", "1"], w: 44, sign: true }), { label: "Four-bit pattern" });
            ro.innerHTML = readout([["Unsigned", String(uval(b))], ["Two's complement", String(sval(b))], ["Sign/magnitude", (b === "1000" ? "−0" : String(sm))]]);
          }
          const bb = bitButtons("1000", draw, { label: "Four bits" });
          host.append(bb.el, f, ro);
          draw(bb.get());
        },
        `<p class="aside">Start with 1000. In 2's complement it's −8, the <b>weird number</b>: flip it (0111) and add 1, and you get 1000 again. It has no positive partner. In sign/magnitude, 1000 is −0.</p>`,
      ]},
      { k: "learn", title: "Ranges", b: [
        `<div class="tbl"><table><thead><tr><th>System</th><th>Range of N bits</th><th>4 bits</th></tr></thead><tbody>
          <tr><td>Unsigned</td><td>[0, 2<sup>N</sup> − 1]</td><td>0 … 15</td></tr>
          <tr><td>Sign/magnitude</td><td>[−2<sup>N−1</sup> + 1, 2<sup>N−1</sup> − 1]</td><td>−7 … 7 (two zeros)</td></tr>
          <tr><td>Two's complement</td><td>[−2<sup>N−1</sup>, 2<sup>N−1</sup> − 1]</td><td>−8 … 7</td></tr></tbody></table></div>`,
        `<p class="aside">Unless a problem says otherwise, “signed” means two's complement.</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student computes 4-bit −3 + 5 = ${mono("1101 + 0101 = 10010")} and says: “There's a carry out, so it overflowed.”</p>`,
        { t: "mcq", q: "Is that right?", opts: [
          ["No: in 2's complement a carry out doesn't mean overflow. Drop it: 0010 = 2, correct. Overflow needs same-sign inputs and an opposite-sign result", true, "A carry out signals overflow only for unsigned numbers."],
          ["Yes: any carry out is overflow", false, "That rule is for unsigned addition only."],
          ["Yes, because 1101 is negative", false, "Mixed signs can never overflow."],
        ]},
      ]},
      { k: "why", title: "Why it matters: Ariane 5", b: [
        `<p>On June 4, 1996, the $7 billion Ariane 5 rocket veered off course 40 seconds after launch and exploded. Its control computer overflowed a 16-bit range and crashed.</p>`,
        `<p>The code had been tested thoroughly on Ariane 4. But Ariane 5's faster engine produced larger values. Same code, new numbers, overflow.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you detect overflow for unsigned addition, and for two's complement addition?", model: "Unsigned: overflow happens exactly when there's a carry out of the most significant bit. Two's complement: ignore the carry out; overflow happens when both numbers have the same sign but the result has the other sign. Adding a positive and a negative number never overflows." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const GATES = {
    NOT: [1, (a) => 1 - a[0], "Y = A̅"], BUF: [1, (a) => a[0], "Y = A"],
    AND: [2, (a) => a[0] & a[1], "Y = AB"], OR: [2, (a) => a[0] | a[1], "Y = A + B"],
    XOR: [2, (a) => a[0] ^ a[1], "Y = A ⊕ B"], NAND: [2, (a) => 1 - (a[0] & a[1]), "Y = (AB)̅"],
    NOR: [2, (a) => 1 - (a[0] | a[1]), "Y = (A + B)̅"], XNOR: [2, (a) => 1 - (a[0] ^ a[1]), "Y = (A ⊕ B)̅"],
  };
  const p5 = {
    id: "p5", title: "Logic gates", mins: 25,
    blurb: "NOT, buffer, AND, OR, XOR, NAND, NOR, XNOR, and gates with many inputs.",
    takeaway: "Logic gates take binary inputs and produce a binary output; described by a symbol, a truth table (inputs listed in counting order 00, 01, 10, 11) or a Boolean equation. NOT (inverter): Y = A̅. Buffer: Y = A; logically just a wire, but electrically it can drive large currents or many gates fast (the digital abstraction hides its purpose). A bubble means inversion. AND: Y = AB, TRUE only if all inputs are TRUE. OR: Y = A + B, TRUE if any input is TRUE. XOR: Y = A ⊕ B, TRUE if A or B but not both. NAND = NOT AND (TRUE unless all inputs TRUE); NOR = NOT OR (TRUE only if no input is TRUE); XNOR = NOT XOR, the equality gate (TRUE when inputs are equal). N-input AND: TRUE when all N inputs are TRUE; N-input OR: TRUE when at least one is; N-input XOR (parity gate): TRUE when an odd number of inputs are TRUE.",
    steps: [
      { k: "learn", title: "Gates and their notation", b: [
        `<p>A <b>logic gate</b> is a small digital circuit: binary inputs in, one binary output. Inputs are usually A, B, C…; the output is Y.</p>`,
        `<div class="tbl"><table><thead><tr><th>Gate</th><th>Equation</th><th>TRUE when</th></tr></thead><tbody>
          <tr><td>NOT</td><td>Y = A̅</td><td>A is FALSE</td></tr><tr><td>AND</td><td>Y = AB</td><td>all inputs TRUE</td></tr>
          <tr><td>OR</td><td>Y = A + B</td><td>any input TRUE</td></tr><tr><td>XOR</td><td>Y = A ⊕ B</td><td>A or B but not both</td></tr></tbody></table></div>`,
        `<p class="aside">The bar over A is read “NOT A”. Other books write A′, ¬A, !A or ~A. AB means A AND B; + means OR here, not addition.</p>`,
      ]},
      { k: "play", title: "Gate lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), tt = el(`<div></div>`), eq = el(`<p class="eq"></p>`);
          let k = "NAND", A = 1, B = 1;
          function draw() {
            const [n, fn, e] = GATES[k], ins = n === 1 ? [A] : [A, B], y = fn(ins);
            const g = gate(k.toLowerCase(), 150, 70, n);
            let s = g.s + `<line class="w ${y ? "hl" : ""}" x1="${g.out[0]}" y1="70" x2="${g.out[0] + 50}" y2="70"/>`;
            g.ins.forEach(([x, yy], i) => { s += S.t(x - 8, yy + 5, (i ? "B" : "A") + " = " + ins[i], { a: "end" }); });
            s += S.t(g.out[0] + 56, 75, "Y = " + y, { a: "start", cls: "big" });
            f.innerHTML = S.svg(420, 140, s, { max: 420, label: k + " gate" });
            eq.textContent = e;
            const row = n === 1 ? A : A * 2 + B;
            tt.innerHTML = truthTable(n === 1 ? ["A"] : ["A", "B"], ["Y"], fn, { hot: row });
          }
          const names = Object.keys(GATES);
          host.append(toggle(names, (i) => { k = names[i]; draw(); }, names.indexOf(k)), f, eq,
            toggle(["A = 0", "A = 1"], (v) => { A = v; draw(); }, 1), toggle(["B = 0", "B = 1"], (v) => { B = v; draw(); }, 1), tt);
          draw();
        },
        `<p class="aside">The highlighted row of the truth table is the one your inputs pick. A circle (bubble) on an output means “inverted”: compare AND with NAND.</p>`,
      ]},
      { k: "why", title: "Why have a buffer?", b: [
        `<p>A buffer copies its input: Y = A. Logically it's a wire. So why build one?</p>`,
        `<p>Electrically, a buffer can deliver a lot of current (to a motor, say) or switch its output fast when it feeds many gates. The digital abstraction hides that purpose; you only see it one level down.</p>`,
      ]},
      { k: "learn", title: "Gates with more inputs", b: [
        `<div class="two"><div class="tile"><h3>N-input AND, OR</h3><p>AND: TRUE when <b>all</b> N inputs are TRUE. OR: TRUE when <b>at least one</b> is.</p></div><div class="tile"><h3>N-input XOR</h3><p>TRUE when an <b>odd number</b> of inputs are TRUE. Also called a <b>parity gate</b>.</p></div></div>`,
        `<p class="aside">XNOR is called the <b>equality gate</b>: its output is TRUE when its two inputs are equal.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Inputs A = 1, B = 0, C = 1. What does each 3-input gate output?", bins: ["0", "1"], items: [
          ["AND3", 0, "Not all inputs are 1."], ["OR3", 1, "At least one input is 1."], ["NAND3", 1, "NOT of AND3 = NOT 0."],
          ["NOR3", 0, "NOT of OR3 = NOT 1."], ["XOR3 (parity)", 0, "Two inputs are 1: an even number."], ["XNOR3", 1, "NOT of XOR3."],
        ]},
        { t: "num", q: "How many rows does the truth table of a 4-input gate have?", a: 16, tol: 0, why: "2⁴ = 16 input combinations, listed in counting order 0000 to 1111." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between OR and XOR?", model: "Both are TRUE when exactly one input is TRUE. The difference is when both inputs are TRUE: OR (inclusive) gives TRUE, XOR (exclusive) gives FALSE. With many inputs, OR is TRUE if any input is TRUE, and XOR is TRUE if an odd number are." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  function levelFig(L, noise) {
    const H = 240, top = 20, sc = (v) => top + (1 - v / L.VDD) * (H - 50);
    let s = "";
    const col = (x, w, lo, hi, cls, lab) => `<rect x="${x}" y="${sc(hi)}" width="${w}" height="${sc(lo) - sc(hi)}" style="fill:var(--${cls});stroke:var(--line)"/>` + (lab ? S.t(x + w / 2, (sc(lo) + sc(hi)) / 2 + 4, lab, { cls: "s" }) : "");
    s += S.t(145, 14, "driver output", { cls: "s" }) + S.t(325, 14, "receiver input", { cls: "s" });
    s += col(100, 90, L.VOH, L.VDD, "good-soft", "HIGH") + col(100, 90, 0, L.VOL, "cool-soft", "LOW");
    s += col(280, 90, L.VIH, L.VDD, "good-soft", "HIGH") + col(280, 90, L.VIL, L.VIH, "bad-soft", "forbidden") + col(280, 90, 0, L.VIL, "cool-soft", "LOW");
    [["V_OH", L.VOH, 94, "end"], ["V_OL", L.VOL, 94, "end"], ["V_IH", L.VIH, 376, "start"], ["V_IL", L.VIL, 376, "start"]].forEach(([n, v, x, a]) => { s += S.t(x, sc(v) + 4, `${n} ${fmt(v, 3)}`, { a, cls: "s" }); });
    s += `<line x1="190" y1="${sc(L.VOH)}" x2="280" y2="${sc(L.VIH)}" style="stroke:var(--good);stroke-width:2;stroke-dasharray:4 3"/><line x1="190" y1="${sc(L.VOL)}" x2="280" y2="${sc(L.VIL)}" style="stroke:var(--cool);stroke-width:2;stroke-dasharray:4 3"/>`;
    if (noise != null) { const y = sc(Math.max(0, L.VOH - noise)); s += `<circle cx="325" cy="${y}" r="7" style="fill:var(--accent)"/>`; }
    s += S.t(235, H - 6, "GND = 0 V", { cls: "s" });
    return S.svg(460, H, s, { max: 460, label: "Driver output levels and receiver input levels with noise margins" });
  }
  const p6 = {
    id: "p6", title: "Logic levels and noise margins", mins: 20,
    blurb: "Which voltages count as 0 and 1, and how much noise a connection can take.",
    takeaway: "Ground (GND) = 0 V; the supply is V_DD (5 V in the 1970s–80s, then 3.3, 2.5, 1.8, 1.5, 1.2 V and lower, to save power and protect small transistors). Logic levels map continuous voltages to bits: a driver outputs LOW in 0…V_OL and HIGH in V_OH…V_DD; a receiver reads 0…V_IL as LOW and V_IH…V_DD as HIGH. Between V_IL and V_IH is the forbidden zone (unpredictable). Need V_OL < V_IL and V_OH > V_IH. Noise margins: NM_L = V_IL − V_OL and NM_H = V_OH − V_IH: the noise a worst-case output can take and still be read correctly. V_DD is the drain supply of MOS transistors (V_CC for bipolar collectors; GND is sometimes V_SS).",
    steps: [
      { k: "learn", title: "Supply and ground", b: [
        `<p>The lowest voltage is <b>ground</b> (GND), 0 V. The highest is the supply, <b>V<sub>DD</sub></b>. It was 5 V in the 1970s and 80s; as transistors shrank it dropped to 3.3, 2.5, 1.8, 1.2 V and below, to save power and avoid damaging tiny transistors.</p>`,
        `<p>If 0 V is 0 and 5 V is 1, what is 4.97 V? 2.8 V? We need rules.</p>`,
      ]},
      { k: "learn", title: "Four logic levels", b: [
        `<div class="two"><div class="tile"><h3>Driver (output)</h3><p>LOW: 0 to <b>V<sub>OL</sub></b>. HIGH: <b>V<sub>OH</sub></b> to V<sub>DD</sub>.</p></div><div class="tile"><h3>Receiver (input)</h3><p>Reads LOW: 0 to <b>V<sub>IL</sub></b>. Reads HIGH: <b>V<sub>IH</sub></b> to V<sub>DD</sub>. In between: the <b>forbidden zone</b>.</p></div></div>`,
        `<div class="eq">NM<sub>L</sub> = V<sub>IL</sub> − V<sub>OL</sub>     NM<sub>H</sub> = V<sub>OH</sub> − V<sub>IH</sub></div>`,
        `<p>A noise margin is how much noise a worst-case output can pick up and still be read right.</p>`,
        seen("Noise margins and the static discipline.", "05-digital-abstraction.html#p3", "Chapter 5, Part 3"),
      ]},
      { k: "play", title: "Noise on the wire", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const L = { VDD: 5, VOL: 0.33, VOH: 3.84, VIL: 1.35, VIH: 3.15 };
          let noise = 0.5;
          function draw() {
            f.innerHTML = levelFig(L, noise);
            const NMH = L.VOH - L.VIH, NML = L.VIL - L.VOL;
            ro.innerHTML = readout([["NM_H", fmt(NMH, 3) + " V"], ["NM_L", fmt(NML, 3) + " V"], ["Worst HIGH arrives at", fmt(L.VOH - noise, 3) + " V"]]);
            vd.className = "verdict " + (noise <= NMH ? "ok" : "no");
            vd.textContent = noise <= NMH ? "Still read as HIGH." : "Fell below V_IH: the receiver may not see a HIGH.";
          }
          host.append(f, slider({ id: id + "-n", label: "Noise pulling the HIGH down", min: 0, max: 1.5, step: 0.01, value: noise, show: (v) => fmt(v, 3) + " V" }, (v) => { noise = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">These are 5 V CMOS levels. The orange dot is the driver's worst-case HIGH after the noise has pulled it down. Find the most noise a HIGH can take. Is the LOW side more or less tolerant?</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 1.8 V family has V_OL = 0.2 V, V_IL = 0.6 V, V_IH = 1.2 V, V_OH = 1.55 V. What is the high noise margin NM_H?", a: 0.35, tol: 0.01, unit: "V", hint: "NM_H = V_OH − V_IH.", why: "1.55 − 1.2 = 0.35 V. (NM_L = 0.6 − 0.2 = 0.4 V.)" },
        { t: "mcq", q: "Same family. Can a connection tolerate 0.38 V of noise?", opts: [["Only when the output is LOW: 0.38 < NM_L = 0.4 but 0.38 > NM_H = 0.35", true, "The connection is only as good as its smaller margin."], ["Yes, always", false, "Check NM_H: 0.35 V."], ["Never", false, "The LOW side can: NM_L = 0.4 V."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must V_OH be greater than V_IH?", model: "So that even the worst-case HIGH a driver produces is above the lowest voltage a receiver accepts as HIGH. The difference, NM_H, is room for noise. If V_OH were below V_IH, a perfectly working driver could produce a HIGH the receiver doesn't recognise." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const FAM = { TTL: [5, 0.8, 2.0, 0.4, 2.4], CMOS: [5, 1.35, 3.15, 0.33, 3.84], LVTTL: [3.3, 0.8, 2.0, 0.4, 2.4], LVCMOS: [3.3, 0.9, 1.8, 0.36, 2.7] };
  /* Inverter DC curve: logistic with gain k (1/V) and midpoint m. */
  const vout = (x, V, k, m) => V / (1 + Math.exp(k * (x - m)));
  function unityPts(V, k, m) {
    const d = 1 - 4 / (k * V);
    if (d <= 0) return null;
    const uh = (1 + Math.sqrt(d)) / 2, ul = (1 - Math.sqrt(d)) / 2;
    const at = (u) => m + Math.log(1 / u - 1) / k;
    return { VIL: at(uh), VOH: uh * V, VIH: at(ul), VOL: ul * V };
  }
  const p7 = {
    id: "p7", title: "Transfer curves, the static discipline, logic families", mins: 25,
    blurb: "Where the logic levels come from, the rule every gate obeys, and which families can talk.",
    takeaway: "DC transfer characteristics: output voltage vs input voltage when the input changes slowly. An ideal inverter switches abruptly at V_DD/2 (V_IL = V_IH = V_DD/2, V_OH = V_DD, V_OL = 0). A real one changes smoothly, not necessarily centred. A good choice of logic levels is the two unity-gain points, where the slope dV(Y)/dV(A) = −1; this usually maximizes the noise margins. Static discipline: given logically valid inputs, every circuit element produces logically valid outputs. Designers give up arbitrary analog behaviour in return for simplicity and robustness. Gates are grouped into logic families whose members obey the static discipline with each other. 5 V families: TTL (V_IL 0.8, V_IH 2.0, V_OL 0.4, V_OH 2.4) and CMOS (1.35, 3.15, 0.33, 3.84); 3.3 V: LVTTL (0.8, 2.0, 0.4, 2.4) and LVCMOS (0.9, 1.8, 0.36, 2.7). TTL and 3.3 V outputs can't drive 5 V CMOS (V_OH < V_IH). A 5 V output can damage a 3.3 V input unless it's 5-volt tolerant.",
    steps: [
      { k: "learn", title: "Look under the abstraction", b: [
        `<p>The <b>DC transfer characteristic</b> of a gate is its output voltage against its input voltage, with the input changed slowly enough for the output to keep up.</p>`,
        `<p>An ideal inverter would flip sharply at V<sub>DD</sub>/2. A real one bends smoothly between V<sub>DD</sub> and 0. So where do we put V<sub>IL</sub> and V<sub>IH</sub>?</p>`,
        seen("Checking that gates obey a static discipline.", "06-mosfet-switch.html#p5", "Chapter 6, Part 5"),
      ]},
      { k: "play", title: "Unity-gain points", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const V = 5;
          let k = 4, m = 2.5;
          function draw() {
            const u = unityPts(V, k, m);
            const marks = u ? [{ x: u.VIL, y: u.VOH, label: "slope −1", a: "end", dx: -10, dy: 22 }, { x: u.VIH, y: u.VOL, label: "slope −1" }] : [];
            f.innerHTML = plot({ x: [0, 5], y: [0, 5.3], xt: [0, 1, 2, 3, 4, 5], yt: [0, 1, 2, 3, 4, 5], xl: "V(A) (V)", yl: "V(Y) (V)",
              series: [{ f: (x) => vout(x, V, k, m), cls: "s1" }, { f: (x) => (x <= 2.5 ? 5 : 0), cls: "s5" }], marks, label: "Inverter DC transfer characteristic with unity-gain points" });
            ro.innerHTML = u ? readout([["V_IL", fmt(u.VIL, 3) + " V"], ["V_IH", fmt(u.VIH, 3) + " V"], ["V_OH", fmt(u.VOH, 3) + " V"], ["V_OL", fmt(u.VOL, 3) + " V"], ["NM_L = V_IL − V_OL", fmt(u.VIL - u.VOL, 3) + " V"], ["NM_H = V_OH − V_IH", fmt(u.VOH - u.VIH, 3) + " V"]]) : `<p class="aside">The curve never gets steeper than −1: no gain, so no valid logic levels. That's not a usable gate.</p>`;
          }
          host.append(f, slider({ id: id + "-k", label: "Steepness (gain)", min: 0.6, max: 12, step: 0.1, value: k, show: (v) => fmt(v, 2) }, (v) => { k = v; draw(); }).el,
            slider({ id: id + "-m", label: "Switching point", min: 1.5, max: 3.5, step: 0.05, value: m, show: (v) => fmt(v, 3) + " V" }, (v) => { m = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The dashed line is the ideal inverter. Make the curve steeper: both noise margins grow. Move the switching point off centre: one margin grows and the other shrinks.</p>`,
      ]},
      { k: "why", title: "Why the unity-gain points?", b: [
        `<p>Lower V<sub>IL</sub> a bit below the unity-gain point and V<sub>OH</sub> barely rises (the curve is flat there). Raise it above, and V<sub>OH</sub> drops fast (the curve is steep). The slope = −1 points balance the two, which usually maximizes the noise margins.</p>`,
      ]},
      { k: "learn", title: "The static discipline", b: [
        `<div class="key"><b>Static discipline:</b> given logically valid inputs, every circuit element produces logically valid outputs.</div>`,
        `<p>Gates that obey it can be connected freely, like Lego. The price: you give up using arbitrary analog circuits. Gates that work together form a <b>logic family</b>: same supply, compatible levels.</p>`,
      ]},
      { k: "play", title: "Can these talk?", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`), f = el(`<div class="fig"></div>`);
          const names = Object.keys(FAM);
          let d = 0, r = 1;
          function draw() {
            const [Vd, , , VOL, VOH] = FAM[names[d]], [Vr, VIL, VIH] = FAM[names[r]];
            const NMH = VOH - VIH, NML = VIL - VOL;
            f.innerHTML = levelFig({ VDD: 5, VOL, VOH, VIL, VIH });
            ro.innerHTML = readout([["Driver", `${names[d]}: V_OL ${VOL}, V_OH ${VOH}`], ["Receiver", `${names[r]}: V_IL ${VIL}, V_IH ${VIH}`], ["NM_H", fmt(NMH, 3) + " V"], ["NM_L", fmt(NML, 3) + " V"]]);
            const bad = NMH < 0 || NML < 0, risky = Vd > Vr;
            vd.className = "verdict " + (bad ? "no" : risky ? "mid" : "ok");
            vd.textContent = bad ? "NO: the driver's HIGH is below the receiver's V_IH." : risky ? "MAYBE: levels work, but a 5 V HIGH may damage a 3.3 V input unless it's 5-volt tolerant." : "OK: both noise margins are positive.";
          }
          host.append(el(`<p class="aside">Driver:</p>`), toggle(names, (i) => { d = i; draw(); }, d), el(`<p class="aside">Receiver:</p>`), toggle(names, (i) => { r = i; draw(); }, r), vd, ro, f);
          draw();
        },
        `<p class="aside">The bars are drawn on a 0–5 V scale. Try TTL driving CMOS, then CMOS driving TTL.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why can't LVCMOS (3.3 V) drive a 5 V CMOS input reliably?", opts: [
          ["Its V_OH (2.7 V) is below CMOS's V_IH (3.15 V): a HIGH might be read as forbidden", true, "NM_H would be negative."],
          ["Its LOW is too high", false, "V_OL = 0.36 V < V_IL = 1.35 V: the LOW side is fine."],
          ["It would damage the CMOS input", false, "Damage is the risk the other way: 5 V into a 3.3 V input."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the static discipline, and what do designers give up by following it?", model: "Every circuit element, given valid logic inputs, must produce valid logic outputs, never something in the forbidden zone. Following it, gates can be connected freely and the system stays robust. The cost is that you can't use arbitrary analog circuits; you restrict yourself to elements that obey the logic levels of the family." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  function switchFig(p, g) {
    const onState = p ? g === 0 : g === 1;
    let s = S.nmos(90, 90, { p, cls: onState ? "hl" : "dim" }) + S.t(56, 84, "g = " + g, { a: "end", cls: "s" }) + S.t(112, 50, "d", { a: "start", cls: "s" }) + S.t(112, 134, "s", { a: "start", cls: "s" });
    s += S.t(190, 95, "≡", { cls: "big" });
    s += S.sw(260, 40, 140, onState, { cls: onState ? "hl" : "" }) + S.t(290, 95, onState ? "ON" : "OFF", { a: "start", cls: onState ? "big g" : "big b" });
    return S.svg(380, 170, s, { max: 380, label: (p ? "pMOS" : "nMOS") + " transistor as a switch" });
  }
  const p8 = {
    id: "p8", title: "Under the gates: transistors", mins: 25,
    blurb: "Doped silicon, diodes, capacitors, and the two kinds of MOSFET switch.",
    takeaway: "Transistors replaced gears, relays and vacuum tubes: cheap, small, reliable, electrically controlled switches. Two types: bipolar junction transistors and MOSFETs. History: Kilby (TI, 1958) built the first IC with two transistors; Noyce (Fairchild, 1959) patented interconnecting many on one chip; transistors then cost about $10 each; now about a billion fit on 1 cm², each under 10 microcents, improving tenfold about every 8 years. Silicon (group IV) forms a crystal lattice and conducts poorly; adding dopants changes conductivity over many orders of magnitude (a semiconductor). Group V arsenic gives free electrons (n-type); group III boron gives holes (p-type). A p–n junction is a diode: current flows anode (p) to cathode (n) when forward biased. A capacitor (C = Q/V) takes time and energy to charge, so more capacitance means slower and more power. A MOSFET is a gate (polysilicon, once metal) over thin SiO₂ over the silicon substrate: a capacitor. nMOS: n-type source and drain in a p substrate tied to GND; gate at V_DD attracts electrons that invert the surface into an n-type channel: ON. The gate voltage needed is the threshold V_t, typically 0.3–0.7 V. pMOS: the opposite; substrate at V_DD; ON when the gate is 0. nMOS pass 0s well but 1s poorly (only up to V_DD − V_t); pMOS pass 1s well, 0s poorly. CMOS processes put both on one chip (p wafer with n wells for the pMOS). Moore's Law: transistor counts double about every two years.",
    steps: [
      { k: "learn", title: "Why transistors", b: [
        `<p>Babbage used gears; early computers used relays and vacuum tubes. Modern ones use <b>transistors</b>: cheap, small, reliable switches controlled by a voltage.</p>`,
        `<p>1958: Kilby builds an IC with two transistors. 1959: Noyce patents wiring many together on one chip. Then a transistor cost about $10. Now about a <b>billion</b> fit on 1 cm<sup>2</sup>, each under 10 millionths of a dollar.</p>`,
      ]},
      { k: "learn", title: "Silicon, doped", b: [
        `<p>Pure silicon conducts poorly: its four valence electrons are all tied up in bonds. Add a trace of impurity (a <b>dopant</b>):</p>`,
        `<div class="two"><div class="tile"><h3>n-type</h3><p>Arsenic (group V) has one extra electron, free to move.</p></div><div class="tile"><h3>p-type</h3><p>Boron (group III) is missing one: a <b>hole</b>, which moves like a positive charge.</p></div></div>`,
        `<p>A p–n junction is a <b>diode</b>: current flows from anode (p) to cathode (n) only when forward biased. A <b>capacitor</b> stores charge, C = Q/V; charging it takes time and energy, so capacitance makes circuits slower and hungrier.</p>`,
        seenB("Doping, holes and the p–n junction in depth.", "01-semiconductor-diodes.html#p2", "Chapter 1"),
      ]},
      { k: "learn", title: "The MOSFET sandwich", b: [
        `<p>Gate (polysilicon; once metal) on top of thin <b>oxide</b> (SiO<sub>2</sub>, glass) on top of the silicon <b>substrate</b>. Metal–oxide–semiconductor: a capacitor.</p>`,
        `<p><b>nMOS:</b> n-type source and drain in a p-type substrate tied to GND. Gate at 0: the junctions are reverse biased, no path: <b>OFF</b>. Gate at V<sub>DD</sub>: the field pulls electrons under the gate until the surface <b>inverts</b> to n-type, a <b>channel</b> from source to drain: <b>ON</b>.</p>`,
        `<p>The gate voltage that turns it on is the <b>threshold voltage V<sub>t</sub></b>, typically 0.3–0.7 V.</p>`,
        seen("The MOSFET's switch (S) model.", "06-mosfet-switch.html#p3", "Chapter 6, Part 3"),
      ]},
      { k: "play", title: "Two switches", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let p = false, g = 1;
          function draw() { f.innerHTML = switchFig(p, g); }
          host.append(toggle(["nMOS", "pMOS"], (i) => { p = i === 1; draw(); }), toggle(["gate = 0", "gate = 1"], (i) => { g = i; draw(); }, 1), f);
          draw();
        },
        `<p class="aside">nMOS: ON when the gate is 1. pMOS (bubble on the gate): ON when the gate is 0. Exact opposites.</p>`,
      ]},
      { k: "learn", title: "Imperfect switches", b: [
        `<div class="two"><div class="tile"><h3>nMOS</h3><p>Passes a <b>0</b> well. Passing a 1, its output only gets up to V<sub>DD</sub> − V<sub>t</sub>.</p></div><div class="tile"><h3>pMOS</h3><p>Passes a <b>1</b> well. Passes a 0 poorly.</p></div></div>`,
        `<p>So good gates use each kind only where it's good. Making both kinds on one chip (a p-type wafer with n-type <b>wells</b> for the pMOS) is <b>CMOS</b>: complementary MOS. It makes the vast majority of all transistors.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which transistor should connect an output to GND to pull it down to a clean 0?", opts: [["nMOS: it passes 0s well", true, "And pMOS goes between the output and V_DD, since it passes 1s well."], ["pMOS", false, "pMOS passes 0 poorly: the output would stop above 0 V."], ["Either works equally well", false, "They're not symmetric: each passes one value well."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does raising the gate voltage turn an nMOS transistor on?", model: "The gate, oxide and substrate form a capacitor. A positive gate voltage pulls negative charge (electrons) to the silicon just under the gate. Above the threshold voltage there are so many that this thin layer inverts from p-type to n-type, forming a channel that connects the n-type source and drain, so current can flow." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "CMOS logic gates", mins: 25,
    blurb: "A pMOS pull-up and an nMOS pull-down, always one ON and one OFF.",
    takeaway: "CMOS NOT: pMOS P1 from V_DD to Y, nMOS N1 from Y to GND, both gates driven by A. A = 0: P1 ON, N1 OFF, Y = 1. A = 1: N1 ON, Y = 0. Two-input NAND: nMOS in series (both ON to pull down), pMOS in parallel (either ON pulls up). General inverting gate: an nMOS pull-down network between output and GND (nMOS pass 0s well) and a pMOS pull-up network between V_DD and output. Transistors in parallel: network ON if either is ON; in series: ON only if both are. Both networks ON = short circuit (output in the forbidden zone, big power, possible burnout); both OFF = output floats (undefined). Rule of conduction complements: nMOS in series ↔ pMOS in parallel, and vice versa; then exactly one network is ON. 3-input NAND: 3 nMOS in series, 3 pMOS in parallel. 2-input NOR: nMOS parallel, pMOS series. A single CMOS gate is inverting: AND = NAND followed by NOT.",
    steps: [
      { k: "learn", title: "The CMOS inverter", b: [
        fig(inverter(0)),
        `<p>pMOS on top (to V<sub>DD</sub>), nMOS below (to GND), both gates tied to A. A = 0: the pMOS is ON and pulls Y up to 1. A = 1: the nMOS is ON and pulls Y down to 0. Each transistor only ever passes the value it's good at.</p>`,
        seenB("The CMOS inverter, from the device side.", "06-fets.html#p10", "Chapter 6, Part 10"),
      ]},
      { k: "play", title: "Gate lab: CMOS", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), note = el(`<p class="aside"></p>`);
          let k = 1, A = 1, B = 0;
          function draw() {
            f.innerHTML = k === 0 ? inverter(A) : k === 1 ? nand2(A, B) : nor2(A, B);
            const y = k === 0 ? 1 - A : k === 1 ? 1 - (A & B) : 1 - (A | B);
            note.textContent = k === 0 ? "Exactly one transistor is ON." : y ? `The pull-up has a path to V_DD (${k === 1 ? "at least one parallel pMOS is ON" : "both series pMOS are ON"}), and the pull-down is broken.` : `The pull-down has a path to GND (${k === 1 ? "both series nMOS are ON" : "at least one parallel nMOS is ON"}), and the pull-up is broken.`;
          }
          host.append(toggle(["NOT", "NAND2", "NOR2"], (i) => { k = i; draw(); }, k), toggle(["A = 0", "A = 1"], (v) => { A = v; draw(); }, A), toggle(["B = 0", "B = 1"], (v) => { B = v; draw(); }, B), f, note);
          draw();
        },
        `<p class="aside">Highlighted transistors are ON; grey ones are OFF. Try all four input combinations on the NAND and the NOR.</p>`,
      ]},
      { k: "learn", title: "Pull-up and pull-down", b: [
        `<p>Every inverting CMOS gate has the same shape:</p>`,
        `<div class="two"><div class="tile"><h3>Pull-up network</h3><p>pMOS transistors between V<sub>DD</sub> and the output.</p></div><div class="tile"><h3>Pull-down network</h3><p>nMOS transistors between the output and GND.</p></div></div>`,
        `<p>Parallel transistors: the network conducts if <b>either</b> is ON. Series: only if <b>both</b> are.</p>`,
      ]},
      { k: "predict", title: "What if both are ON?", b: [
        { t: "sort", q: "What happens in each case?", bins: ["Short circuit", "Floating output", "Works"], items: [
          ["Pull-up and pull-down both ON", 0, "A direct path from V_DD to GND: the output sits somewhere in between, and lots of current flows (it can burn out)."],
          ["Pull-up and pull-down both OFF", 1, "The output connects to nothing: it floats, and its value is undefined."],
          ["Exactly one ON", 2, "The output is pulled cleanly to 0 or 1."],
        ]},
      ]},
      { k: "learn", title: "Conduction complements", b: [
        `<div class="key"><b>Rule:</b> where the nMOS are in <b>series</b>, put the pMOS in <b>parallel</b>, and vice versa. Then exactly one network is ON for every input.</div>`,
        `<p>NAND: output 0 only when <b>all</b> inputs are 1 → nMOS in series → pMOS in parallel. NOR: output 0 when <b>any</b> input is 1 → nMOS in parallel → pMOS in series.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "How do you build a 3-input NAND in CMOS?", opts: [
          ["3 nMOS in series, 3 pMOS in parallel", true, "Pull down only when all three are 1; pull up if any is 0."],
          ["3 nMOS in parallel, 3 pMOS in series", false, "That's a 3-input NOR."],
          ["3 nMOS in series, 3 pMOS in series", false, "Then for some inputs both networks are OFF and the output floats."],
        ]},
        { t: "mcq", q: "How many transistors does the best CMOS 2-input AND gate use?", opts: [
          ["6: a NAND (4) followed by an inverter (2)", true, "A single CMOS stage always inverts, so AND = NAND + NOT."],
          ["4", false, "Four transistors make a NAND. You can't get AND in one stage."],
          ["2", false, "Two transistors make just an inverter."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the pMOS be in parallel when the nMOS are in series?", model: "So that for every input combination exactly one network conducts. With nMOS in series, the pull-down is ON only when all inputs are 1. The pull-up must then be ON whenever any input is 0, which is what pMOS in parallel do. Otherwise there'd be inputs where both are ON (a short) or both OFF (a floating output)." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Transmission gates, pseudo-nMOS, and power", mins: 25,
    blurb: "A switch that passes both values, a fast but leaky NOR, and where a chip's power goes.",
    takeaway: "Transmission gate (pass gate): an nMOS and a pMOS in parallel, so it passes both 0 and 1 well; controlled by EN and its complement; bidirectional (sides A and B). EN = 1: ON; EN = 0: OFF (A and B disconnected). Pseudo-nMOS: replaces the slow series pMOS stack (pMOS are slower than nMOS because holes move more slowly than electrons; series is slower than parallel) with one always-ON weak pMOS pull-up; any ON nMOS overpowers it. Good for fast many-input NORs (used in memory and logic arrays), but when the output is LOW there's a continuous path from V_DD to GND: static power, so use sparingly. Power: dynamic power charges capacitance as signals switch: P_dynamic = ½CV_DD²f. Static power flows even when idle (leakage, quiescent current I_DD): P_static = I_DD·V_DD. Battery life = energy / total power.",
    steps: [
      { k: "learn", title: "The transmission gate", b: [
        `<p>nMOS pass 0s well, pMOS pass 1s well. Put one of each <b>in parallel</b> and you get a switch that passes <b>both</b> well: a <b>transmission gate</b>.</p>`,
        `<div class="two"><div class="tile"><h3>EN = 1, EN̅ = 0</h3><p>Both transistors ON: A and B are connected, any value flows either way.</p></div><div class="tile"><h3>EN = 0, EN̅ = 1</h3><p>Both OFF: A and B are disconnected.</p></div></div>`,
        `<p class="aside">The sides are called A and B, not input and output, because a switch works in both directions.</p>`,
      ]},
      { k: "learn", title: "Pseudo-nMOS", b: [
        `<p>An N-input CMOS NOR has N pMOS in <b>series</b>. Series transistors are slow (like series resistors), and pMOS are slower than nMOS because holes move more slowly than electrons. Big NORs are slow.</p>`,
        `<p><b>Pseudo-nMOS</b> swaps the whole pMOS stack for one <b>weak</b> pMOS that is always ON. It pulls Y HIGH only if no nMOS is ON; any ON nMOS overpowers it.</p>`,
        `<div class="key">Price: when the output is LOW, the weak pMOS and an nMOS are both ON. Current flows from V<sub>DD</sub> to GND the whole time. Use it sparingly.</div>`,
      ]},
      { k: "learn", title: "Two kinds of power", b: [
        `<div class="two"><div class="tile"><h3>Dynamic</h3><p>Charging gate and wire capacitance as signals switch.</p><div class="eq">P<sub>dynamic</sub> = ½ C V<sub>DD</sub><sup>2</sup> f</div></div><div class="tile"><h3>Static</h3><p>Current that flows even when nothing switches: leakage through OFF transistors, or paths like pseudo-nMOS.</p><div class="eq">P<sub>static</sub> = I<sub>DD</sub> V<sub>DD</sub></div></div></div>`,
        `<p class="aside">Why ½? Charging C to V<sub>DD</sub> draws CV<sub>DD</sub><sup>2</sup> from the supply. A signal switching at f charges the capacitor f/2 times per second; discharging takes nothing from the supply.</p>`,
        seen("Static plus dynamic power, and why CMOS has almost no static power.", "11-energy-power-digital.html#p2", "Chapter 11, Parts 2 and 5"),
      ]},
      { k: "play", title: "Battery life", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let C = 5, V = 1.0, fM = 500, I = 30, Wh = 12, radio = 1;
          function draw() {
            const Pd = 0.5 * C * 1e-9 * V * V * fM * 1e6, Ps = I * 1e-3 * V, Pon = Pd + Ps + radio;
            ro.innerHTML = readout([["P_dynamic = ½CV²f", si(Pd, "W")], ["P_static = I_DD·V_DD", si(Ps, "W")], ["Total in use (+ radio)", si(Pon, "W")], ["Battery life in use", fmt(Wh / Pon, 3) + " h"], ["Battery life idle (static only)", fmt(Wh / Ps, 3) + " h"]]);
          }
          host.append(
            slider({ id: id + "-c", label: "Switching capacitance C", min: 0.5, max: 20, step: 0.5, value: C, show: (x) => fmt(x, 3) + " nF" }, (x) => { C = x; draw(); }).el,
            slider({ id: id + "-v", label: "Supply V_DD", min: 0.6, max: 1.8, step: 0.05, value: V, show: (x) => fmt(x, 3) + " V" }, (x) => { V = x; draw(); }).el,
            slider({ id: id + "-f", label: "Frequency f", min: 50, max: 2000, step: 50, value: fM, show: (x) => fmt(x, 4) + " MHz" }, (x) => { fM = x; draw(); }).el,
            slider({ id: id + "-i", label: "Quiescent current I_DD", min: 1, max: 100, step: 1, value: I, show: (x) => fmt(x, 3) + " mA" }, (x) => { I = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A 12 Wh phone battery, plus 1 W for the radio when in use. Which knob saves the most power for the same change? (Look at the formula: V<sub>DD</sub> is squared.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A chip switches 2 nF of capacitance at 1 GHz from a 1.2 V supply. What is its dynamic power?", a: 1.44, tol: 0.02, unit: "W", hint: "½ × 2×10⁻⁹ × 1.2² × 10⁹.", why: "0.5 × 2×10⁻⁹ × 1.44 × 10⁹ = 1.44 W." },
        { t: "num", q: "Same chip, supply lowered to 0.9 V (and it still runs at 1 GHz). New dynamic power?", a: 0.81, tol: 0.02, unit: "W", hint: "Power scales with V². (0.9/1.2)² = 0.5625.", why: "1.44 × 0.5625 = 0.81 W: 25% less voltage, 44% less power." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Name the two kinds of power in a digital chip and one way to reduce each.", model: "Dynamic power, from charging and discharging capacitance when signals switch: ½CV²f. Reduce it by lowering the supply voltage (it's squared), the frequency, or how much capacitance switches. Static power, from current that flows even when idle, like leakage: I_DD·V_DD. Reduce it by lowering leakage or the supply, or avoiding circuits like pseudo-nMOS that conduct all the time." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh1", eyebrow: "Harris & Harris · Chapter 1", title: "From Zero to One",
    intro: `<p>Ten parts: managing complexity, the digital abstraction, number systems (a quick recap after Patt & Patel), signed numbers, logic gates, logic levels and noise margins, transfer curves and logic families, transistors, CMOS gates, and power.</p><p>Parts 3 and 4 overlap Patt & Patel Chapter 2 and go fast. Parts 6–10 are where this book goes deeper. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book, then try the interview questions after them. They test whether the ideas stuck, so don't expect them to look like the questions here.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Managing complexity</h3>
      <p>Abstraction (hide details), discipline (restrict choices), hierarchy, modularity, regularity. This book: digital circuits → logic → microarchitecture → architecture.</p>
      <h3>Information and numbers</h3>
      <div class="eq">D = log<sub>2</sub>N bits    2<sup>10</sup> ≈ 10<sup>3</sup>    byte = 8 bits, nibble = 4</div>
      <p>Unsigned [0, 2<sup>N</sup>−1]; sign/magnitude [−2<sup>N−1</sup>+1, 2<sup>N−1</sup>−1]; 2's complement [−2<sup>N−1</sup>, 2<sup>N−1</sup>−1], msb weight −2<sup>N−1</sup>. Unsigned overflow = carry out. 2's complement overflow = same-sign inputs, opposite-sign result.</p>
      <h3>Gates</h3>
      <p>NOT A̅, AND AB, OR A+B, XOR A⊕B (parity for N inputs), NAND, NOR, XNOR (equality), BUF.</p>
      <h3>Logic levels</h3>
      <div class="eq">NM<sub>L</sub> = V<sub>IL</sub> − V<sub>OL</sub>    NM<sub>H</sub> = V<sub>OH</sub> − V<sub>IH</sub></div>
      <p>Logic levels at the unity-gain points (slope −1). Static discipline: valid in → valid out. Families: TTL, CMOS, LVTTL, LVCMOS.</p>
      <h3>CMOS</h3>
      <p>nMOS ON when gate = 1, passes 0 well; pMOS ON when gate = 0, passes 1 well. Pull-down nMOS, pull-up pMOS, conduction complements (series ↔ parallel). NAND: nMOS series. NOR: nMOS parallel. Transmission gate: nMOS ∥ pMOS. Pseudo-nMOS: weak always-ON pull-up, static power.</p>
      <h3>Power</h3>
      <div class="eq">P<sub>dynamic</sub> = ½ C V<sub>DD</sub><sup>2</sup> f    P<sub>static</sub> = I<sub>DD</sub> V<sub>DD</sub></div>`,
  };
  Course.start(window.CHAPTER);
})();

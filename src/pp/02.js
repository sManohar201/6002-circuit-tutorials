(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const mono = (s) => `<span class="mono">${s}</span>`;

  /* k-bit 2's complement pattern of v (wraps like the hardware). */
  const bits = (v, k) => { const m = 2 ** k; return (((v % m) + m) % m).toString(2).padStart(k, "0"); };
  const uval = (b) => parseInt(b, 2);
  const sval = (b) => (b[0] === "1" ? uval(b) - 2 ** b.length : uval(b));
  const flip = (b) => b.replace(/[01]/g, (c) => (c === "0" ? "1" : "0"));
  const hex = (b) => b.match(/.{4}/g).map((g) => uval(g).toString(16).toUpperCase()).join("");

  /* A row of bit boxes. o.top: labels above each box; o.hot: indices (from the left) to highlight; o.sign: tint the leftmost box. */
  function bitRow(b, o = {}) {
    const k = b.length, w = o.w || Math.min(40, 400 / k), x0 = (o.W || 420) / 2 - (k * w) / 2, y = o.y || 34;
    let s = "";
    b.split("").forEach((c, i) => {
      const hot = o.hot && o.hot.includes(i), sg = o.sign && i === 0;
      s += `<rect x="${x0 + i * w}" y="${y}" width="${w}" height="${w}" style="fill:${hot ? "var(--accent-soft)" : sg ? "var(--cool-soft)" : "var(--card)"};stroke:var(--ink)"/>`;
      s += S.t(x0 + i * w + w / 2, y + w * 0.68, c, { cls: (w > 30 ? "big " : "") + "m" });
      if (o.top) s += S.t(x0 + i * w + w / 2, y - 8, o.top[i], { cls: "s" });
    });
    return s;
  }
  /* Clickable bit buttons. Returns { el, get() } ; onChange gets the bit string. */
  function bitButtons(init, onChange, o = {}) {
    const row = el(`<div class="row" role="group" aria-label="${o.label || "bits"}" style="gap:4px"></div>`);
    let b = init.split("");
    b.forEach((c, i) => {
      const btn = el(`<button type="button" class="btn small mono" style="min-width:34px;padding:6px 0">${c}</button>`);
      btn.addEventListener("click", () => { b[i] = b[i] === "1" ? "0" : "1"; btn.textContent = b[i]; btn.setAttribute("aria-pressed", String(b[i] === "1")); onChange(b.join("")); });
      btn.setAttribute("aria-pressed", String(c === "1"));
      row.appendChild(btn);
    });
    return { el: row, get: () => b.join("") };
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The bit", mins: 15,
    blurb: "Voltage near 0 or far from 0: that's a bit. k wires give 2^k codes.",
    takeaway: "The devices in a computer react to whether a voltage is present, not to its exact value, because detecting presence is far simpler than measuring. Presence = 1, absence = 0. Each 0 or 1 is a bit (binary digit). Precisely: circuits tell voltages close to 0 from voltages far from 0 (expecting 0 V or 1.2 V, 1.0 V reads as 1 and 0.2 V as 0). One wire distinguishes 2 things; k bits distinguish at most 2^k. Each k-bit pattern is a code for one item. A data type is a representation plus operations the computer can do on it; each ISA has its own. The book mainly uses 2's complement integers (arithmetic) and ASCII (characters); floating point is another. Five can be written 5 (decimal), 11111 (unary), V (Roman) or 00000101 (binary).",
    steps: [
      { k: "learn", title: "Present or absent", b: [
        `<p>Inside the computer, tiny devices react to voltages. They could measure the exact voltage, but that's hard. It's much easier to ask one question: <b>is there a voltage or not?</b></p>`,
        `<div class="two"><div class="tile"><h3>1</h3><p>A voltage is present (far from 0 V).</p></div><div class="tile"><h3>0</h3><p>No voltage (close to 0 V).</p></div></div>`,
        `<p>Each 0 or 1 is a <b>bit</b>, short for <b>bi</b>nary digi<b>t</b>. Decimal has ten digits; binary has two.</p>`,
      ]},
      { k: "play", title: "Close to 0, or far from it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          let v = 1.0;
          function draw() {
            const one = v >= 0.6;
            f.innerHTML = plot({ x: [0, 1], y: [0, 1.4], xt: [], yt: [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], xl: "", yl: "voltage (V)", padL: 50,
              areas: [{ f: () => 1.4, base: 0.6, cls: "ar2" }, { f: () => 0.6, base: 0, cls: "ar1" }],
              series: [{ f: () => v, cls: "s1" }],
              texts: [{ x: 0.4, y: 1.3, s: "far from 0: reads as 1" }, { x: 0.4, y: 0.08, s: "close to 0: reads as 0" }],
              label: "Voltage level and the bit it is read as" });
            vd.className = "verdict " + (one ? "ok" : "mid");
            vd.textContent = `${fmt(v, 2)} V reads as ${one ? 1 : 0}.`;
          }
          host.append(f, slider({ id: id + "-v", label: "Voltage on the wire", min: 0, max: 1.3, step: 0.05, value: v, show: (x) => fmt(x, 2) + " V" }, (x) => { v = x; draw(); }).el, vd);
          draw();
        },
        `<p class="aside">The circuit expects 0 V or 1.2 V. Anything near either one is read as that bit, so small errors don't matter. (The threshold drawn here is only for illustration; real circuits leave a forbidden gap in the middle.)</p>`,
        seen("The digital abstraction and noise margins, with real thresholds.", "05-digital-abstraction.html#p2", "Chapter 5"),
      ]},
      { k: "play", title: "More wires, more codes", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 3;
          function draw() {
            const n = 2 ** k, show = Math.min(n, 16);
            let s = "";
            for (let i = 0; i < show; i++) { const r = Math.floor(i / 4), c = i % 4; s += `<text x="${50 + c * 95}" y="${28 + r * 26}" class="m">${bits(i, k)}</text>`; }
            if (n > 16) s += S.t(210, 28 + 4 * 26, `… and ${n - 16} more`, { cls: "s" });
            f.innerHTML = S.svg(420, 140, s, { label: "All codes for k bits" });
            ro.innerHTML = readout([["Bits k", String(k)], ["Distinct codes 2^k", n.toLocaleString()]]);
          }
          host.append(f, slider({ id: id + "-k", label: "Number of bits (wires)", min: 1, max: 16, step: 1, value: k, show: (x) => String(x) }, (x) => { k = x; draw(); }).el, ro);
          draw();
        },
        `<p>With k bits you get at most <b>2<sup>k</sup></b> codes. Each code stands for one item.</p>`,
      ]},
      { k: "check", title: "How many bits?", b: [
        { t: "num", q: "You need a different code for each of 200 colours. What is the fewest bits that will do?", a: 8, tol: 0, unit: "bits", hint: "Find the smallest k with 2^k ≥ 200.", why: "2⁷ = 128 is too few; 2⁸ = 256 is enough. So 8 bits." },
      ]},
      { k: "learn", title: "Data types", b: [
        `<p>Five can be written many ways: <b>5</b> (decimal), <b>11111</b> (unary: count the marks), <b>V</b> (Roman), <b>00000101</b> (binary).</p>`,
        `<div class="key">A representation is a <b>data type</b> only if the computer has operations that work on it. Each ISA has its own data types and instructions.</div>`,
        `<p>This book uses mostly two: <b>2's complement integers</b> (for arithmetic) and <b>ASCII</b> (for characters). It also introduces <b>floating point</b>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a computer use only two values per wire, and how does it represent more than two things?", model: "Detecting whether a voltage is present (far from 0) or absent (close to 0) is much simpler and more reliable than measuring its exact value. To represent more than two things, it uses several wires together: k bits give 2^k different patterns, and each pattern is a code for one item." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Unsigned integers", mins: 15,
    blurb: "Positional notation in base 2: each place is worth twice the one to its right.",
    takeaway: "An unsigned integer has only a magnitude, no sign. Uses: counting how many times something has been done, and memory addresses (like house numbers). Positional notation, as in decimal (329 = 3×10² + 2×10¹ + 9×10⁰), but base 2: 00101 = 0×2⁴ + 0×2³ + 1×2² + 0×2¹ + 1×2⁰ = 5. With k bits: exactly 2^k integers, 0 to 2^k − 1.",
    steps: [
      { k: "learn", title: "Place value", b: [
        `<p>In 329, the 3 is worth 300 because of its <b>position</b>: 3×10<sup>2</sup> + 2×10<sup>1</sup> + 9×10<sup>0</sup>.</p>`,
        `<p>Binary works the same way, but each place is worth <b>2×</b> the one to its right:</p>`,
        fig(S.svg(420, 90, bitRow("00101", { top: ["16", "8", "4", "2", "1"] }), { label: "Place values of a five-bit number" })),
        `<div class="eq">00101 = 4 + 1 = 5</div>`,
      ]},
      { k: "play", title: "Build a number", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          function draw(b) {
            const top = b.split("").map((_, i) => String(2 ** (b.length - 1 - i)));
            const hot = b.split("").map((c, i) => (c === "1" ? i : -1)).filter((i) => i >= 0);
            f.innerHTML = S.svg(420, 90, bitRow(b, { top, hot }), { label: "Eight-bit unsigned number" });
            ro.innerHTML = readout([["Sum of the lit places", hot.map((i) => top[i]).join(" + ") || "0"], ["Value", String(uval(b))]]);
          }
          const bb = bitButtons("00101101", draw, { label: "Bits of the number" });
          host.append(bb.el, f, ro);
          draw(bb.get());
        },
        `<p class="aside">Click a bit to flip it. Try to make 100, then 255. What's the biggest value 8 bits can hold?</p>`,
      ]},
      { k: "check", title: "Read it", b: [
        { t: "num", q: "What unsigned value is 01011010?", a: 90, tol: 0, hint: "Places from the left: 128, 64, 32, 16, 8, 4, 2, 1. Add the ones under a 1.", why: "64 + 16 + 8 + 2 = 90." },
        { t: "num", q: "What's the largest unsigned value 10 bits can hold?", a: 1023, tol: 0, hint: "With k bits the range is 0 to 2^k − 1.", why: "2¹⁰ − 1 = 1023." },
      ]},
      { k: "why", title: "Why have no sign?", b: [
        `<p>Some quantities are never negative. A loop counter. A <b>memory address</b>, like a house number: there's no −129 Main Street.</p>`,
        `<p>Using all 2<sup>k</sup> codes for 0 and up doubles the largest value compared with spending half of them on negatives.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find the value of an unsigned binary number?", model: "Each position is worth a power of 2: 1, 2, 4, 8 and so on from the right. Add up the place values of the positions that hold a 1. With k bits the values go from 0 up to 2^k − 1." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const REPS = ["Unsigned", "Signed magnitude", "1's complement", "2's complement"];
  const repVal = (b, r) => {
    const k = b.length, u = uval(b), neg = b[0] === "1";
    if (r === 0) return String(u);
    if (r === 1) return neg ? "−" + (u - 2 ** (k - 1)) : String(u);
    if (r === 2) return neg ? "−" + uval(flip(b)) : String(u);
    return String(sval(b)).replace("-", "−");
  };
  const p3 = {
    id: "p3", title: "Negative numbers: three tries", mins: 20,
    blurb: "Signed magnitude, 1's complement, 2's complement. The winner is the one the adder likes.",
    takeaway: "To represent negatives, split the 2^k codes: positives 1 to 2^(k−1) − 1 get the normal pattern with a leading 0. For negatives there were three ideas. Signed magnitude: leading 1 means negative, the rest is the magnitude (−5 = 10101 in 5 bits). 1's complement: flip every bit of the positive (−5 = 11010; used on the CDC 6600). Both have two zeros (+0 and −0) and both need cumbersome hardware to add. 2's complement (−5 = 11011) was chosen because it makes the adding circuit simple, and it's used on almost every computer today. Any assignment of patterns to values is possible in principle; designers picked the one that simplifies the circuit.",
    steps: [
      { k: "learn", title: "Splitting the codes", b: [
        `<p>Five bits give 32 codes. Spend half on negatives: −15 to +15, plus 0. That's 31; one code is left over.</p>`,
        `<p>Positives keep their normal pattern, so they all start with a <b>0</b>: +15 = 01111. The question is which patterns to give the negatives.</p>`,
      ]},
      { k: "learn", title: "Three ideas", b: [
        `<div class="tile"><h3>Signed magnitude</h3><p>Leading 1 = negative, the rest is the size. −5 = ${mono("1 0101")}.</p></div>`,
        `<div class="tile"><h3>1's complement</h3><p>Flip every bit of +5. −5 = ${mono("11010")}. Used on some early machines such as the CDC 6600.</p></div>`,
        `<div class="tile"><h3>2's complement</h3><p>−5 = ${mono("11011")}. Looks odd. Wait for the reason.</p></div>`,
      ]},
      { k: "play", title: "One pattern, four meanings", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          function draw(b) {
            f.innerHTML = S.svg(420, 90, bitRow(b, { sign: true }), { label: "Five-bit pattern" });
            ro.innerHTML = readout(REPS.map((r, i) => [r, repVal(b, i)]));
          }
          const bb = bitButtons("11011", draw, { label: "Five bits" });
          host.append(bb.el, f, ro);
          draw(bb.get());
        },
        `<p class="aside">The bits don't “know” what they mean. Try ${mono("10000")} and ${mono("11111")}. Which representation has two different patterns for zero?</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "An adder just adds bit patterns, like column addition. In signed magnitude, what does it give for +5 + (−5), that is 00101 + 10101?", opts: [
          ["11010, which signed magnitude reads as −10. Wrong!", true, "Plain addition gives nonsense in signed magnitude. You'd need extra hardware to compare signs and subtract magnitudes."],
          ["00000", false, "Add the columns: 00101 + 10101 = 11010."],
          ["10000 (−0)", false, "Add the columns carefully: 1+1 = 10 in the rightmost column."],
        ]},
      ]},
      { k: "why", title: "Why 2's complement won", b: [
        `<p>A designer can assign any pattern to any value. But the <b>adder circuit</b> has to work with that choice.</p>`,
        `<p>Signed magnitude and 1's complement both need cumbersome extra hardware to add correctly. 2's complement lets one plain binary adder do the job. So it's used on just about every computer made today.</p>`,
        `<p class="aside">A good example of Chapter 1's theme: a software-side choice (how to represent numbers) made by thinking about hardware.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did computer designers settle on 2's complement for negative integers?", model: "Because with 2's complement an ordinary binary adder gives the right answer for positive and negative numbers without any extra circuitry. Signed magnitude and 1's complement both need more complicated hardware to add, and both have two patterns for zero." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  /* 4-bit code wheel: 16 codes around a circle, 2's complement values inside. */
  function wheel(cur, step) {
    const cx = 210, cy = 150, R = 112;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" style="fill:none;stroke:var(--line)"/>`;
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / 16, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const xi = cx + (R - 34) * Math.cos(a), yi = cy + (R - 34) * Math.sin(a), hot = i === cur;
      s += `<circle cx="${x}" cy="${y}" r="17" style="fill:${hot ? "var(--accent-soft)" : "var(--card)"};stroke:${hot ? "var(--accent)" : "var(--ink)"};stroke-width:${hot ? 2.5 : 1}"/>`;
      s += S.t(x, y + 4, bits(i, 4), { cls: "s m" });
      s += S.t(xi, yi + 5, String(sval(bits(i, 4))).replace("-", "−"), { cls: i >= 8 ? "b" : "c" });
    }
    const a1 = -Math.PI / 2 + (2 * Math.PI * 7.5) / 16;
    s += `<line x1="${cx + 60 * Math.cos(a1)}" y1="${cy + 60 * Math.sin(a1)}" x2="${cx + (R + 26) * Math.cos(a1)}" y2="${cy + (R + 26) * Math.sin(a1)}" style="stroke:var(--bad);stroke-width:3;stroke-dasharray:5 4"/>`;
    s += S.t(cx + 10, cy + R + 36, "overflow edge", { a: "start", cls: "s b" });
    return S.svg(420, 300, s, { max: 420, label: "Wheel of the 16 four-bit codes with their 2's complement values" });
  }
  const p4 = {
    id: "p4", title: "2's complement", mins: 25,
    blurb: "Chosen so that A + (−A) = 0 and adding 1 always walks to the next number.",
    takeaway: "The ALU (arithmetic and logic unit) adds two bit patterns column by column and doesn't know or care what they mean. 2's complement makes that plain addition correct. Each negative is chosen so that pattern(A) + pattern(−A) = 0 (with the carry out of the top bit ignored), and so that pattern(value + 1) = pattern(value) + 00001 all the way from the most negative to the most positive. The carry out can always be ignored. Shortcut for −A: flip all the bits (complement) and add 1 (since A + NOT A = 11…1, adding 1 more gives 0). Example: +13 = 01101 → 10010 → 10011 = −13. The leftover pattern 10000 is −16 (one below 10001 = −15). With k bits the range is −2^(k−1) to 2^(k−1) − 1; the LC-3 uses 16 bits: −32,768 to +32,767. Only one zero.",
    steps: [
      { k: "learn", title: "An adder that doesn't care", b: [
        `<p>Every computer adds with an <b>ALU</b> (arithmetic and logic unit). It takes two bit patterns and adds them column by column, carrying to the left, like decimal addition.</p>`,
        `<div class="key">The ALU doesn't know (or care) what the patterns mean. So pick the patterns for negatives so that plain addition gives the right answer.</div>`,
      ]},
      { k: "learn", title: "Two wishes", b: [
        `<ol><li><b>A + (−A) = 0.</b> Adding a number to its negative must give 00000.</li><li><b>Counting works.</b> Adding 00001 to any number's pattern gives the next number's pattern, from −15 right up to +15.</li></ol>`,
        `<p>Check wish 1 with +5 and −5:</p>`,
        `<div class="eq mono">  00101<br>+ 11011<br>= <s>1</s>00000</div>`,
        `<p>The carry out of the top bit is <b>ignored</b>. It always can be, in 2's complement.</p>`,
      ]},
      { k: "play", title: "The code wheel", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let cur = 5, last = "";
          function draw() {
            f.innerHTML = wheel(cur);
            ro.innerHTML = readout([["Pattern", bits(cur, 4)], ["2's complement value", String(sval(bits(cur, 4))).replace("-", "−")], ["Unsigned value", String(cur)]]);
            vd.className = "verdict " + (last === "over" ? "no" : "ok");
            vd.textContent = last === "over" ? "You crossed the overflow edge: 7 + 1 gave −8. The true answer, 8, doesn't fit in 4 bits." : last === "wrap" ? "1111 + 0001 = 0000: −1 + 1 = 0. The carry out is ignored, and the answer is right." : "Adding 0001 moves one step clockwise.";
          }
          const plus = el(`<button type="button" class="btn primary">+ 1</button>`), minus = el(`<button type="button" class="btn">− 1</button>`);
          plus.addEventListener("click", () => { last = cur === 7 ? "over" : cur === 15 ? "wrap" : ""; cur = (cur + 1) % 16; draw(); });
          minus.addEventListener("click", () => { last = cur === 8 ? "over" : cur === 0 ? "wrap" : ""; cur = (cur + 15) % 16; draw(); });
          const row = el(`<div class="row"></div>`); row.append(minus, plus);
          host.append(f, row, vd, ro);
          draw();
        },
        `<p class="aside">Four bits, so the values run −8 to +7. Step past 1111 (−1): you land on 0000, correctly. Step past 0111 (+7): you land on −8. That jump is <b>overflow</b>.</p>`,
      ]},
      { k: "learn", title: "The shortcut: flip and add 1", b: [
        `<p>A + (NOT A) is always all 1s (each column is 0+1). Add 1 more and you get all 0s. So <b>NOT A + 1</b> is exactly the pattern that cancels A:</p>`,
        `<div class="eq">−A = (flip every bit of A) + 1</div>`,
        `<p>Example, 8 bits: +20 = ${mono("00010100")} → flip → ${mono("11101011")} → add 1 → ${mono("11101100")} = −20.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What is −37 in 8-bit 2's complement? (+37 = 00100101)", opts: [
          ["11011011", true, "Flip: 11011010. Add 1: 11011011. Check: 00100101 + 11011011 = (1)00000000."],
          ["11011010", false, "That's only the flip (1's complement). Add 1."],
          ["10100101", false, "That's signed magnitude: just the sign bit changed."],
        ]},
      ]},
      { k: "learn", title: "The leftover pattern, and the range", b: [
        `<p>Five bits: we've placed +1…+15, −1…−15 and 0. One pattern is left: <b>10000</b>. Counting down, −15 is 10001, so 10000 is naturally <b>−16</b>.</p>`,
        `<div class="eq">k bits: −2<sup>k−1</sup> to 2<sup>k−1</sup> − 1</div>`,
        `<p>The LC-3 uses 16 bits: −32,768 to +32,767. There's one more negative than positive, and only <b>one zero</b>.</p>`,
      ]},
      { k: "check", title: "Range", b: [
        { t: "num", q: "What is the most negative number in 12-bit 2's complement?", a: -2048, tol: 0, hint: "−2^(k−1) with k = 12.", why: "−2¹¹ = −2048. Its pattern is 1000 0000 0000." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you get the 2's complement pattern for −A, and why does it work?", model: "Flip every bit of A and add 1. Flipping gives a pattern that adds to A to make all 1s; adding 1 to all 1s gives all 0s with a carry out, which 2's complement ignores. So A plus the new pattern is zero, which is what −A must be." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Converting binary and decimal", mins: 25,
    blurb: "Binary to decimal: add place values. Decimal to binary: odd or even, halve, repeat.",
    takeaway: "2's complement to decimal (8 bits, −128 to +127): look at the leading bit; if 1, the number is negative, so first flip all bits and add 1 to get the magnitude; add the powers of 2 under the 1s; attach the minus sign if needed. Example: 11000111 → 00111001 = 57 → −57. Decimal to binary: N odd → rightmost bit 1, even → 0; subtract that bit, divide by 2, repeat until 0; the bits come out right to left. Then add a leading 0; for a negative number, form the positive pattern and negate it (flip, add 1). Fractions: binary to decimal adds 0.5, 0.25, 0.125, 0.0625… under the 1s (.1011 = 0.6875). Decimal to binary: multiply by 2; if the result is ≥ 1 the next bit is 1 (subtract the 1), otherwise 0; repeat as far as you want (0.421 ≈ 0.0110).",
    steps: [
      { k: "learn", title: "Binary → decimal", b: [
        `<ol><li><b>Leading bit 1?</b> It's negative. Flip all bits and add 1 to get the positive pattern.</li><li>Add the place values under the 1s.</li><li>Put the minus sign back if it was negative.</li></ol>`,
        `<p>Example: ${mono("11110010")} → leading 1, negative → flip ${mono("00001101")} → +1 → ${mono("00001110")} = 14 → <b>−14</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "What decimal value is the 8-bit 2's complement integer 11100110?", a: -26, tol: 0, hint: "Leading 1: flip to 00011001, add 1.", hint2: "00011010 = 16 + 8 + 2.", why: "Flip → 00011001, +1 → 00011010 = 26. So −26." },
      ]},
      { k: "play", title: "Decimal → binary, step by step", b: [
        (host, id) => {
          const out = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          let N = 77;
          function draw() {
            let n = N, rows = "", bitsOut = "";
            if (n === 0) { rows = `<tr><td>0</td><td>even</td><td>0</td></tr>`; bitsOut = "0"; }
            while (n > 0) {
              const b = n % 2;
              rows += `<tr><td>${n}</td><td>${b ? "odd" : "even"}</td><td><b>${b}</b></td><td>(${n} − ${b}) / 2 = ${(n - b) / 2}</td></tr>`;
              bitsOut = b + bitsOut; n = (n - b) / 2;
            }
            out.innerHTML = `<table><thead><tr><th>N</th><th>odd/even</th><th>bit</th><th>next</th></tr></thead><tbody>${rows}</tbody></table>`;
            ro.innerHTML = readout([["Bits, read bottom to top", bitsOut], ["8-bit pattern", bits(N, 8)]]);
          }
          host.append(slider({ id: id + "-n", label: "Decimal number N", min: 0, max: 127, step: 1, value: N, show: (x) => String(x) }, (x) => { N = x; draw(); }).el, out, ro);
          draw();
        },
        `<p class="aside">Each line finds one bit, starting from the right. The first line's bit is the 1s place, the next the 2s place, and so on.</p>`,
      ]},
      { k: "check", title: "Negative to binary", b: [
        { t: "mcq", q: "Convert −45 to 8-bit 2's complement. (45 = 32 + 8 + 4 + 1)", opts: [
          ["11010011", true, "+45 = 00101101. Flip: 11010010. Add 1: 11010011."],
          ["10101101", false, "That's signed magnitude."],
          ["11010010", false, "That's the flip without the +1."],
        ]},
      ]},
      { k: "learn", title: "Fractions", b: [
        `<p>Places to the right of the binary point are worth ½, ¼, ⅛, 1/16…</p>`,
        `<div class="eq">.1101 = 0.5 + 0.25 + 0.0625 = 0.8125</div>`,
        `<p><b>Decimal → binary fraction:</b> multiply by 2. If you get ≥ 1, the next bit is 1 (drop the 1); otherwise it's 0. Repeat.</p>`,
        `<p>0.3: ×2 = <b>0</b>.6 → ×2 = <b>1</b>.2 → 0.2 ×2 = <b>0</b>.4 → ×2 = <b>0</b>.8 → ×2 = <b>1</b>.6 … So 0.3 ≈ .01001…, and it never ends.</p>`,
      ]},
      { k: "check", title: "Fractions", b: [
        { t: "num", q: "What is the binary fraction .0111 in decimal?", a: 0.4375, tol: 0.001, hint: "0.25 + 0.125 + 0.0625.", why: "0.25 + 0.125 + 0.0625 = 0.4375." },
        { t: "mcq", q: "0.1 in decimal: does it have an exact binary fraction with a finite number of bits?", opts: [
          ["No: doubling 0.1 cycles 0.2, 0.4, 0.8, 0.6, 0.2… forever", true, "Right. That's why computers can't store 0.1 exactly, and why 0.1 + 0.2 often isn't exactly 0.3 in a program."],
          ["Yes: 0.0001", false, ".0001 is 1/16 = 0.0625."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how to convert a decimal integer to binary.", model: "If the number is odd the rightmost bit is 1, if even it's 0. Subtract that bit, divide by 2, and repeat with the new number until it reaches 0. The bits come out from right to left. Add a leading 0 for the sign; for a negative number, convert the magnitude and then flip all the bits and add 1." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Arithmetic: add, subtract, extend, overflow", mins: 25,
    blurb: "Subtraction is adding the negative. Short numbers get their sign bit copied. Watch for overflow.",
    takeaway: "Addition: right to left, column by column, carry after 1. Subtraction: A − B = A + (−B): negate B (flip, add 1) and add; ignore the carry out. x + x shifts the pattern one place left (if the result fits). Sign-extension (SEXT): to widen a 2's complement number, copy its sign bit into the new leading positions; leading 0s don't change a positive value and leading 1s don't change a negative one (−5 = 111011 = 1111111111111011). Padding a negative with 0s instead changes its value (111011 → 0000000000111011 = +59). Overflow: the result doesn't fit. Unsigned: a carry out of the top bit (like an odometer rolling from 99999 to 00000). 2's complement: adding two positives gives a negative, or two negatives gives a positive (5 bits: 9 + 11 → 10100 = −12; −12 + −6 → 01110 = +14). Adding a positive and a negative never overflows.",
    steps: [
      { k: "learn", title: "Add, and subtract by adding", b: [
        `<p>Binary addition is decimal addition with a carry after 1 instead of after 9. Example (5 bits): 11 + 3:</p>`,
        `<div class="eq mono">  01011<br>+ 00011<br>= 01110  (14)</div>`,
        `<div class="key"><b>A − B = A + (−B).</b> Negate B (flip, add 1), then add. No separate subtractor needed.</div>`,
      ]},
      { k: "play", title: "An 8-bit ALU", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let A = 100, B = 50, sub = 0;
          function draw() {
            const Bv = sub ? -B : B, a = bits(A, 8), b = bits(Bv, 8), r = bits(A + Bv, 8), true_ = A + Bv;
            let s = S.t(20, 30, "A", { a: "start" }) + bitRow(a, { y: 12, w: 30, sign: true });
            s += S.t(20, 74, sub ? "−B" : "B", { a: "start" }) + bitRow(b, { y: 56, w: 30, sign: true });
            s += `<line class="w" x1="80" y1="96" x2="340" y2="96"/>` + S.t(20, 122, "sum", { a: "start" }) + bitRow(r, { y: 104, w: 30, sign: true });
            f.innerHTML = S.svg(420, 150, s, { label: "Eight-bit addition" });
            const over = true_ > 127 || true_ < -128;
            ro.innerHTML = readout([["A", String(A)], [sub ? "−B" : "B", String(Bv)], ["True answer", String(true_)], ["ALU reads as", String(sval(r))]]);
            vd.className = "verdict " + (over ? "no" : "ok");
            vd.textContent = over ? `Overflow: ${true_} doesn't fit in −128…127. Both inputs had the same sign but the result's sign bit flipped.` : "Correct: the result fits in 8 bits.";
          }
          host.append(toggle(["A + B", "A − B"], (k) => { sub = k; draw(); }), f,
            slider({ id: id + "-a", label: "A", min: -128, max: 127, step: 1, value: A, show: (v) => String(v) }, (v) => { A = v; draw(); }).el,
            slider({ id: id + "-b", label: "B", min: -127, max: 127, step: 1, value: B, show: (v) => String(v) }, (v) => { B = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Shaded boxes are sign bits. Start at 100 + 50: the true sum 150 doesn't fit, and the ALU says −106. Now try a positive plus a negative: can you make <i>that</i> overflow?</p>`,
      ]},
      { k: "learn", title: "x + x is a left shift", b: [
        `<p>Add a number to itself and every bit moves one place left, a 0 entering on the right:</p>`,
        `<div class="eq mono">00101101 (45) + 00101101 = 01011010 (90)</div>`,
        `<p>Each place value doubles, so the whole number doubles. (As long as the result still fits.)</p>`,
      ]},
      { k: "learn", title: "Sign-extension", b: [
        `<p>To add a 6-bit number to a 16-bit one, first make them the same length. Which bits go in front?</p>`,
        `<div class="two"><div class="tile"><h3>Positive: copy 0s</h3><p>${mono("000101")} → ${mono("0000000000000101")}: still 5.</p></div><div class="tile"><h3>Negative: copy 1s</h3><p>${mono("111011")} → ${mono("1111111111111011")}: still −5.</p></div></div>`,
        `<div class="key"><b>Sign-extension (SEXT):</b> copy the sign bit into all the new places. The value doesn't change.</div>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student adds 6-bit −5 (${mono("111011")}) to 16-bit 13 by padding −5 with zeros: ${mono("0000000000111011")}. The answer comes out 72.</p>`,
        { t: "mcq", q: "What went wrong?", opts: [
          ["Padding with 0s turned −5 into +59; they should have copied the sign bit (1s)", true, "0000000000111011 is +59, and 59 + 13 = 72. Sign-extended, −5 is 1111111111111011, and the sum is 8."],
          ["You can't add numbers of different lengths at all", false, "You can, after sign-extending the shorter one."],
          ["The carry out wasn't ignored", false, "The carry isn't the problem here. The value of −5 was changed before adding."],
        ]},
      ]},
      { k: "learn", title: "Overflow", b: [
        `<p>An old car odometer reads 99,992. Drive 100 miles: it shows 00,092. The carry out of the top digit is lost. That's <b>overflow</b> in unsigned arithmetic: a carry out of the top bit.</p>`,
        `<p>In 2's complement it's subtler. Five bits hold −16…+15:</p>`,
        `<div class="two"><div class="tile"><p>9 + 11:<br>${mono("01001 + 01011 = 10100")}<br>Two positives gave a <b>negative</b> (−12).</p></div><div class="tile"><p>−12 + −6:<br>${mono("10100 + 11010 = 01110")}<br>Two negatives gave a <b>positive</b> (+14).</p></div></div>`,
        `<div class="key">2's complement overflow: the inputs have the <b>same sign</b> and the result has the <b>other</b> sign. A positive plus a negative never overflows.</div>`,
      ]},
      { k: "check", title: "Overflow or not?", b: [
        { t: "sort", q: "8-bit 2's complement (−128…127). Does each sum overflow?", bins: ["Overflow", "Fine"], items: [
          ["90 + 40", 0, "130 > 127. Two positives give a negative pattern."],
          ["−100 + 90", 1, "Mixed signs: −10, fits."],
          ["−70 + −70", 0, "−140 < −128."],
          ["127 + (−128)", 1, "−1, fits."],
          ["64 + 63", 1, "127 just fits."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can the hardware tell that a 2's complement addition overflowed?", model: "If both inputs have the same sign but the result has the opposite sign, the true answer didn't fit and the sum overflowed. Two positives can't really add to a negative, and two negatives can't add to a positive. Adding a positive and a negative never overflows." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const OPS = { AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b, NOT: (a) => 1 - a };
  const p7 = {
    id: "p7", title: "Logical operations", mins: 25,
    blurb: "AND, OR, NOT, XOR, applied bit by bit. Masks pick out the bits you care about.",
    takeaway: "A logical variable is 0 or 1 (originally false/true). A truth table has n input columns, one output column and 2^n rows. AND (binary: two sources): 1 only if all inputs are 1 (the ALL operation). OR (inclusive-OR): 1 if any input is 1 (the ANY operation). NOT (unary, the complement): flips the bit. XOR (exclusive-OR): 1 if the two inputs differ, 0 if they're the same. On m-bit patterns these act bit-wise, on each pair of bits independently. A bit mask isolates bits: AND with 00000011 keeps bits 1–0 and clears bits 7–2. XOR of two patterns is all 0s exactly when they're identical. DeMorgan's laws: NOT(NOT A AND NOT B) = A OR B, i.e. “not both false” = “at least one true”; and NOT(NOT A OR NOT B) = A AND B.",
    steps: [
      { k: "learn", title: "Four functions", b: [
        `<div class="tbl"><table><thead><tr><th>A</th><th>B</th><th>AND</th><th>OR</th><th>XOR</th></tr></thead><tbody>
          <tr><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>1</td><td>0</td><td>1</td><td>1</td></tr>
          <tr><td>1</td><td>0</td><td>0</td><td>1</td><td>1</td></tr><tr><td>1</td><td>1</td><td>1</td><td>1</td><td>0</td></tr></tbody></table></div>`,
        `<p><b>AND</b> = ALL inputs are 1. <b>OR</b> = ANY input is 1. <b>XOR</b> = the inputs <b>differ</b>. <b>NOT</b> takes one input and flips it.</p>`,
        `<p class="aside">A truth table with n inputs has 2<sup>n</sup> rows, one per input combination.</p>`,
      ]},
      { k: "play", title: "Bit-wise operations", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let op = "AND", a = "01011010", m = "00001111";
          function draw() {
            const r = a.split("").map((x, i) => (op === "NOT" ? OPS.NOT(+x) : OPS[op](+x, +m[i]))).join("");
            let s = S.t(16, 40, "A", { a: "start" }) + bitRow(a, { y: 18, w: 32 });
            if (op !== "NOT") s += S.t(16, 84, "B", { a: "start" }) + bitRow(m, { y: 62, w: 32 });
            s += `<line class="w" x1="70" y1="104" x2="350" y2="104"/>` + S.t(16, 132, op, { a: "start", cls: "s" }) + bitRow(r, { y: 110, w: 32, hot: r.split("").map((c, i) => (c === "1" ? i : -1)) });
            f.innerHTML = S.svg(420, 156, s, { label: "Bit-wise logical operation" });
          }
          const A = bitButtons(a, (b) => { a = b; draw(); }, { label: "Bits of A" }), B = bitButtons(m, (b) => { m = b; draw(); }, { label: "Bits of B" });
          host.append(toggle(["AND", "OR", "XOR", "NOT"], (k) => { op = ["AND", "OR", "XOR", "NOT"][k]; draw(); }), el(`<p class="aside">A:</p>`), A.el, el(`<p class="aside">B:</p>`), B.el, f);
          draw();
        },
        `<p class="aside">Each column is computed on its own. With AND, B acts as a <b>mask</b>: where B is 0 the result is forced to 0; where B is 1, A's bit passes through.</p>`,
      ]},
      { k: "learn", title: "Masks", b: [
        `<p>Only the two rightmost bits of an 8-bit value A matter (they pick one of four tasks). AND with the <b>mask</b> ${mono("00000011")}:</p>`,
        `<div class="eq mono">A = 10110110<br>AND 00000011<br>= 00000010</div>`,
        `<p>Whatever bits 7–2 were, they're now 0. The result is always one of 00000000, 00000001, 00000010, 00000011.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "You want to know if two 16-bit patterns P and Q are identical. Which single operation tells you?", opts: [
          ["P XOR Q: all 0s means identical", true, "XOR is 0 exactly where the bits agree."],
          ["P AND Q: all 1s means identical", false, "P = Q = 0000… gives AND = 0000…, yet they're identical."],
          ["P OR Q: all 0s means identical", false, "That only happens when both are all 0s."],
        ]},
        { t: "mcq", q: "Which mask, ANDed with any 16-bit 2's complement number, tells you only whether it's negative and whether it's odd?", opts: [
          ["1000000000000001", true, "Bit 15 is the sign; bit 0 is odd/even. Everything else is cleared."],
          ["0111111111111110", false, "That keeps everything except the two bits you want."],
          ["0000000000000011", false, "Bit 1 doesn't tell you the sign. You need bit 15."],
        ]},
      ]},
      { k: "learn", title: "DeMorgan's laws", b: [
        `<p>Flip both inputs of an AND, then flip its output. You get OR:</p>`,
        `<div class="eq">NOT( NOT A AND NOT B ) = A OR B</div>`,
        `<p>In words: “it is not the case that A and B are both false” = “at least one of A and B is true”.</p>`,
        `<p>And the mirror image: NOT( NOT A OR NOT B ) = A AND B.</p>`,
      ]},
      { k: "play", title: "Check DeMorgan yourself", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let A = 0, B = 1;
          function draw() {
            const l = 1 - ((1 - A) & (1 - B));
            ro.innerHTML = readout([["NOT A", String(1 - A)], ["NOT B", String(1 - B)], ["NOT A AND NOT B", String((1 - A) & (1 - B))], ["NOT( … )", String(l)], ["A OR B", String(A | B)]]);
          }
          host.append(toggle(["A = 0", "A = 1"], (k) => { A = k; draw(); }, 0), toggle(["B = 0", "B = 1"], (k) => { B = k; draw(); }, 1), ro);
          draw();
        },
        `<p class="aside">Try all four combinations. The last two rows always match.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a bit mask, and how does AND use one?", model: "A bit mask is a pattern that marks which bits you care about with 1s and which to ignore with 0s. ANDing a value with the mask keeps the value's bits wherever the mask has a 1 and forces 0 wherever the mask has a 0, so only the bits you care about are left." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Bit vectors", mins: 15,
    blurb: "One bit per unit: free or busy. AND clears a bit, OR sets one.",
    takeaway: "A bit vector is an m-bit pattern where each bit is an independent 0/1 property. A bit mask is one kind (the property: do we care about this bit?). Another use: tracking which of m units are free (1) or busy (0), e.g. machines or taxis; bits are numbered right to left from 0. To mark unit i busy, AND with a mask that has a 0 in bit i and 1s elsewhere (clears bit i, leaves the rest). To mark unit i free, OR with a mask that has a 1 in bit i and 0s elsewhere (sets bit i). Example: 11000010 means units 7, 6 and 1 are free.",
    steps: [
      { k: "learn", title: "One bit per unit", b: [
        `<p>Eight taxis. Keep one bit per taxi: <b>1 = free</b>, <b>0 = busy</b>. Bits are numbered right to left, 7 down to 0.</p>`,
        fig(S.svg(420, 90, bitRow("11000010", { top: ["7", "6", "5", "4", "3", "2", "1", "0"], hot: [0, 1, 6] }), { label: "Eight-bit busyness vector" })),
        `<p>${mono("11000010")}: taxis 7, 6 and 1 are free.</p>`,
      ]},
      { k: "play", title: "Dispatch taxis", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), log = el(`<p class="aside"></p>`);
          let v = "11000010", unit = 7;
          function draw(msg) {
            f.innerHTML = S.svg(420, 90, bitRow(v, { top: ["7", "6", "5", "4", "3", "2", "1", "0"], hot: [7 - unit] }), { label: "Busyness vector" });
            if (msg) log.innerHTML = msg;
          }
          const assign = el(`<button type="button" class="btn primary">Assign work (AND)</button>`), done = el(`<button type="button" class="btn">Finished (OR)</button>`);
          assign.addEventListener("click", () => { const m = bits(255 - 2 ** unit, 8), r = bits(uval(v) & uval(m), 8); draw(`${v} AND ${m} = <b>${r}</b>: taxi ${unit} is now busy.`); v = r; draw(); });
          done.addEventListener("click", () => { const m = bits(2 ** unit, 8), r = bits(uval(v) | uval(m), 8); draw(`${v} OR ${m} = <b>${r}</b>: taxi ${unit} is free again.`); v = r; draw(); });
          const row = el(`<div class="row"></div>`); row.append(assign, done);
          host.append(slider({ id: id + "-u", label: "Taxi number", min: 0, max: 7, step: 1, value: unit, show: (x) => String(x) }, (x) => { unit = x; draw(); }).el, f, row, log);
          draw("Pick a taxi, then assign it work or mark it finished.");
        },
        `<p class="aside">The mask for AND has a single 0 (clear that bit). The mask for OR has a single 1 (set that bit). All other bits are left alone.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The vector is 01100010. Taxi 3 finishes its job. Which operation updates the vector?", opts: [
          ["OR with 00001000, giving 01101010", true, "Bit 3 is set; nothing else changes."],
          ["AND with 11110111, giving 01100010", false, "AND with a 0 clears a bit, which would mark it busy."],
          ["OR with 11110111", false, "That would set almost every bit, freeing taxis that are still busy."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Which logical operation clears one bit and which sets one, and what does each mask look like?", model: "AND clears a bit: the mask has a 0 in that position and 1s everywhere else, so everything else passes through unchanged. OR sets a bit: the mask has a 1 in that position and 0s everywhere else." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  function f32(x) {
    const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, x);
    return dv.getUint32(0).toString(2).padStart(32, "0");
  }
  function fromF32(b) { const dv = new DataView(new ArrayBuffer(4)); dv.setUint32(0, parseInt(b, 2)); return dv.getFloat32(0); }
  const p9 = {
    id: "p9", title: "Floating point", mins: 25,
    blurb: "Scientific notation in binary: give up some precision to get an enormous range.",
    takeaway: "16-bit 2's complement gives 15 bits of precision but only the range −32,768…+32,767. Numbers like 6.022×10²³ need huge range and few digits. Floating point spends some bits on range. The 32-bit float (IEEE): 1 sign bit S, 8 exponent bits, 23 fraction bits. Normalized (exponent field 1–254): N = (−1)^S × 1.fraction × 2^(exponent − 127). The leading 1 isn't stored (it's always there), giving 24 bits of precision. The exponent uses an excess (bias) code: real exponent = field − 127 (10000110 = 134 → +7). Range of normalized numbers: 2^−126 up to nearly 2^128. Exponent field all 1s with fraction 0 is ±infinity. Exponent field 0 means subnormal: N = (−1)^S × 0.fraction × 2^−126, reaching down to 2^−149. Example: −6⅝ = −110.101 = −1.10101 × 2² → 1 10000001 10101000…0.",
    steps: [
      { k: "learn", title: "Range vs precision", b: [
        `<p>16-bit integers have 15 bits of <b>precision</b> but a <b>range</b> of only ±32,768. Avogadro's number, 6.022×10<sup>23</sup>, needs a huge range but only 4 significant digits.</p>`,
        `<div class="key"><b>Floating point</b> spends some bits on the range (an exponent) and the rest on precision. More range, less precision.</div>`,
      ]},
      { k: "learn", title: "The 32-bit float", b: [
        fig(S.svg(420, 80, `<rect x="20" y="20" width="30" height="34" style="fill:var(--accent-soft);stroke:var(--ink)"/><rect x="50" y="20" width="110" height="34" style="fill:var(--cool-soft);stroke:var(--ink)"/><rect x="160" y="20" width="240" height="34" style="fill:var(--card);stroke:var(--ink)"/>` + S.t(35, 42, "S") + S.t(105, 42, "exponent (8)") + S.t(280, 42, "fraction (23)") + S.t(35, 72, "1", { cls: "s" }) + S.t(105, 72, "bits 30–23", { cls: "s" }) + S.t(280, 72, "bits 22–0", { cls: "s" }), { label: "Fields of a 32-bit float" })),
        `<div class="eq">N = (−1)<sup>S</sup> × 1.fraction × 2<sup>exponent − 127</sup></div>`,
        `<ul><li><b>Sign</b>: 0 positive, 1 negative.</li><li><b>1.fraction</b>: normalized, one 1 before the point. That 1 is always there, so it isn't stored: 23 stored bits give 24 bits of precision.</li><li><b>Exponent</b>: stored with a <b>bias</b> of 127. Field 10000110 = 134 means 2<sup>+7</sup>.</li></ul>`,
      ]},
      { k: "play", title: "Decode a float", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const inp = el(`<input class="mono" inputmode="decimal" value="11" aria-label="A decimal number" style="width:12ch">`);
          function draw() {
            const x = parseFloat(String(inp.value).replace("−", "-"));
            if (!isFinite(x) && !/inf/i.test(inp.value)) return;
            const b = f32(/inf/i.test(inp.value) ? (inp.value.trim()[0] === "-" ? -Infinity : Infinity) : x), sgn = b[0], ex = b.slice(1, 9), fr = b.slice(9), e = uval(ex);
            let s = "";
            b.split("").forEach((c, i) => {
              const x = 10 + i * 12.5, fill = i === 0 ? "var(--accent-soft)" : i < 9 ? "var(--cool-soft)" : "var(--card)";
              s += `<rect x="${x}" y="14" width="12.5" height="24" style="fill:${fill};stroke:var(--ink);stroke-width:.6"/>` + S.t(x + 6.25, 31, c, { cls: "s m" });
            });
            s += S.t(16, 54, "S", { cls: "s" }) + S.t(10 + 5 * 12.5, 54, "exponent", { cls: "s" }) + S.t(10 + 20.5 * 12.5, 54, "fraction", { cls: "s" });
            f.innerHTML = S.svg(420, 62, s, { label: "The 32 bits of the float" });
            const kind = e === 255 ? (uval(fr) ? "NaN (not a number)" : "infinity") : e === 0 ? "subnormal (or zero)" : "normalized";
            const real = e === 0 ? -126 : e - 127, mant = (e === 0 ? "0." : "1.") + fr.replace(/0+$/, "");
            ro.innerHTML = readout([["Sign S", sgn], ["Exponent field", `${ex} = ${e}`], ["Real exponent", e === 255 ? "—" : `${real}`], ["Significand", e === 255 ? "—" : mant + (mant.endsWith(".") ? "0" : "")], ["Kind", kind], ["Stored value", String(fromF32(b))]]);
          }
          inp.addEventListener("input", draw);
          const row = el(`<div class="row"><span>Number:</span></div>`); row.append(inp);
          host.append(row, f, ro);
          draw();
        },
        `<p class="aside">Type any number: 11, −0.75, 0.1, 1e38, 1e-40. The first bit is S, the next 8 the exponent, the last 23 the fraction. Notice “stored value” for 0.1: floats can't hold it exactly either.</p>`,
      ]},
      { k: "learn", title: "Encoding by hand", b: [
        `<p>Encode <b>11.0</b>:</p>`,
        `<ol><li>Binary: 11 = 1011.</li><li>Normalize: 1.011 × 2<sup>3</sup>.</li><li>Sign 0. Exponent field 3 + 127 = 130 = ${mono("10000010")}. Fraction: the bits after the point, ${mono("011")} then 20 zeros.</li></ol>`,
        `<div class="eq mono">0 10000010 01100000000000000000000</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which is −0.75 as a 32-bit float? (0.75 = 0.11 in binary)", opts: [
          ["1 01111110 10000000000000000000000", true, "−0.11 = −1.1 × 2⁻¹. Sign 1; exponent −1 + 127 = 126 = 01111110; fraction 1 then zeros."],
          ["1 10000001 10000000000000000000000", false, "That exponent field is 129, meaning 2^+2. You need 2^−1."],
          ["1 01111110 11000000000000000000000", false, "Don't store the leading 1: after normalizing to 1.1, the fraction is just 1."],
        ]},
        { t: "num", q: "A float has exponent field 10000101 and fraction 0100…0, sign 0. What is its value?", a: 80, tol: 0, hint: "Field 133 → real exponent 6. Significand 1.01 = 1.25.", why: "1.25 × 2⁶ = 80." },
      ]},
      { k: "learn", title: "The special patterns", b: [
        `<div class="two"><div class="tile"><h3>Exponent all 1s</h3><p>Fraction 0: <b>±infinity</b> (sign chooses which). Other fractions are used for other special values.</p></div><div class="tile"><h3>Exponent all 0s</h3><p><b>Subnormal</b>: N = (−1)<sup>S</sup> × <b>0</b>.fraction × 2<sup>−126</sup>. Tiny numbers below 2<sup>−126</sup>, down to 2<sup>−149</sup>.</p></div></div>`,
        `<p>Normalized floats run from 2<sup>−126</sup> up to nearly 2<sup>128</sup>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do the three fields of a 32-bit float hold, and why is the leading 1 not stored?", model: "One sign bit, eight exponent bits stored with a bias of 127, and 23 fraction bits. The number is 1.fraction times 2 to the (exponent − 127), negated if the sign is 1. In normalized form the bit before the binary point is always 1, so storing it would waste a bit; leaving it out gives 24 bits of precision from 23 stored bits." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "ASCII and hexadecimal", mins: 20,
    blurb: "A code for every key, and a shorthand that makes 16-bit patterns readable.",
    takeaway: "ASCII (American Standard Code for Information Interchange) is the 8-bit code nearly all equipment uses to pass characters between the processor and I/O devices, so keyboards, computers and monitors from different makers work together. Each key has a code: digit 3 = 00110011, digit 2 = 00110010, e = 01100101, E = 01000101, ENTER = 00001101. Upper and lower case differ only in one bit (bit 5, worth 32). The full table is in Appendix E. Hexadecimal is not a data type, just a notation for humans: group the bits in fours from the right, and write each group as one of 0–9, A–F (10–15). 0011 1101 0110 1110 = x3D6E. It works because each group of four is the coefficient of a power of 16.",
    steps: [
      { k: "learn", title: "ASCII", b: [
        `<p>Keyboards, computers and monitors are made by different companies. They all agree on one code for characters: <b>ASCII</b>, eight bits per character.</p>`,
        `<div class="tbl"><table><thead><tr><th>Key</th><th>ASCII</th><th>Hex</th></tr></thead><tbody>
          <tr><td>0</td><td class="mono">00110000</td><td class="mono">x30</td></tr><tr><td>3</td><td class="mono">00110011</td><td class="mono">x33</td></tr>
          <tr><td>A</td><td class="mono">01000001</td><td class="mono">x41</td></tr><tr><td>a</td><td class="mono">01100001</td><td class="mono">x61</td></tr>
          <tr><td>ENTER</td><td class="mono">00001101</td><td class="mono">x0D</td></tr></tbody></table></div>`,
        `<p class="aside">Most keys have two codes: with and without Shift. The full table is in the book's Appendix E.</p>`,
      ]},
      { k: "play", title: "Type and see", b: [
        (host, id) => {
          const out = el(`<div class="tbl"></div>`);
          const inp = el(`<input value="Hi 5!" aria-label="Text to encode" maxlength="12" style="width:16ch">`);
          function draw() {
            const rows = [...inp.value].filter((c) => c.charCodeAt(0) < 128).map((c) => { const b = bits(c.charCodeAt(0), 8); return `<tr><td>${c === " " ? "space" : c}</td><td class="mono">${b}</td><td class="mono">x${hex(b)}</td><td>${c.charCodeAt(0)}</td></tr>`; }).join("");
            out.innerHTML = `<table><thead><tr><th>char</th><th>bits</th><th>hex</th><th>decimal</th></tr></thead><tbody>${rows}</tbody></table>`;
          }
          inp.addEventListener("input", draw);
          const row = el(`<div class="row"><span>Text:</span></div>`); row.append(inp);
          host.append(row, out);
          draw();
        },
        `<p class="aside">Compare H and h, or any upper and lower case pair. Exactly one bit differs.</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "The user types the digit 7. Its ASCII code is x37. To get the integer 7 for arithmetic, the program should…", opts: [
          ["Subtract x30 (48): 00110111 − 00110000 = 00000111", true, "Digits 0–9 are x30–x39 in order, so subtracting x30 gives the value. You'll do exactly this in Chapter 10."],
          ["Use x37 directly; it already equals 7", false, "x37 is 55, not 7. The ASCII code is not the number."],
          ["AND it with 11110000", false, "That keeps the wrong half: you'd get x30."],
        ]},
      ]},
      { k: "learn", title: "Hexadecimal", b: [
        `<p>Try to copy ${mono("1010011100011111")} from memory. Hard. Group it in fours from the right and name each group:</p>`,
        `<div class="eq mono">1010 0111 0001 1111 = A 7 1 F</div>`,
        `<div class="tbl"><table><tbody><tr><td class="mono">0000 0</td><td class="mono">0100 4</td><td class="mono">1000 8</td><td class="mono">1100 C</td></tr><tr><td class="mono">0001 1</td><td class="mono">0101 5</td><td class="mono">1001 9</td><td class="mono">1101 D</td></tr><tr><td class="mono">0010 2</td><td class="mono">0110 6</td><td class="mono">1010 A</td><td class="mono">1110 E</td></tr><tr><td class="mono">0011 3</td><td class="mono">0111 7</td><td class="mono">1011 B</td><td class="mono">1111 F</td></tr></tbody></table></div>`,
        `<p class="aside">The book writes hex with a leading x: xA71F. It's a notation for people, not a data type. Each hex digit is one group of 4 bits, the coefficient of a power of 16.</p>`,
      ]},
      { k: "play", title: "Hex ↔ binary", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          function draw(b) {
            let s = bitRow(b, { y: 20, w: 24 });
            for (let g = 0; g < 4; g++) s += S.t(210 - 192 + g * 96 + 48, 74, hex(b.slice(g * 4, g * 4 + 4)), { cls: "big m c" });
            for (let g = 1; g < 4; g++) s += `<line x1="${18 + g * 96}" y1="14" x2="${18 + g * 96}" y2="84" style="stroke:var(--accent);stroke-width:2"/>`;
            f.innerHTML = S.svg(420, 90, s, { label: "Sixteen bits grouped into four hex digits" });
            ro.innerHTML = readout([["Hex", "x" + hex(b)], ["Unsigned", String(uval(b))], ["2's complement", String(sval(b))]]);
          }
          const bb = bitButtons("0011110101101110", draw, { label: "Sixteen bits" });
          host.append(bb.el, f, ro);
          draw(bb.get());
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What is xC0DE in binary?", opts: [
          ["1100 0000 1101 1110", true, "C = 1100, 0 = 0000, D = 1101, E = 1110."],
          ["1100 0000 1110 1101", false, "D and E are swapped."],
          ["1011 0000 1101 1110", false, "C is 12 = 1100, not 1011 (11)."],
        ]},
        { t: "num", q: "What is x2F as an unsigned decimal number?", a: 47, tol: 0, hint: "2×16 + F, and F = 15.", why: "2×16 + 15 = 47." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do we use hexadecimal if the computer only uses binary?", model: "Hex is for people. Long binary strings are easy to misread and miscopy. Grouping the bits in fours and writing each group as one hex digit makes a 16-bit pattern just four symbols, and you can convert back exactly, group by group. The computer itself still stores the bits." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp2", eyebrow: "Patt & Patel · Chapter 2", title: "Bits, Data Types, and Operations",
    intro: `<p>Ten parts: what a bit is, unsigned and signed integers, why 2's complement won, converting to and from decimal, arithmetic and overflow, logical operations and masks, bit vectors, floating point, ASCII and hex.</p><p>The Math Toolkit's binary module covers some of the same ground with circuits; this chapter goes further. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. There are a lot of them: do them in sittings of 10. They test whether the ideas stuck, so don't expect them to look like the questions here.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Bits</h3>
      <p>1 = voltage far from 0, 0 = close to 0. k bits → 2<sup>k</sup> codes. Data type = representation + operations on it.</p>
      <h3>Integers (k bits)</h3>
      <div class="eq">Unsigned: 0 … 2<sup>k</sup> − 1    2's complement: −2<sup>k−1</sup> … 2<sup>k−1</sup> − 1</div>
      <p>−A = flip all bits, add 1. Ignore the carry out. LC-3: 16 bits, −32,768 … +32,767.</p>
      <h3>Conversions</h3>
      <p>Binary → decimal: if leading 1, negate first; add place values. Decimal → binary: odd → 1, even → 0; subtract, halve, repeat. Fractions: ×2, ≥ 1 → bit 1.</p>
      <h3>Arithmetic</h3>
      <p>A − B = A + (−B). x + x = shift left. Sign-extend by copying the sign bit. Overflow: same-sign inputs, opposite-sign result.</p>
      <h3>Logic</h3>
      <p>AND (all), OR (any), NOT, XOR (differ); bit-wise on patterns. AND with a mask clears; OR with a mask sets. DeMorgan: NOT(NOT A AND NOT B) = A OR B.</p>
      <h3>Other representations</h3>
      <div class="eq">float: N = (−1)<sup>S</sup> × 1.fraction × 2<sup>exp − 127</sup>   (1 + 8 + 23 bits)</div>
      <p>Exponent 255: infinity. Exponent 0: subnormal, 0.fraction × 2<sup>−126</sup>. ASCII: 8 bits per character; '0' = x30; case differs by one bit. Hex: 4 bits per digit.</p>`,
  };
  Course.start(window.CHAPTER);
})();

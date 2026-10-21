(function () {
  const { slider, readout, el } = Course;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;

  /* ---------- widgets ---------- */
  const PRE = [
    ["yotta", "Y", 24, 80, "Greek for eight: okto"], ["zetta", "Z", 21, 70, "Greek for seven: hepta"], ["exa", "E", 18, 60, "Greek for six: hexa"],
    ["peta", "P", 15, 50, "Greek for five: pente"], ["tera", "T", 12, 40, "Greek for monster: teras"], ["giga", "G", 9, 30, "Greek for giant: gigas"],
    ["mega", "M", 6, 20, "Greek for large: megas"], ["kilo", "k", 3, 10, "Greek for thousand: chilioi"],
    ["milli", "m", -3, null, "Latin for thousand: milli"], ["micro", "µ", -6, null, "Greek for small: mikros"], ["nano", "n", -9, null, "Greek for dwarf: nanos"],
    ["pico", "p", -12, null, "Spanish for a little: pico"], ["femto", "f", -15, null, "Danish and Norwegian for 15: femten"], ["atto", "a", -18, null, "Danish and Norwegian for 18: atten"],
    ["zepto", "z", -21, null, "Greek for seven: hepta"], ["yocto", "y", -24, null, "Greek for eight: okto"],
  ];
  function prefixes(host) {
    const out = el(`<div></div>`);
    const draw = (i) => {
      const [name, sym, p10, p2, from] = PRE[i];
      const rows = [["prefix", `${name} (${sym})`], ["amount", `10<sup>${p10}</sup>`], ["named from", from]];
      let note = "";
      if (p2) {
        const ratio = Math.pow(2, p2) / Math.pow(10, p10);
        rows.push(["base-2 approx.", `2<sup>${p2}</sup>`], ["2-power is bigger by", ((ratio - 1) * 100).toFixed(1) + "%"]);
        note = `<p>In computing, ${name} often means 2<sup>${p2}</sup> instead of 10<sup>${p10}</sup>. The gap grows with every step up.</p>`;
      } else note = `<p>Small prefixes have no base-2 version: they measure time, length and charge, not memory.</p>`;
      out.innerHTML = readout(rows) + note;
    };
    host.append(slider({ id: "pre", label: "prefix", min: 0, max: PRE.length - 1, step: 1, value: 7, show: (v) => PRE[Math.round(v)][0] }, (v) => draw(Math.round(v))).el, out);
    draw(7);
  }

  // Table E.2 as a clickable grid, coloured by region
  const CTRL = ["nul", "soh", "stx", "etx", "eot", "enq", "ack", "bel", "bs", "ht", "lf", "vt", "ff", "cr", "so", "si", "dle", "dc1", "dc2", "dc3", "dc4", "nak", "syn", "etb", "can", "em", "sub", "esc", "fs", "gs", "rs", "us"];
  const nameOf = (k) => (k < 32 ? CTRL[k] : k === 32 ? "sp" : k === 127 ? "del" : String.fromCharCode(k));
  const region = (k) => (k < 32 || k === 127 ? 0 : k >= 48 && k <= 57 ? 1 : k >= 65 && k <= 90 ? 2 : k >= 97 && k <= 122 ? 3 : 4);
  const RCOL = ["var(--line)", "#e8b04b", "#5aa9e6", "#7cc47c", "transparent"];
  const RNAME = ["control codes", "digits", "uppercase", "lowercase", "space and punctuation"];
  function ascii(host) {
    const out = el(`<div></div>`);
    const grid = el(`<div style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:3px;font-family:var(--mono);font-size:13px"></div>`);
    const show = (k) => {
      out.innerHTML = readout([["character", nameOf(k).replace(/&/g, "&amp;").replace(/</g, "&lt;")], ["decimal", k], ["hex", "x" + k.toString(16).toUpperCase().padStart(2, "0")], ["binary", k.toString(2).padStart(7, "0")], ["region", RNAME[region(k)]]]);
    };
    for (let r = 0; r < 16; r++) for (let col = 0; col < 8; col++) {
      const k = col * 16 + r;
      const b = el(`<button type="button" style="padding:5px 0;border-radius:5px;border:1px solid var(--line);background:${RCOL[region(k)]};color:${region(k) === 4 || region(k) === 0 ? "var(--ink)" : "#111"};font:inherit;cursor:pointer;min-width:0;overflow:hidden">${nameOf(k).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</button>`);
      b.addEventListener("click", () => show(k));
      grid.append(b);
    }
    host.append(el(`<p class="aside">Columns are x00–x0F, x10–x1F, … x70–x7F: one column per hex digit on the left. Click any cell.</p>`), grid, out,
      el(`<p class="aside">${RNAME.slice(0, 4).map((n, i) => `<span style="background:${RCOL[i]};${i ? "color:#111;" : ""}padding:0 6px;border-radius:4px">${n}</span>`).join(" ")}</p>`));
    show(65);
  }

  // 2^n and its common abbreviation
  function powers(host) {
    const out = el(`<div></div>`), U = ["", "K", "M", "G", "T", "P", "E"];
    const draw = (n) => {
      const v = (2n ** BigInt(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const ab = n >= 10 ? `${2 ** (n % 10)}${U[Math.floor(n / 10)]}` : "—";
      out.innerHTML = readout([["2<sup>" + n + "</sup>", v], ["common abbreviation", ab], ["split", n >= 10 ? `2<sup>${n % 10}</sup> × 2<sup>${n - (n % 10)}</sup> = ${2 ** (n % 10)} × ${U[Math.floor(n / 10)]}` : "under 1K"]]);
    };
    host.append(slider({ id: "pw", label: "n", min: 1, max: 64, step: 1, value: 16, show: (v) => Math.round(v) }, (v) => draw(Math.round(v))).el, out);
    draw(16);
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Numerical prefixes", mins: 10,
    blurb: "From yocto to yotta, where the names come from, and why a computer's kilo is 1024.",
    takeaway: "Table E.1: yotta Y 10^24 (≈ 2^80, Greek okto, eight), zetta Z 10^21 (≈ 2^70, hepta, seven), exa E 10^18 (≈ 2^60, hexa, six), peta P 10^15 (≈ 2^50, pente, five), tera T 10^12 (≈ 2^40, teras, monster), giga G 10^9 (≈ 2^30, gigas, giant), mega M 10^6 (≈ 2^20, megas, large), kilo k 10^3 (≈ 2^10, chilioi, thousand); milli m 10^−3 (Latin milli), micro µ 10^−6 (mikros, small), nano n 10^−9 (nanos, dwarf), pico p 10^−12 (Spanish pico, a little), femto f 10^−15 (Danish/Norwegian femten, 15), atto a 10^−18 (atten, 18), zepto z 10^−21, yocto y 10^−24. In memory sizes the prefixes usually mean the power of 2: 2^10 = 1024 ≈ 10^3. The approximation drifts: 2^30 is 7.4% more than 10^9, 2^80 about 21% more than 10^24.",
    steps: [
      { k: "learn", title: "Two meanings of kilo", b: [
        `<p>A kilometre is 1000 metres. A kilobyte of memory is usually 2<sup>10</sup> = <b>1024</b> bytes, because memory comes in powers of 2 and 1024 is close enough to 1000.</p>`,
        `<p>Table E.1 lists both meanings for every big prefix.</p>`,
      ]},
      { k: "play", title: "Walk the prefixes", b: [
        prefixes,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "By what percent is 2<sup>30</sup> bigger than 10<sup>9</sup>? (The gap between a binary and a decimal gigabyte.)", a: 7.4, tol: 0.02, unit: "%", why: "2³⁰ = 1,073,741,824, which is 7.4% more than 1,000,000,000. That's why a “1 TB” drive shows up as about 0.91 “TB” in some operating systems." },
        { t: "sort", q: "Big or small?", bins: ["Bigger than 1", "Smaller than 1"], items: [
          ["femto", 1, "10⁻¹⁵: femten is 15."],
          ["peta", 0, "10¹⁵: pente is five (the fifth power of 1000)."],
          ["pico", 1, "10⁻¹²."],
          ["exa", 0, "10¹⁸."],
        ]},
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The ASCII table", mins: 10,
    blurb: "All 128 codes in one clickable grid, with the regions you'll look up most.",
    takeaway: "Table E.2, standard ASCII: 128 codes, 7 bits, given in decimal and hex. x00–x1F are control codes (nul x00, bel x07, bs x08, ht x09 tab, lf x0A line feed, vt x0B, ff x0C, cr x0D carriage return, esc x1B, …) and del is x7F; sp (space) is x20; the digits 0–9 are x30–x39; uppercase A–Z x41–x5A; lowercase a–z x61–x7A; punctuation fills the gaps. In C, a string ends with nul (x00, '\\0'); the LC-3 keyboard routines end a line at lf (x0A).",
    steps: [
      { k: "play", title: "Table E.2", b: [
        ascii,
      ]},
      { k: "learn", title: "Codes you'll meet again", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>x00 nul</td><td>ends every C string ('\\0')</td></tr>
          <tr><td>x0A lf</td><td>line feed, the Enter key in the LC-3's keyboard input; C's '\\n'</td></tr>
          <tr><td>x0D cr</td><td>carriage return, '\\r'</td></tr>
          <tr><td>x20 sp</td><td>the space character</td></tr></tbody></table></div>`,
        seenPP("ASCII and bit vectors as data types.", "02-bits-data-types.html", "Chapter 2"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Appendix B's LC-3 program stops reading input when <code>ADD R2, R0, x-A</code> gives zero. Which character did the user type?", opts: [["lf, x0A: the end of the line", true, "R0 − x0A is zero exactly when R0 = x0A."], ["nul", false, "That's x00."], ["The letter A", false, "x-A is the number −10, not the letter."]] },
        { t: "mcq", q: "How many bits does the table need for every code?", opts: [["7", true, "128 = 2⁷ codes, x00 to x7F. They're usually stored in an 8-bit byte."], ["8", false, "Standard ASCII stops at x7F."], ["16", false, "The LC-3 stores a character in a 16-bit word, but the code itself needs 7 bits."]] },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Powers of 2", mins: 5,
    blurb: "Read any power of 2 at a glance by splitting off the tens: 2^16 = 2^6 × 2^10 = 64K.",
    takeaway: "Table E.3: 2^1 = 2 … 2^10 = 1,024 (1K), 2^11 = 2,048 (2K), 2^12 = 4,096 (4K), 2^13 = 8,192 (8K), 2^14 = 16,384 (16K), 2^15 = 32,768 (32K), 2^16 = 65,536 (64K), 2^17 = 131,072 (128K), 2^18 = 262,144 (256K), 2^19 = 524,288 (512K; the book misprints it as 544,288), 2^20 = 1,048,576 (1M), 2^30 = 1,073,741,824 (1G), 2^32 = 4,294,967,296 (4G). Trick: 2^(10a + b) = 2^b × (K, M, G, T… for a = 1, 2, 3, 4…).",
    steps: [
      { k: "play", title: "Any power, at a glance", b: [
        powers,
        `<p>The trick: split the exponent into tens and the rest. 2<sup>16</sup> = 2<sup>6</sup> × 2<sup>10</sup> = 64 × 1K = <b>64K</b>, the size of the LC-3's memory.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "How many different addresses does a 32-bit address give, in the common abbreviation?", opts: [["4G", true, "2³² = 2² × 2³⁰ = 4 × 1G."], ["32G", false, "That would be 2³⁵."], ["4M", false, "That's 2²²."]] },
      ]},
      { k: "bug", title: "Spot the misprint", b: [
        `<p>Table E.3 prints these rows:</p>`,
        `<div class="tbl"><table style="font-family:var(--mono)"><tbody><tr><td>2<sup>18</sup></td><td>262,144</td><td>256K</td></tr><tr><td>2<sup>19</sup></td><td>544,288</td><td>512K</td></tr><tr><td>2<sup>20</sup></td><td>1,048,576</td><td>1M</td></tr></tbody></table></div>`,
        { t: "num", q: "Check it without a calculator: double the 2<sup>18</sup> row. What should 2<sup>19</sup> be?", a: 524288, tol: 0, why: "262,144 × 2 = 524,288, and 524,288 × 2 = 1,048,576 matches the next row. The book's 544,288 is a typo. Each row must be exactly twice the one before; that's a check you can always run." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ppE", eyebrow: "Patt & Patel · Appendix E", title: "Useful Tables",
    intro: `<p>Three short parts on the book's three reference tables: numerical prefixes, the ASCII codes, and powers of 2.</p><p>These are look-up tables. The goal is to know what's in them and to read them fast. Arrow keys ← → move between steps.</p>`,
    after: `<p>There are no exercises here. Keep these tables open whenever an exercise involves memory sizes, character codes or bit counts.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <h3>Prefixes</h3>
      <p>k 10³ ≈ 2¹⁰, M 10⁶ ≈ 2²⁰, G 10⁹ ≈ 2³⁰, T, P, E, Z, Y; m, µ, n, p, f, a, z, y going down. Memory sizes use the powers of 2.</p>
      <h3>ASCII</h3>
      <p>7 bits. Control x00–x1F (nul x00, lf x0A, cr x0D), sp x20, digits x30–x39, A–Z x41–x5A, a–z x61–x7A, del x7F.</p>
      <h3>Powers of 2</h3>
      <p>2^(10a+b) = 2^b × K/M/G/T. 2¹⁶ = 64K, 2²⁰ = 1M, 2³² = 4G. Each row doubles the last (2¹⁹ = 524,288).</p>`,
  };
  Course.start(window.CHAPTER);
})();

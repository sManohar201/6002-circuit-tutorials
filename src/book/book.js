/* 6.002's table of contents. One entry per chapter of Agarwal & Lang.
   `file` is set once a chapter's tutorial is built; `parts` must match that chapter's part count.
   `pdf` is the page range in the per-chapter PDF file names; `probs` is the page of that file where the exercises start. */
(window.BOOKS = window.BOOKS || {})["6002"] = {
  key: "6002", short: "6.002", home: "6002.html", dir: "chapters",
  title: "6.002 Circuit Tutorials",
  pdfFolder: "book by chapters",
  source: "Agarwal & Lang, Foundations of Analog and Digital Electronic Circuits (2005)",
  pdfPrefix: "Agarwal - Foundations of Analog and Digital Electronic Circuits Elsevier 2005b-",
  answers: { pdf: "984-995", label: "Answers to selected problems" },
  groups: [
    {
      name: "Resistive circuits",
      note: "Wires, resistors, sources, and the methods for solving any resistive network.",
      items: [
        { n: 1, id: "ch1", title: "The Circuit Abstraction", pdf: "26-75", probs: 48, file: "01-circuit-abstraction.html", parts: 7,
          blurb: "Lumping, voltage and current, power, resistors, ideal elements, signals." },
        { n: 2, id: "ch2", title: "Resistive Networks", pdf: "76-141", probs: 59, file: "02-resistive-networks.html", parts: 9,
          blurb: "KCL, KVL, dividers, collapsing networks, dependent sources." },
        { n: 3, id: "ch3", title: "Network Theorems", pdf: "142-215", probs: 62, file: "03-network-theorems.html", parts: 9,
          blurb: "Node method, superposition, Thévenin and Norton." },
        { n: 4, id: "ch4", title: "Analysis of Nonlinear Circuits", pdf: "216-266", probs: 40, file: "04-nonlinear-circuits.html", parts: 8,
          blurb: "Graphical, piecewise-linear and incremental analysis." }
      ]
    },
    {
      name: "Digital logic and the MOSFET",
      note: "From noise margins to switches, gates and amplifiers.",
      items: [
        { n: 5, id: "ch5", title: "The Digital Abstraction", pdf: "267-307", probs: 33, file: "05-digital-abstraction.html", parts: 7,
          blurb: "Value discretization, noise margins, logic gates." },
        { n: 6, id: "ch6", title: "The MOSFET Switch", pdf: "308-354", probs: 40, file: "06-mosfet-switch.html", parts: 8,
          blurb: "S and SR models, gates built from switches, power in gates." },
        { n: 7, id: "ch7", title: "The MOSFET Amplifier", pdf: "355-427", probs: 61, file: "07-mosfet-amplifier.html", parts: 9,
          blurb: "Gain, the switch-current-source model, choosing an operating point." },
        { n: 8, id: "ch8", title: "The Small-Signal Model", pdf: "428-479", probs: 45, file: "08-small-signal-model.html", parts: 7,
          blurb: "Linearizing the amplifier around an operating point." }
      ]
    },
    {
      name: "Energy storage and time",
      note: "Capacitors and inductors make circuits remember, so voltages change over time.",
      items: [
        { n: 9, id: "ch9", title: "Energy Storage Elements", pdf: "480-525", probs: 40, file: "09-energy-storage.html", parts: 7,
          blurb: "Capacitors, inductors, and conservation of charge and flux." },
        { n: 10, id: "ch10", title: "First-Order Transients in Linear Electrical Networks", pdf: "526-617", probs: 69, file: "10-first-order-transients.html", parts: 9,
          blurb: "RC and RL circuits, propagation delay, state, digital memory." },
        { n: 11, id: "ch11", title: "Energy and Power in Digital Circuits", pdf: "618-647", probs: 26, file: "11-energy-power-digital.html", parts: 6,
          blurb: "Average power, NMOS and CMOS logic." },
        { n: 12, id: "ch12", title: "Transients in Second-Order Circuits", pdf: "648-725", probs: 71, file: "12-second-order-transients.html", parts: 8,
          blurb: "LC and RLC circuits, damping, state-space analysis." }
      ]
    },
    {
      name: "Frequency, op amps and diodes",
      note: "Sinusoidal steady state, resonance, and two key devices.",
      items: [
        { n: 13, id: "ch13", title: "Sinusoidal Steady State: Impedance and Frequency Response", pdf: "726-799", probs: 67, file: "13-sinusoidal-steady-state.html", parts: 9,
          blurb: "Impedance, frequency response, filters." },
        { n: 14, id: "ch14", title: "Sinusoidal Steady State: Resonance", pdf: "800-859", probs: 49, file: "14-resonance.html", parts: 7,
          blurb: "RLC frequency response, Q, Bode plots, stored energy." },
        { n: 15, id: "ch15", title: "The Operational Amplifier Abstraction", pdf: "860-927", probs: 39, file: "15-op-amp.html", parts: 9,
          blurb: "Ideal op amps, feedback, saturation, op amp RC circuits." },
        { n: 16, id: "ch16", title: "Diodes", pdf: "928-949", probs: 18, file: "16-diodes.html", parts: 6,
          blurb: "Diode characteristics and nonlinear analysis with RL and RC." }
      ]
    },
    {
      name: "Appendices",
      note: "Math and physics background, each as a short interactive page. Use them whenever a chapter leans on the math.",
      items: [
        { n: "A", id: "appA", title: "Maxwell's Equations and the Lumped Matter Discipline", pdf: "950-965", file: "appA-lumped-matter.html", parts: 4,
          blurb: "Why voltage and current make sense, and where KVL, KCL and R = ρl/a come from. Background for Chapter 1." },
        { n: "B", id: "appB", title: "Trigonometric Functions and Identities", pdf: "966-969", file: "appB-trig.html", parts: 3,
          blurb: "The unit circle, the identities circuits use, Taylor series and Euler. A refresher for Chapters 12–14." },
        { n: "C", id: "appC", title: "Complex Numbers", pdf: "970-983", file: "appC-complex-numbers.html", parts: 5,
          blurb: "Polar form, arithmetic, the conjugate and rotation. The toolkit for Chapters 12–15." },
        { n: "D", id: "appD", title: "Solving Simultaneous Linear Equations", pdf: "970-983", file: "appD-linear-equations.html", parts: 2,
          blurb: "The 2 × 2 formula and Cramer\'s rule, for node and mesh equations (Chapter 3). In the PDF after Appendix C." }
      ]
    }
  ]
};

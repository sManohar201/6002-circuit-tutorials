/* Boylestad & Nashelsky's table of contents.
   `pdf` is the range in the per-chapter PDF file names, `pages` the printed book pages,
   `probs` the page of that PDF file where PROBLEMS start, `probsBook` the printed page number.
   `file` and `parts` are set once a chapter's tutorial is built. */
(window.BOOKS = window.BOOKS || {})["edc"] = {
  key: "edc", short: "Boylestad", home: "edc.html", dir: "edc",
  title: "Electronic Devices Tutorials",
  pdfFolder: "electroinc_devices_circuit_theory / ilovepdf_split-range",
  source: "Boylestad & Nashelsky, Electronic Devices and Circuit Theory, 11th edition",
  pdfPrefix: "Electronic Devices and Circuit Theory - 11th Edition-",
  answers: { pdf: "914-921", label: "Appendix D: Solutions to selected odd-numbered problems" },
  intro: `<p>This book assumes you already know circuit laws. 6.002 gave you those. Where a chapter overlaps 6.002, its tutorial starts with a short recap that links back, then spends the time on what's new.</p>
    <p><b>Two notation traps:</b> here <b>V<sub>T</sub></b> in the diode chapters is the <i>thermal</i> voltage (≈ 26 mV), which 6.002 calls V<sub>TH</sub>. And the MOSFET law I<sub>D</sub> = <b>k</b>(V<sub>GS</sub> − V<sub>T</sub>)² uses k = K/2 from 6.002.</p>`,
  groups: [
    {
      name: "Diodes",
      note: "How semiconductors work, the diode, and the circuits built from it.",
      items: [
        { n: 1, id: "edc1", title: "Semiconductor Diodes", pdf: "22-75", pages: "1-54", probs: 51, probsBook: 51, file: "01-semiconductor-diodes.html", parts: 11,
          blurb: "Semiconductor materials, the pn junction, diode models, Zener diodes and LEDs." },
        { n: 2, id: "edc2", title: "Diode Applications", pdf: "76-149", pages: "55-128", probs: 65, probsBook: 119, file: "02-diode-applications.html", parts: 13,
          blurb: "Load lines, diode networks, rectifiers, clippers, clampers, Zener regulators, multipliers." },
      ]
    },
    {
      name: "Bipolar junction transistors",
      note: "The BJT: how it works, how to bias it, and how it amplifies.",
      items: [
        { n: 3, id: "edc3", title: "Bipolar Junction Transistors", pdf: "150-180", pages: "129-159", probs: 29, probsBook: 157, file: "03-bjts.html", parts: 10,
          blurb: "Construction, operation, the three configurations, limits of operation." },
        { n: 4, id: "edc4", title: "DC Biasing: BJTs", pdf: "181-273", pages: "160-252", probs: 79, probsBook: 238, file: "04-dc-biasing-bjts.html", parts: 15,
          blurb: "Operating point, the classic bias circuits, current mirrors, switching, stability." },
        { n: 5, id: "edc5", title: "BJT AC Analysis", pdf: "274-398", pages: "253-377", probs: 109, probsBook: 361, file: "05-bjt-ac-analysis.html", parts: 16,
          blurb: "The r_e model, gain and impedances for each configuration, cascades, hybrid models." },
      ]
    },
    {
      name: "Field-effect transistors",
      note: "JFETs and MOSFETs: characteristics, biasing and amplifiers.",
      items: [
        { n: 6, id: "edc6", title: "Field-Effect Transistors", pdf: "399-442", pages: "378-421", probs: 41, probsBook: 418, file: "06-fets.html", parts: 10,
          blurb: "JFET construction and transfer curve, depletion and enhancement MOSFETs, CMOS." },
        { n: 7, id: "edc7", title: "FET Biasing", pdf: "443-501", pages: "422-480", probs: 52, probsBook: 473, file: "07-fet-biasing.html", parts: 12,
          blurb: "Fixed, self and voltage-divider bias, graphically and by formula." },
        { n: 8, id: "edc8", title: "FET Amplifiers", pdf: "502-565", pages: "481-544", probs: 56, probsBook: 536, file: "08-fet-amplifiers.html", parts: 12,
          blurb: "The FET small-signal model and the common-source, -gate and -drain amplifiers." },
      ]
    },
    {
      name: "Frequency response",
      note: "What happens to gain at low and high frequencies.",
      items: [
        { n: 9, id: "edc9", title: "BJT and JFET Frequency Response", pdf: "566-627", pages: "545-606", probs: 57, probsBook: 601, file: "09-frequency-response.html", parts: 11,
          blurb: "Decibels, Bode plots, low- and high-frequency cutoffs, the Miller effect." },
      ]
    },
    {
      name: "Op amps",
      note: "Inside the op amp, its real-world limits, and the circuits built from it.",
      items: [
        { n: 10, id: "edc10", title: "Operational Amplifiers", pdf: "628-673", pages: "607-652", probs: 42, probsBook: 648, file: "10-op-amps.html", parts: 11,
          blurb: "The differential amplifier, op-amp basics, offsets, slew rate, CMRR." },
        { n: 11, id: "edc11", title: "Op-Amp Applications", pdf: "674-703", pages: "653-682", probs: 26, probsBook: 678, file: "11-op-amp-applications.html", parts: 6,
          blurb: "Gain blocks, summers, buffers, controlled sources, instrumentation amps, active filters." },
      ]
    },
    {
      name: "Power, ICs and oscillators",
      note: "Driving real loads, mixed analog-digital chips, feedback, and power supplies.",
      items: [
        { n: 12, id: "edc12", title: "Power Amplifiers", pdf: "704-742", pages: "683-721", probs: 37, probsBook: 719, file: "12-power-amplifiers.html", parts: 9,
          blurb: "Class A, B, C and D, efficiency, distortion, heat sinking." },
        { n: 13, id: "edc13", title: "Linear-Digital ICs", pdf: "743-771", pages: "722-750", probs: 27, probsBook: 748, file: "13-linear-digital-ics.html", parts: 8,
          blurb: "Comparators, DACs and ADCs, the 555 timer, VCOs and phase-locked loops." },
        { n: 14, id: "edc14", title: "Feedback and Oscillator Circuits", pdf: "772-803", pages: "751-782", probs: 32, probsBook: 782, file: "14-feedback-oscillators.html", parts: 10,
          blurb: "Feedback types, phase-shift, Wien bridge, tuned and crystal oscillators." },
        { n: 15, id: "edc15", title: "Power Supplies (Voltage Regulators)", pdf: "804-831", pages: "783-810", probs: 26, probsBook: 808, file: "15-power-supplies.html", parts: 8,
          blurb: "Capacitor and RC filters, ripple, transistor and IC regulators." },
      ]
    },
    {
      name: "More devices",
      note: "Special-purpose diodes, sensors and switching devices.",
      items: [
        { n: 16, id: "edc16", title: "Other Two-Terminal Devices", pdf: "832-861", pages: "811-840", probs: 28, probsBook: 838, file: "16-two-terminal-devices.html", parts: 8,
          blurb: "Schottky, varactor, solar cells, photodiodes, thermistors, tunnel diodes." },
        { n: 17, id: "edc17", title: "pnpn and Other Devices", pdf: "862-899", pages: "841-878", probs: 35, probsBook: 875, file: "17-pnpn-devices.html", parts: 9,
          blurb: "SCRs, triacs and other switching devices." },
      ]
    },
    {
      name: "Appendices",
      note: "Reference material. The tutorials pull from these where a chapter needs them.",
      items: [
        { n: "A", id: "edcA", title: "Hybrid Parameters: Graphical Determinations and Conversions", pdf: "900-905", pages: "879-884", file: "appA-hybrid-parameters.html", parts: 3,
          blurb: "Reading h-parameters off transistor curves. Used with Chapter 5." },
        { n: "B", id: "edcB", title: "Ripple Factor and Voltage Calculations", pdf: "906-911", pages: "885-890", file: "appB-ripple.html", parts: 3,
          blurb: "The math behind power-supply ripple. Used with Chapter 15." },
        { n: "C", id: "edcC", title: "Charts and Tables", pdf: "912-913", pages: "891-892", file: "appC-tables.html", parts: 2,
          blurb: "Greek letters and standard resistor values." },
      ]
    }
  ]
};

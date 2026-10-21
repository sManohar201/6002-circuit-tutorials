/* Math Toolkit: the math both books lean on, one module per tool.
   No PDF: modules are original. `needs` lists the chapter ids (6.002 "chN"/"appX", Boylestad "edcN") that use the tool,
   so a module can say where it's used and each chapter page can list the math it needs.
   Items with `ref` are already taught by a 6.002 appendix: `file` points at that page and `id` is its id, so progress is shared. */
(window.BOOKS = window.BOOKS || {})["math"] = {
  key: "math", short: "Math Toolkit", home: "math.html", dir: "math", unit: "Module", noPdf: true,
  title: "Math Toolkit",
  source: "The math behind both books and chip design, one tool at a time",
  sub: "Every math tool the two books use, then the math a chip designer needs, all taught with circuits. Do a module just before the chapter that needs it, or work through the chip-design track in order.",
  intro: `<p>Each module says which chapters use it, and each chapter page lists the modules it needs (look for “Math you'll use”).</p>
    <p>Nothing here assumes you remember school algebra. Each module starts from the basics and goes only as far as the circuits need.</p>
    <p>Modules 24–39 are the <b>chip-design track</b>: linear algebra, calculus for design, signals, probability and noise, feedback, and fields. Each ends with a “Master it” part of harder mixed problems, because these topics have no book problems to fall back on.</p>`,
  flow: [
    ["Pick a module", "Either the next one in order or one a chapter page points you to. Each part takes 10–20 minutes."],
    ["Practise", "Every part ends with questions using circuit numbers. Work them on paper first, then type the answer."],
    ["Use it", "Go back to the chapter. The module's “Used in” line links straight there."],
  ],
  groups: [
    {
      name: "Numbers and algebra",
      note: "The everyday tools: every chapter uses these.",
      items: [
        { n: 1, id: "m1", title: "Numbers, Prefixes and Units", file: "01-numbers-units.html", parts: 3,
          needs: ["ch1", "ch2", "edc1", "edc3"],
          blurb: "Powers of ten, k/m/µ/n/p, units that check your answer, and quick estimates." },
        { n: 2, id: "m2", title: "Rearranging Formulas", file: "02-rearranging.html", parts: 4,
          needs: ["ch1", "ch2", "ch3", "edc3", "edc4"],
          blurb: "Get any letter on its own, the balance-scale way. Squares, roots, reciprocals and exponent rules." },
        { n: 3, id: "m3", title: "Fractions, Ratios and Percent", file: "03-ratios-percent.html", parts: 3,
          needs: ["ch2", "ch3", "edc2", "edc4", "edc5", "edc12", "edc15"],
          blurb: "Parallel resistors, divider ratios, percent error, regulation and efficiency." },
        { n: 4, id: "m4", title: "Approximations", file: "04-approximations.html", parts: 3,
          needs: ["ch8", "ch15", "edc4", "edc5", "edc8", "edc10", "edc14"],
          blurb: "When ≫ lets you drop a term, the 10× rule, and how much error that costs." },
      ]
    },
    {
      name: "Graphs and equations",
      note: "Reading and solving: load lines, node equations, square laws.",
      items: [
        { n: 5, id: "m5", title: "Lines, Graphs and Load Lines", file: "05-lines.html", parts: 3,
          needs: ["ch3", "ch4", "ch7", "ch16", "edc2", "edc4", "edc7"],
          blurb: "Slope and intercept, drawing a line from two points, where two curves cross." },
        { n: 6, id: "appD", ref: "6002", title: "Simultaneous Equations", file: "../chapters/appD-linear-equations.html", parts: 2,
          needs: ["ch2", "ch3", "edc4", "edcA"],
          blurb: "Already in 6.002 Appendix D: two or three unknowns, elimination and Cramer's rule." },
        { n: 7, id: "m7", title: "Quadratic Equations", file: "07-quadratics.html", parts: 3,
          needs: ["ch7", "ch12", "edc6", "edc7"],
          blurb: "Expand a square, use the formula, and pick the root that makes physical sense." },
      ]
    },
    {
      name: "Exponentials and logarithms",
      note: "Diodes, time constants, decibels: anything that grows or decays.",
      items: [
        { n: 8, id: "m8", title: "Exponentials and Logarithms", file: "08-exp-log.html", parts: 3,
          needs: ["ch4", "ch10", "ch16", "edc1", "edc13", "edc16", "edc17"],
          blurb: "e^x and its shape, ln undoes it, the log rules, and solving for a time or a voltage." },
        { n: 9, id: "m9", title: "Decibels and Log Scales", file: "09-decibels.html", parts: 3,
          needs: ["ch13", "ch14", "edc9", "edc10", "edc11"],
          blurb: "dB for power and voltage, why gains add in dB, decades, octaves and log axes." },
      ]
    },
    {
      name: "Waves and complex numbers",
      note: "Everything ac: sine waves, phase, and the numbers that handle them.",
      items: [
        { n: 10, id: "m10", title: "Sinusoids", file: "10-sinusoids.html", parts: 3,
          needs: ["ch12", "ch13", "edc2", "edc9", "edc12", "edc15"],
          blurb: "Radians, amplitude, frequency, ω = 2πf, phase shift, and right triangles." },
        { n: 11, id: "appB", ref: "6002", title: "Trig Identities and Taylor Series", file: "../chapters/appB-trig.html", parts: 3,
          needs: ["ch12", "ch13"],
          blurb: "Already in 6.002 Appendix B: sin and cos from a circle, the identities, Euler's formula." },
        { n: 12, id: "appC", ref: "6002", title: "Complex Numbers", file: "../chapters/appC-complex-numbers.html", parts: 5,
          needs: ["ch12", "ch13", "ch14", "edc9", "edc14"],
          blurb: "Already in 6.002 Appendix C: points in a plane, polar form, multiply and divide, rotation." },
      ]
    },
    {
      name: "Calculus",
      note: "Rates of change and areas: capacitors, inductors, small signals, transients.",
      items: [
        { n: 13, id: "m13", title: "Derivatives", file: "13-derivatives.html", parts: 5,
          needs: ["ch4", "ch8", "ch9", "edc1", "edc4", "edc5", "edc8", "edc10"],
          blurb: "Slope at a point, the rules (product, quotient, chain), tangent lines, and partial derivatives." },
        { n: 14, id: "m14", title: "Integrals and Averages", file: "14-integrals.html", parts: 5,
          needs: ["ch9", "ch11", "ch16", "edc2", "edc12", "edc15", "edcB"],
          blurb: "Areas, averages and rms, then antiderivatives, substitution, integration by parts and ∫ to ∞." },
        { n: 15, id: "m15", title: "Differential Equations", file: "15-diff-eqs.html", parts: 5,
          needs: ["ch10", "ch11", "ch12"],
          blurb: "First-order recipe, second order and damping, forced (sinusoidal) response, fitting initial conditions." },
      ]
    },
    {
      name: "Frequency response and logic",
      note: "Two specialised tools: Bode plots and Boolean algebra.",
      items: [
        { n: 16, id: "m16", title: "Transfer Functions and Bode Plots", file: "16-bode.html", parts: 3,
          needs: ["ch13", "ch14", "edc9", "edc11", "edc14"],
          blurb: "H(jω) as a ratio, break frequencies, straight-line asymptotes and phase." },
        { n: 17, id: "m17", title: "Binary and Boolean Algebra", file: "17-binary-boolean.html", parts: 3,
          needs: ["ch5", "ch6", "edc13"],
          blurb: "Counting in binary, 2^n levels, AND/OR/NOT algebra and De Morgan." },
      ]
    },
    {
      name: "Laplace transforms (optional track)",
      note: "Neither book teaches these; both only mention them in passing. They turn differential equations into algebra and tie transients, impedance and Bode plots into one method. Do Modules 13–15 first.",
      items: [
        { n: 18, id: "m18", title: "Polynomials and Partial Fractions", file: "18-partial-fractions.html", parts: 4,
          also: ["ch12", "ch13"],
          blurb: "Roots and factors, completing the square, and splitting a fraction into simple pieces." },
        { n: 19, id: "m19", title: "Laplace: the Idea and the Table", file: "19-laplace-intro.html", parts: 4,
          also: ["ch10", "ch12", "ch13"],
          blurb: "Why transform, the defining integral, building the table, and what pole positions mean." },
        { n: 20, id: "m20", title: "Laplace Properties", file: "20-laplace-properties.html", parts: 4,
          also: ["ch10", "ch12"],
          blurb: "Derivatives become ×s, shifts and delays, ×t, and the initial and final value theorems." },
        { n: 21, id: "m21", title: "Inverse Laplace Transforms", file: "21-inverse-laplace.html", parts: 4,
          also: ["ch10", "ch12"],
          blurb: "Back to time: real poles, repeated poles, complex poles, and checking your answer." },
        { n: 22, id: "m22", title: "Solving Differential Equations with Laplace", file: "22-laplace-odes.html", parts: 4,
          also: ["ch10", "ch12", "ch13"],
          blurb: "Initial conditions built in: first order, second order, ringing, and a sinusoidal input." },
        { n: 23, id: "m23", title: "Circuits in the s-Domain", file: "23-s-domain.html", parts: 4,
          also: ["ch10", "ch12", "ch13", "ch14", "edc9", "edc10", "edc11", "edc14"],
          blurb: "Impedances in s, transfer functions, poles and zeros, impulse response and stability." },
      ]
    },
    {
      name: "Chip design 1: linear algebra",
      note: "Beyond both books: the start of the chip-design track. Every simulator turns a schematic into a matrix, and eigenvalues are a circuit's natural frequencies. Do Module 6 first.",
      items: [
        { n: 24, id: "m24", title: "Vectors and Matrices", file: "24-matrices.html", parts: 6,
          also: ["ch2", "ch3", "appD"],
          blurb: "Vectors and the dot product, a matrix as a machine, products, determinants and the inverse, with pictures first." },
        { n: 25, id: "m25", title: "Solving Circuits with Matrices", file: "25-circuit-matrices.html", parts: 6,
          also: ["ch3", "ch8", "edc5"],
          blurb: "Build G by inspection, Gaussian elimination, LU and sparsity, Modified Nodal Analysis, transistors as matrix stamps: what SPICE does." },
        { n: 26, id: "m26", title: "Eigenvalues and Eigenvectors", file: "26-eigenvalues.html", parts: 6,
          also: ["ch10", "ch12", "ch13"],
          blurb: "Directions a matrix doesn't turn, det(A − λI) = 0, complex eigenvalues as rotation, x′ = Ax, modes and on-chip wire delay." },
      ]
    },
    {
      name: "Chip design 2: calculus for real design",
      note: "Real chips vary, real circuits are nonlinear, and simulators approximate. These modules make that precise. Do Modules 13–15 first.",
      items: [
        { n: 27, id: "m27", title: "Sensitivity and Error Budgets", file: "27-sensitivity.html", parts: 6,
          also: ["ch8", "edc4", "edc7", "edc10"],
          blurb: "Partial derivatives as knobs, percent-per-percent sensitivity, small-signal models as total differentials, worst case vs RSS, optimal sizing." },
        { n: 28, id: "m28", title: "Numerical Methods: How Simulators Think", file: "28-numerical-methods.html", parts: 6,
          also: ["ch4", "ch10", "ch16"],
          blurb: "Bisection, Newton's method, companion models and convergence, Euler and trapezoidal time-stepping, error and step control." },
        { n: 29, id: "m29", title: "Series and Approximations", file: "29-series.html", parts: 6,
          also: ["ch8", "appB", "edc5", "edc10"],
          blurb: "Taylor series, how small ‘small signal’ is, harmonic distortion from device curves, geometric series in DACs and feedback, limits." },
      ]
    },
    {
      name: "Chip design 3: signals and spectra",
      note: "How signals look in frequency, and what happens when a chip samples them. Do Modules 10, 12 and 16 first.",
      items: [
        { n: 30, id: "m30", title: "Fourier Series", file: "30-fourier-series.html", parts: 6,
          also: ["ch13", "edc12", "edc15"],
          blurb: "Any periodic wave as a sum of sines: harmonics, finding coefficients, symmetry, power per harmonic and THD." },
        { n: 31, id: "m31", title: "The Fourier Transform and Spectra", file: "31-fourier-transform.html", parts: 6,
          also: ["ch13", "ch14", "edc9"],
          blurb: "From series to transform, pulse and sinc, time–bandwidth trade-off, convolution and filtering, the link to Laplace." },
        { n: 32, id: "m32", title: "Sampling, Aliasing and Quantization", file: "32-sampling.html", parts: 6,
          also: ["edc13"],
          blurb: "Sampling and Nyquist, aliasing, sample-and-hold, quantization noise, SNR = 6.02N + 1.76 dB, and the DFT." },
        { n: 33, id: "m33", title: "Discrete-Time Systems and the z-Transform", file: "33-z-transform.html", parts: 6,
          also: ["edc13"],
          blurb: "Difference equations, z⁻¹ as a delay, poles inside the unit circle, FIR and IIR filters, and switched-capacitor circuits." },
      ]
    },
    {
      name: "Chip design 4: probability, statistics and noise",
      note: "Every chip is a random sample from a process, and every signal carries noise. These modules make randomness something you can design with.",
      items: [
        { n: 34, id: "m34", title: "Probability and Random Variables", file: "34-probability.html", parts: 6,
          also: [],
          blurb: "Probability rules, distributions, mean and variance, and why independent variances add." },
        { n: 35, id: "m35", title: "The Normal Distribution, Mismatch and Yield", file: "35-normal-yield.html", parts: 6,
          also: ["edc10"],
          blurb: "The bell curve and why it appears, σ and yield, Pelgrom's mismatch law, Monte Carlo, process corners." },
        { n: 36, id: "m36", title: "Random Signals and Noise", file: "36-noise.html", parts: 6,
          also: ["edc9", "edc10"],
          blurb: "Noise spectral density, thermal, shot and 1/f noise, kT/C, noise bandwidth, input-referred noise and SNR." },
      ]
    },
    {
      name: "Chip design 5: feedback and stability",
      note: "The math behind every op amp, regulator and PLL on a chip. Do Modules 16 and 23 first.",
      items: [
        { n: 37, id: "m37", title: "Feedback Systems", file: "37-feedback.html", parts: 6,
          also: ["ch15", "edc10", "edc14"],
          blurb: "Loop gain, desensitisation, bandwidth and distortion with feedback, impedances, and the four feedback types." },
        { n: 38, id: "m38", title: "Stability and Compensation", file: "38-stability.html", parts: 6,
          also: ["edc10", "edc14"],
          blurb: "When 1 + T = 0, phase and gain margin, overshoot and peaking, root locus, dominant-pole and Miller compensation." },
      ]
    },
    {
      name: "Chip design 6: fields for device physics",
      note: "What happens inside a transistor: fields, charge and diffusion. The math for semiconductor physics.",
      items: [
        { n: 39, id: "m39", title: "Fields, Flux and Diffusion", file: "39-fields.html", parts: 6,
          also: ["edc1", "ch16", "appA"],
          blurb: "Field as slope of potential, Gauss's law, Poisson's equation and the depletion region, current density, diffusion." },
      ]
    },
  ],
};

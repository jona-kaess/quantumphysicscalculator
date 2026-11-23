# Quantum Physics Calculator

A static, client-side physics calculator. It runs in the browser and can be hosted
on GitHub Pages; Flask, Python and a backend API are not needed at runtime.

## Pages

- `index.html` — dimensional physics calculator with constants and unit conversion.
- `converter.html` — quantum-unit converter (energy, wavelength, temperature,
  frequency and magnetic field equivalents).
- `hamiltonians.html` — interactive qubit Hamiltonians and energy plots.

Open `index.html` in a browser or serve this directory with any static HTTP server,
for example `python3 -m http.server 5000`. MathJax is loaded from a CDN for
formatted equations; calculations and plots run locally, including offline.

For GitHub Pages, select **Deploy from a branch**, then choose **main** and **/(root)**.
All navigation and asset paths are relative and work under a repository subpath.
Changes become public after they are pushed and the Pages deployment completes.
After modifying a CSS or JavaScript asset, run `python3 scripts/version_assets.py`
before committing. It updates the content hashes in the page URLs so browsers
request the matching asset versions. The static-site test checks these hashes.

## Calculator input

Use uppercase `E` for scientific notation (`1E6`); lowercase `e` is the elementary
charge. Use Ctrl+K to insert a constant and Ctrl+E to browse units. Suggestions
appear while typing; use the arrow keys and Enter or Tab to insert them.
Examples: `hbar * 10 GHz`, `2 kg * 9.81 m / s^2`, `20 degC - 10 degC`.

Frequency (`Hz`, `rad_s`) and energy equivalents (`Hz_energy`, `rad_s_energy`,
`K_energy`, `T_energy`, `nm_energy`) are distinguished. Celsius and Fahrenheit
are absolute temperatures; `deltaC` and `deltaF` denote differences. Plain K
can represent either. A positive wavelength is required for `nm_energy`.

A unit directly after a denominator number belongs to it: `5V / 10A` means
`5V / (10 A)`, while `5V / 10 A` means `(5V / 10) * A`. Use parentheses to
make grouping explicit. US and UK liquid measures have distinct names, such as
`gal_US` and `gal_UK`. Unit pickers show base symbols; the result chooses a
readable SI prefix automatically.

`ANS` uses the previous valid result, including its dimensions and temperature
type. The answer is kept while editing an expression containing `ANS`, and is
updated when starting another expression. Save calculations to restore their
expression, angle setting, selected result unit and any referenced `ANS` later;
they are stored locally in this browser. The Copy LaTeX button copies the
formatted input expression. On small screens, type names to use autocomplete.

The calculator can be installed as a PWA through a compatible browser on HTTPS
(or localhost). After the first online visit its application files are cached
for offline use. MathJax is loaded from a CDN, so formatted mathematics may
require an internet connection or a previously cached MathJax copy.

## Constants and maintenance

The included catalog is generated from all 442 entries of SciPy 1.14.1
`scipy.constants.physical_constants` (CODATA 2018). It is a local JavaScript file;
SciPy is only needed when regenerating it, not to use or deploy the site. To
regenerate it, install SciPy 1.14.1 separately and run
`python scripts/generate_scipy_constants.py`. Review the CODATA source label if
changing SciPy versions.

## Tests

Run with Node.js:

```sh
node tests/js/physics-engine.test.js
node tests/js/static-site.test.js
```

## Scientific functions and angles

Use the angle switch above the expression to choose radians or degrees for
`sin`, `cos`, `tan`, `asin`, `acos`, `atan`, and `arg`. Explicit `deg` or `rad`
units are honored independently of the switch; hyperbolic functions are
unitless and unaffected by it.

Functions can be typed or inserted with **Ctrl+Y**: `sqrt`, `sin`, `cos`,
`tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `ln`, `log` (base 10),
`exp`, `abs`, `re`/`Re`, `im`/`Im`, `conj`, `arg`/`Arg`, `floor`, `ceil`,
`factorial`, `mod`, `pow`, `recip`, `percent`, and `tenpow`. `mod(a,b)`
uses the signed remainder, and `pow(a,b)` computes a power. Postfix `!` and
`%` are also supported. Factorials require integers from 0 to 170. Use `i` for
the imaginary unit and `euler` for Euler's number; `e` remains the elementary
charge. Complex arithmetic, roots, logarithms, and trigonometric/hyperbolic
functions are supported; inverse trigonometric functions currently accept real
arguments only. `sqrt` preserves dimensional powers, while trigonometric and
logarithmic functions require dimensionless arguments.

# Quantum Physics Calculator

A static, client-side physics calculator. It runs in the browser and can be hosted
on GitHub Pages; Flask, Python and a backend API are not needed at runtime.
See [the calculator guide](guide.html) for usage examples.

The calculator is available at `index.html`. The former unit converter and
qubit Hamiltonians are preserved on the `legacy-converter-hamiltonians` branch.

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

Append `eq` and a target unit, for example `hbar * 25 GHz eq meV` or
`10 m / 2s eq km/h`. Base units use a readable SI prefix automatically;
an explicitly entered prefix is retained. Energy results can also
use energy equivalents such as `eq GHz`, `eq K_energy` or `eq nm_energy`.
The reverse direction also works, for example `1 GHz eq eV`, `1 rad_s eq eV`
or `500 nm eq eV`. The result shows the relation and the constants used.

The default output unit follows an explicitly entered unit of the resulting
dimension when possible. Otherwise, energies involving Planck's constant,
Boltzmann's constant or the Bohr magneton default to electronvolts; other
results use standard units. A manually selected output unit takes precedence.

Saved calculations retain their expression, angle setting and selected result
unit locally in this browser. The Copy LaTeX button copies the formatted input
expression. On small screens, type names to use autocomplete.

The calculator can be installed as a PWA through a compatible browser on HTTPS
(or localhost). After the first online visit its application files are cached
for offline use. MathJax is loaded from a CDN, so formatted mathematics may
require an internet connection or a previously cached MathJax copy.

## Constants and maintenance

The source catalog is generated from SciPy 1.14.1
`scipy.constants.physical_constants` (CODATA 2018). The calculator exposes a
curated set with conventional, unambiguous symbols (for example `gamma_e`,
`gamma_p` and `gamma_n`). Ratios and alternate units can be calculated from
those symbols. Legacy long names remain accepted only for retained constants;
saved expressions using removed constants need to be updated. SciPy is only
needed when regenerating the local data file, not to use or deploy the site. To
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

# Quantum Physics Calculator

A static, client-side physics calculator. It runs in the browser and can be hosted
on GitHub Pages; Flask, Python and a backend API are not needed at runtime.
See [the calculator guide](guide.html) for usage examples.

The calculator is available at [index.html](index.html). The promotional landing
page is at [landing.html](landing.html), with direct links to the calculator and
guide. It defaults to English; the EN/DE selector switches the complete page to
German and remembers the explicit choice locally, including offline.
The PWA and Android app continue to open the calculator directly.
The former unit converter and
qubit Hamiltonians are preserved on the `legacy-converter-hamiltonians` branch.

Open `index.html` in a browser or serve this directory with any static HTTP server,
for example `python3 -m http.server 5000`. MathJax is loaded from a CDN for
formatted equations; calculations run locally, including offline.

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
Conversions between equivalents also work, for example `1 GHz eq K`,
`1 rad_s eq eV` or `500 nm eq Hz`. The result shows the relations and constants used.

The default output unit follows an explicitly entered unit of the resulting
dimension when possible. Otherwise, energies involving Planck's constant,
Boltzmann's constant or the Bohr magneton default to electronvolts; other
results use standard units. A manually selected output unit takes precedence.

Saved calculations retain their expression, angle setting and selected result
unit locally in this browser. The Copy LaTeX button copies the formatted input
expression. On small screens, type names to use autocomplete.

The mobile interface keeps the active calculation in a single viewport. Its math
editor displays editable fractions, powers, subscripts and constant symbols, and
can be expanded; unit conversion, symbol browsing,
saved calculations and examples open in dialogs. Tap **Done** to dismiss the
calculator keyboard and access the bottom navigation. The alphabetic tab retains
the type-and-select workflow for constants, units and functions. There is one
unified keyboard with fractions, powers, scientific notation and field navigation.
Physical `/` captures the preceding term as the numerator and `*` multiplies.

The gear button opens device-local settings for decimal point/comma, automatic,
decimal, scientific or engineering result formatting, 3–15 significant digits,
unit prefix scaling, angle mode and QWERTZ/QWERTY/AZERTY/Dvorak keyboards. With
decimal comma, use `;` between function arguments. Saved expressions and internal
calculation precision remain independent of display preferences.

The calculator can be installed as a PWA through a compatible browser on HTTPS
(or localhost). After the first online visit its application files are cached
for offline use. MathJax is loaded from a CDN, so formatted mathematics may
require an internet connection or a previously cached MathJax copy.

## Android

The `android` project packages the same static application in a WebView.
With JDK 17 or newer, Gradle 8.13 and Android SDK 35 installed, run
`gradle -p android assembleDebug`. The debug APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`. Debug builds are signed
with the local Android debug key and are intended for personal installation;
publishing updates requires a persistent release signing key. The bundled site
works offline; MathJax is fetched from its CDN unless already cached.

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
node tests/js/math-editor.test.js
node tests/js/settings.test.js
node tests/js/static-site.test.js
```

The Android UI smoke test runs against Chrome in a connected emulator with Node.js
22 or newer (no package installation). Start the local server, open
`http://localhost:5000/` in emulator Chrome, then run:

```sh
adb reverse tcp:5000 tcp:5000
adb forward tcp:9222 localabstract:chrome_devtools_remote
node tests/android/calculator-ui.mjs
```

Set `ADB` to the adb executable path when it is not on PATH. The test exercises
touch input with the math keyboard, fractions, constant symbols, suggestions,
long expressions, dialogs,
unit conversion and saved calculations, and restores the existing saved entries.
Screenshots are written to the system temporary directory.

The feedback regression suite uses hardware keyboard and touch/IME input at laptop, tablet
(portrait and landscape) and narrow phone sizes. With a separate Chrome test
profile running `--remote-debugging-port=9333`, run
`node tests/browser/calculator-feedback.mjs`. Set `CDP_PORT=9222` to run the
same input and settings checks in emulator Chrome. It restores existing settings.

Open `http://localhost:5000/landing.html` in that test browser and run
`node tests/browser/landing.mjs` to check the promotional page at laptop, tablet
and phone sizes, including navigation to the calculator and guide and offline
reloads. Set `CDP_PORT=9222` for the Android Chrome check. Screenshots are written
to the system temporary directory.

The PWA and adaptive Android launcher icons share `assets/logo.svg` as their
visual source; PNG exports and Android vector paths are checked into the repo.
Run `python3 scripts/generate_icons.py` after editing the logo to regenerate the
PWA, maskable, legacy Android, adaptive and monochrome assets. This maintenance
script needs ImageMagick's `convert` command and no additional Python packages.
Then run `python3 scripts/version_assets.py` to refresh asset and cache versions.

## Scientific functions and angles

Use the Rad/Deg button in the header to choose radians or degrees for
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

## Math editor dependency

MathLive 0.111.4 is vendored under `assets/vendor/mathlive/` with its MIT license
and fonts. No package install or build step is needed. Its editor, numeric and
alphabetic keyboards, and fonts are cached locally for offline use.
`assets/js/math-editor.js` translates mathematical input to the existing physics
engine and preserves distinct unit and constant identities. Saved calculations
keep the existing canonical text format. MathJax still renders results and
detailed expressions with the existing CDN/cache behavior.

When updating MathLive, review its license and the recorded package integrity,
update the offline asset list in `service-worker.js`, and run the asset version
script and Android UI checks.

# Repository guide

## Project

- Static client-side physics calculator, hosted from the repository root on GitHub Pages. There is no runtime backend or JavaScript package installation.
- `index.html`, `guide.html`, `assets/css/styles.css`: interface and guide. `assets/js/calculator.js`: UI state, input, rendering and saved calculations. `assets/js/physics-engine.js`: parsing, dimensions, units, conversions and constants. `assets/js/pwa.js`, `manifest.webmanifest`, `service-worker.js`: PWA and offline shell.
- `assets/js/scipy-constants.js` is generated data. `scripts/` contains maintenance scripts; `tests/js/` contains Node tests. `android/` wraps the same static files in an Android WebView.

## Commands

Run from the repository root:

```sh
python3 -m http.server 5000                  # local site: http://localhost:5000/
python3 scripts/version_assets.py            # refresh asset hashes and PWA cache version
node tests/js/physics-engine.test.js         # physics engine tests
node tests/js/static-site.test.js            # static paths and asset hashes
node --test --test-name-pattern='arithmetic' tests/js/physics-engine.test.js  # matching test
gradle -p android assembleDebug               # JDK 17+, Gradle 8.13, Android SDK 35
```

No repository-wide package install, linter, formatter or type-check command is configured. SciPy 1.14.1 is only needed to regenerate the constants with `python3 scripts/generate_scipy_constants.py`.

## Architecture and conventions

- Keep the website static, with relative asset links so it works under a GitHub Pages subpath. MathJax is loaded from a CDN; preserve the existing offline behavior.
- The physics engine is plain JavaScript shared by the browser and Node tests; keep physics calculations and dimension validation there, and DOM interactions in `calculator.js`. Follow the existing `const`/`let`, camelCase function names and descriptive errors thrown with `Error`.
- Preserve case-sensitive unit and constant symbols, unit dimensions, temperature offsets, and the distinction between ordinary frequency and energy equivalents. Preserve source attribution for numerical constants.
- Saved calculations use browser local storage. Keep existing saved entries readable when changing their format. The Android build copies the root web assets; avoid maintaining a separate copy.
- Tests use Node's built-in `node:test` and `node:assert/strict`; add focused cases in the existing test files when tests are requested. Keep responsive and keyboard interactions usable.

## Workflow and boundaries

- After changing web CSS or JavaScript, run `python3 scripts/version_assets.py`; it updates page hashes and the service-worker cache name. Check that new offline assets are listed in `service-worker.js` when applicable.
- Run the relevant documented checks when the task requests testing or verification. Report checks not run and any limitations; Android build output is `android/app/build/outputs/apk/debug/app-debug.apk`.
- Do not hand-edit `assets/js/scipy-constants.js`; regenerate it with the script and review the SciPy/CODATA source label. Do not edit generated build outputs, `.gradle/`, virtual environments, caches, or secrets. Keep signing keys and `android/local.properties` out of version control.
- Respect existing uncommitted changes. Commit, push or publish only when the user requests it.

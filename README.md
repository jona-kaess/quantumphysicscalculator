# Quantum Physics Calculator (Flask)

A modular Flask web application for simple quantum-physics-related conversions.

## Features

- Application factory pattern for scalable app initialization
- Blueprint-based routing
- Dedicated service layer for business logic
- Validation utilities for request payload handling
- Minimal homepage using Flask templates and static CSS
- Clean server-rendered GUI form for interactive conversions
- API endpoint for unit conversions
- Supports scientific notation such as 1e-3 and 2*10^5
- Uses scipy.constants for physical constants
- Supports SI-style prefixes: k, M, G, T, m, mu (and u)
- Includes a swap button in the GUI to flip source and target units

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── api.py
│   │   └── pages.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── conversion_service.py
│   ├── static/
│   │   └── css/
│   │       └── styles.css
│   ├── templates/
│   │   ├── base.html
│   │   └── index.html
│   └── utils/
│       ├── __init__.py
│       └── validators.py
├── tests/
│   ├── __init__.py
│   └── test_app.py
├── requirements.txt
├── run.py
└── README.md
```

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the app:

```bash
python run.py
```

The homepage will be available at:

`http://127.0.0.1:5000/`

## API

### Health Check

- Method: `GET`
- URL: `/api/v1/health`

### Convert

- Method: `POST`
- URL: `/api/v1/convert`
- JSON body:

```json
{
  "value": 532,
  "source_unit": "nm",
  "target_unit": "eV"
}
```

- Supported units:
  - `eV`
  - `J`
  - `nm`
  - `T` (via Bohr magneton)
  - `K` (via Boltzmann constant)
  - `Hz` (frequency via Planck constant h)
  - `rad_s` (angular frequency via reduced Planck constant ħ)

- Prefix examples:
  - `keV`, `MeV`, `mJ`, `uJ`, `GHz`, `mK`

## Notes on Maintainability

- Route files only orchestrate request/response behavior.
- Conversion logic is isolated in `app/services/conversion_service.py`.
- Input validation is isolated in `app/utils/validators.py`.
- New conversion rules can be added to the conversion map in one place.

## Interactive physics calculator

Open `/calculator` for the client-side expression calculator. It supports arithmetic,
parentheses, powers, implicit multiplication, SI units and physical constants.
Use uppercase `E` for scientific notation (`1E6`); lowercase `e` is the elementary
charge. Use Ctrl+K to insert a constant and Ctrl+E to browse units by quantity.

Examples: `hbar * 10 GHz`, `2 kg * 9.81 m / s^2`, `20 degC - 10 degC`.
Frequency units (`Hz`, `rad_s`) have frequency dimensions. Use the explicitly
marked energy equivalents (`Hz_energy`, `rad_s_energy`, `K_energy`,
`T_energy` or `nm_energy`) for the corresponding physical energy relation.
Celsius and Fahrenheit are absolute temperatures; `deltaC` and `deltaF` denote
temperature differences. Plain K can represent either, and the results show both
interpretations when appropriate. A positive wavelength is required for `nm_energy`.
MathJax is loaded from a CDN for formatted equations, so rendering requires network
access; the arithmetic itself runs locally in the browser.

Run the calculator engine unit tests with `node tests/js/physics-engine.test.js`.

The constants catalog contains all 442 entries in the SciPy 1.14.1
`scipy.constants.physical_constants` database (CODATA 2018), with the original
value and unit shown when used. Additional short aliases such as `hbar`, `e` and
`k_B` are provided for convenience. The catalog is stored locally for use without
a server request and can be regenerated with
`.venv/bin/python scripts/generate_scipy_constants.py`. SciPy version changes may
change the catalog and its recommended values; review the generated source label
when upgrading.

The unit picker starts at **Any**, so its search includes every unit. Enter selects
the best matching result. Common SI prefixes include `u`, `mu`, and `µ` for micro;
for example, `mm`, `ml`, and `mug`.

The expression field offers live completions for constants and units. Use the
arrow keys and Enter or Tab to accept a suggestion; Escape dismisses it. Common
constants also have short names such as `m_e`, `alpha`, and `epsilon_0`.
Unit pickers show base symbols and the result uses an automatically chosen SI
prefix, with its power of ten shown below the value. Frequency as an energy
equivalent shows its defining relation separately.

US customary and UK imperial liquid measures are distinguished: for example,
`gal_US` and `gal_UK`, `pt_US` and `pt_UK`, or `fl_oz_US` and `fl_oz_UK`.
Other available customary units include inches, feet, miles, acres, pounds,
pound-force, horsepower and BTU. The unit menu lists the supported set.
Dimensional analysis identifies many common physical dimensions; dimensions
shared by different physical quantities are labeled together when appropriate.

A unit written directly after a number in a denominator belongs to that number:
`5V / 10A` means `5V / (10 A)`. A space after the denominator number leaves
the multiplication outside the division: `5V / 10 A` means `(5V / 10) * A`.
Parentheses can always be used to make the intended grouping explicit.

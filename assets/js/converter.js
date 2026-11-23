// Quantum Physics Calculator — static client-side converter
// Faithful port of the original Flask logic (validators.py + conversion_service.py)
// Constants from scipy.constants (CODATA), matching the Python app 1:1.

"use strict";

const PHYS = {
  e: 1.602176634e-19,            // elementary charge [C]
  h: 6.62607015e-34,             // Planck constant [J*s]
  hbar: 1.0545718176461565e-34,  // reduced Planck constant
  k: 1.380649e-23,               // Boltzmann constant [J/K]
  muB: 9.2740100783e-24,         // Bohr magneton [J/T], CODATA 2018
  c: 299792458.0,                // speed of light [m/s]
};

const PREFIX_FACTORS = {
  "": 1.0,
  m: 1e-3,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  mu: 1e-6,
  u: 1e-6,
  "µ": 1e-6,
};

const UNIT_SYMBOLS = {
  ev: "eV",
  j: "J",
  nm: "nm",
  t: "T",
  k: "K",
  hz: "Hz",
  rad_s: "rad/s",
};

const UNIT_SUFFIXES = ["rad/s", "rad_s", "hz", "ev", "nm", "j", "t", "k"];

const UNIT_ALIASES = {
  "rad/s": "rad_s",
  rad_s: "rad_s",
  hz: "hz",
  ev: "ev",
  nm: "nm",
  j: "j",
  t: "t",
  k: "k",
};

// Python's "%.12g" formatting: 12 significant digits; uses scientific notation
// like %g when the exponent is < -4 or >= 12, else fixed notation; strips
// trailing zeros and any trailing decimal point.
function formatG12(num) {
  if (!isFinite(num)) return String(num);
  num = Number(num);
  if (!num) return "0";
  const e = Math.floor(Math.log10(Math.abs(num)));
  if (e < -4 || e >= 12) {
    let s = num.toExponential(11);
    s = s.replace(/(\.\d*?)0+e/, "$1e");
    s = s.replace(/\.e/, "e");
    return s;
  }
  const digits = Math.max(0, 11 - e);
  let s = num.toFixed(digits);
  s = s.replace(/(\.\d*?)0+$/, "$1");
  s = s.replace(/\.$/, "");
  return s;
}

// parse "2*10^5", "2x10^-3", "1e-3", "1G", "250m", ...
function parseNumericValue(value) {
  const textValue = String(value).trim();
  if (!textValue) throw new Error("Field 'value' must not be empty.");
  const normalized = textValue.replace("μ", "µ");
  const candidatePrefixes = ["mu", "u", "µ", "m", "k", "M", "G", "T"];

  for (const prefix of candidatePrefixes) {
    if (!normalized.endsWith(prefix)) continue;
    const numericPortion = normalized.slice(0, -prefix.length).trim();
    if (!numericPortion) continue;
    try {
      const numeric = parseNumericComponent(numericPortion);
      return numeric * PREFIX_FACTORS[prefix];
    } catch {
      continue;
    }
  }

  try {
    return parseNumericComponent(normalized);
  } catch {
    throw new Error(
      "Field 'value' must be numeric (examples: 12.5, 1e-3, 2*10^5, 1G, 250m)."
    );
  }
}

function parseNumericComponent(textValue) {
  const m = /^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*[xX*]\s*10\s*\^\s*([+-]?\d+)\s*$/.exec(
    textValue
  );
  if (m) {
    const base = parseFloat(m[1]);
    const exponent = parseInt(m[2], 10);
    return base * Math.pow(10, exponent);
  }
  const text = textValue.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
    throw new Error("Invalid number.");
  }
  const result = Number(text);
  if (!Number.isFinite(result)) throw new Error("Number must be finite.");
  return result;
}

// Normalize a unit text into base unit + factor + display unit.
function parseUnitWithOptionalPrefix(unitText, prefixOverride) {
  if (!unitText || !unitText.trim()) throw new Error("Unit is required.");
  const cleaned = unitText.trim().replace("μ", "µ");

  if (cleaned.toLowerCase() === "nm" && prefixOverride == null) {
    return { base: "nm", factor: 1.0, display: "nm", explicit: false };
  }

  if (prefixOverride != null && prefixOverride.trim() !== "") {
    let prefix = _normalizePrefix(prefixOverride.replace("μ", "µ"));
    let explicit = false;
    if (prefix === "auto") {
      prefix = "";
    } else {
      explicit = true;
    }
    const baseUnit = UNIT_ALIASES[cleaned.toLowerCase()];
    if (!baseUnit) throw new Error(`Unsupported unit '${unitText}'.`);
    const displayPrefix = prefix === "u" || prefix === "µ" ? "u" : prefix;
    return {
      base: baseUnit,
      factor: PREFIX_FACTORS[prefix],
      display: `${displayPrefix}${UNIT_SYMBOLS[baseUnit]}`,
      explicit,
    };
  }

  const lowered = cleaned.toLowerCase();
  for (const suffix of UNIT_SUFFIXES) {
    if (!lowered.endsWith(suffix)) continue;
    const prefixText = cleaned.slice(0, cleaned.length - suffix.length);
    if (suffix === "nm" && prefixText) continue;
    if (!(prefixText in PREFIX_FACTORS)) continue;
    const baseUnit = UNIT_ALIASES[suffix];
    const displayPrefix = prefixText === "u" || prefixText === "µ" ? "u" : prefixText;
    const explicit = prefixText !== "";
    return {
      base: baseUnit,
      factor: PREFIX_FACTORS[prefixText],
      display: `${displayPrefix}${UNIT_SYMBOLS[baseUnit]}`,
      explicit,
    };
  }
  throw new Error(`Unsupported unit '${unitText}'.`);
}

function _normalizePrefix(prefix) {
  const normalized = (prefix || "").trim();
  if (normalized === "auto") return "auto";
  if (!(normalized in PREFIX_FACTORS)) {
    throw new Error("Unsupported prefix. Use one of: k, M, G, T, m, mu (or u).");
  }
  return normalized;
}

function formatWithSiPrefix(value, baseUnit) {
  const symbol = UNIT_SYMBOLS[baseUnit];
  if (baseUnit === "nm" || value === 0) return { value, unit: symbol };

  const absValue = Math.abs(value);
  const displayPrefixes = ["T", "G", "M", "k", "", "m", "mu"];
  for (const prefix of displayPrefixes) {
    const factor = PREFIX_FACTORS[prefix === "mu" ? "mu" : prefix];
    const scaled = absValue / factor;
    if (scaled >= 1 && scaled < 1000) {
      const signedValue = value / factor;
      const displayPrefix = prefix === "mu" ? "u" : prefix;
      return { value: signedValue, unit: `${displayPrefix}${symbol}` };
    }
  }
  return { value, unit: symbol };
}

// Convert between supported quantum units. Returns display result + SI-prefixed text.
function convert(valueInput, sourceUnitText, targetUnitText, sourcePrefixArg, targetPrefixArg) {
  const numericValue = parseNumericValue(valueInput);

  if (!sourceUnitText) throw new Error("Field 'source_unit' is required.");
  if (!targetUnitText) throw new Error("Field 'target_unit' is required.");

  const sourcePrefix = (sourcePrefixArg || "").trim() || null;
  const targetPrefix = (targetPrefixArg || "").trim() || null;

  const src = parseUnitWithOptionalPrefix(sourceUnitText, sourcePrefix);
  const tgt = parseUnitWithOptionalPrefix(targetUnitText, targetPrefix);

  const valueInBaseSource = numericValue * src.factor;
  if (src.base === "nm" && valueInBaseSource <= 0) {
    throw new Error("Field 'value' must be greater than 0 for wavelength.");
  }

  let resultInTargetBase;
  if (src.base === tgt.base) {
    resultInTargetBase = valueInBaseSource;
  } else {
    const joules = toJoules(valueInBaseSource, src.base);
    resultInTargetBase = fromJoules(joules, tgt.base);
  }

  const result = resultInTargetBase / tgt.factor;

  let displayValue, displayUnit;
  if (tgt.explicit) {
    displayValue = result;
    displayUnit = tgt.display;
  } else {
    const formatted = formatWithSiPrefix(resultInTargetBase, tgt.base);
    displayValue = formatted.value;
    displayUnit = formatted.unit;
  }

  return {
    value: valueInBaseSource,
    sourceUnit: src.display,
    targetUnit: tgt.display,
    result,
    displayValue,
    displayUnit,
    resultDisplayText: `${formatG12(displayValue)} ${displayUnit}`,
    originals: { sourceUnit: sourceUnitText, targetUnit: targetUnitText },
  };
}

function toJoules(value, unit) {
  switch (unit) {
    case "j": return value;
    case "ev": return value * PHYS.e;
    case "k": return value * PHYS.k;
    case "hz": return PHYS.h * value;
    case "rad_s": return PHYS.hbar * value;
    case "t": return PHYS.muB * value;
    case "nm": {
      if (value <= 0) throw new Error("Wavelength must be greater than 0.");
      return (PHYS.h * PHYS.c) / (value * 1e-9);
    }
    default: throw new Error(`Unsupported source unit '${unit}'.`);
  }
}

function fromJoules(joules, unit) {
  switch (unit) {
    case "j": return joules;
    case "ev": return joules / PHYS.e;
    case "k": return joules / PHYS.k;
    case "hz": return joules / PHYS.h;
    case "rad_s": return joules / PHYS.hbar;
    case "t": return joules / PHYS.muB;
    case "nm": {
      if (joules <= 0) throw new Error("Cannot convert non-positive energy to wavelength in nm.");
      return (PHYS.h * PHYS.c / joules) * 1e9;
    }
    default: throw new Error(`Unsupported target unit '${unit}'.`);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { convert, parseNumericValue, formatWithSiPrefix, formatG12, PHYS };
}

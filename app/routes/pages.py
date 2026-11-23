from flask import Blueprint, render_template, request

from app.services.conversion_service import ConversionService
from app.utils.validators import ValidationError, format_with_si_prefix, validate_conversion_payload

pages_bp = Blueprint("pages", __name__)


@pages_bp.get("/calculator")
def calculator():
    return render_template("calculator.html")


@pages_bp.get("/hamiltonians")
def hamiltonians():
    return render_template("hamiltonians.html")

UNIT_OPTIONS = [
    ("ev", "Electron volts (eV)"),
    ("j", "Joules (J)"),
    ("nm", "Wavelength (nm)"),
    ("t", "Tesla (T, via Bohr magneton)"),
    ("k", "Kelvin (K, via Boltzmann constant)"),
    ("hz", "Frequency (Hz)"),
    ("rad_s", "Angular frequency (rad/s)"),
]

UNIT_EQUATIONS = {
    "ev": r"e\,E_{\mathrm{eV}}",
    "j": r"E_{\mathrm{J}}",
    "nm": r"\frac{hc}{\lambda}",
    "t": r"\mu_B B",
    "k": r"k_B T",
    "hz": r"h\nu",
    "rad_s": r"\hbar\omega",
}


@pages_bp.route("/", methods=["GET", "POST"])
def home():
    result = None
    result_unit = None
    conversion_equation = None
    error = None
    form_data = {
        "value": "",
        "source_unit": "ev",
        "target_unit": "j",
    }

    if request.method == "POST":
        form_data = {
            "value": request.form.get("value", "").strip(),
            "source_unit": request.form.get("source_unit", "ev").strip().lower(),
            "target_unit": request.form.get("target_unit", "j").strip().lower(),
        }

        try:
            (
                numeric_value,
                source_unit,
                target_unit,
                _,
                _,
                _,
                _,
            ) = validate_conversion_payload(form_data)
            result_base = ConversionService.convert(numeric_value, source_unit, target_unit)
            result, result_unit = format_with_si_prefix(result_base, target_unit)
            conversion_equation = (
                f"{UNIT_EQUATIONS[source_unit]} = {UNIT_EQUATIONS[target_unit]}"
            )

            form_data["value"] = request.form.get("value", "").strip()
        except (ValidationError, ValueError) as exc:
            error = str(exc)

    return render_template(
        "index.html",
        unit_options=UNIT_OPTIONS,
        result=result,
        result_unit=result_unit,
        conversion_equation=conversion_equation,
        error=error,
        form_data=form_data,
    )

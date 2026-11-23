"""Update local asset URLs with content hashes for reliable static deployments."""
import hashlib
import re
from pathlib import Path

PAGES = ('index.html',)
ASSET_URL = re.compile(r'(?P<attr>src|href)="(?P<path>assets/(?:css|js)/[^"?]+)(?:\?v=[a-f0-9]+)?"')


def main():
    for name in PAGES:
        page = Path(name)
        text = page.read_text(encoding='utf-8')
        def replace(match):
            asset = Path(match.group('path'))
            digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
            return f'{match.group("attr")}="{asset.as_posix()}?v={digest}"'
        page.write_text(ASSET_URL.sub(replace, text), encoding='utf-8')
    # Refresh the offline shell whenever a page or core asset changes.
    core = [Path(name) for name in PAGES] + sorted(Path('assets/css').glob('*')) + sorted(Path('assets/js').glob('*'))
    digest = hashlib.sha256(b''.join(p.read_bytes() for p in core)).hexdigest()[:12]
    worker = Path('service-worker.js')
    if worker.exists():
        worker.write_text(re.sub(r"const CACHE='physics-calculator-[^']+'", f"const CACHE='physics-calculator-{digest}'", worker.read_text(encoding='utf-8')), encoding='utf-8')


if __name__ == '__main__':
    main()

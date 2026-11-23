"""Update local asset URLs with content hashes for reliable static deployments."""
import hashlib
import re
from pathlib import Path

PAGES = ('index.html', 'converter.html', 'hamiltonians.html')
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


if __name__ == '__main__':
    main()

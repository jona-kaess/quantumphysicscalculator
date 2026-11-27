"""Export the shared SVG mark to PWA PNGs and Android launcher vectors.

Requires ImageMagick (`convert`); no Python packages are needed.
"""
import copy
import shutil
import subprocess
import tempfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SVG = 'http://www.w3.org/2000/svg'
ANDROID = 'http://schemas.android.com/apk/res/android'
ET.register_namespace('', SVG)
ET.register_namespace('android', ANDROID)


def rect_path(element):
    x, y, w, h = (float(element.get(key, '0')) for key in ('x', 'y', 'width', 'height'))
    r = min(float(element.get('rx', '0')), w / 2, h / 2)
    return (f'M{x+r:g},{y:g} H{x+w-r:g} A{r:g},{r:g} 0 0 1 {x+w:g},{y+r:g} '
            f'V{y+h-r:g} A{r:g},{r:g} 0 0 1 {x+w-r:g},{y+h:g} '
            f'H{x+r:g} A{r:g},{r:g} 0 0 1 {x:g},{y+h-r:g} '
            f'V{y+r:g} A{r:g},{r:g} 0 0 1 {x+r:g},{y:g} Z')


def vector_path(element):
    attributes = {'pathData': rect_path(element) if element.tag.endswith('rect') else element.get('d')}
    for source, target in [('fill', 'fillColor'), ('stroke', 'strokeColor'), ('stroke-width', 'strokeWidth'),
                           ('stroke-linecap', 'strokeLineCap'), ('stroke-linejoin', 'strokeLineJoin')]:
        if element.get(source) is not None:
            attributes[target] = '@android:color/transparent' if element.get(source) == 'none' else element.get(source)
    return ET.Element('path', {f'{{{ANDROID}}}{key}': value for key, value in attributes.items()})


def write_vector(name, paths):
    root = ET.Element('vector', {f'{{{ANDROID}}}{key}': value for key, value in {
        'width': '108dp', 'height': '108dp', 'viewportWidth': '512', 'viewportHeight': '512'}.items()})
    group = ET.SubElement(root, 'group', {f'{{{ANDROID}}}{key}': value for key, value in {
        'scaleX': '0.78', 'scaleY': '0.78', 'translateX': '56.32', 'translateY': '56.32'}.items()})
    group.extend(paths)
    ET.indent(root, space='    ')
    target = ROOT / 'android/app/src/main/res/drawable' / name
    target.write_text(ET.tostring(root, encoding='unicode') + '\n', encoding='utf-8')


def main():
    source = ROOT / 'assets/logo.svg'
    root = ET.parse(source).getroot()
    shapes = list(root)
    background, body, display, symbol, key1, key2, key3, equals = shapes
    for size in (192, 512):
        subprocess.run(['convert', '-background', 'none', f'MSVG:{source}', '-resize', f'{size}x{size}',
                        '-strip', f'PNG32:{ROOT / f"assets/icon-{size}.png"}'], check=True)
    maskable = copy.deepcopy(root)
    maskable[:] = []
    solid_background = copy.deepcopy(background)
    solid_background.set('rx', '0')
    maskable.append(solid_background)
    group = ET.SubElement(maskable, f'{{{SVG}}}g', {'transform': 'translate(56.32 56.32) scale(.78)'})
    group.extend(copy.deepcopy(shapes[1:]))
    with tempfile.TemporaryDirectory() as directory:
        temporary = Path(directory) / 'maskable.svg'
        ET.ElementTree(maskable).write(temporary, encoding='unicode')
        subprocess.run(['convert', f'MSVG:{temporary}', '-strip',
                        f'PNG32:{ROOT / "assets/icon-maskable-512.png"}'], check=True)
    shutil.copyfile(ROOT / 'assets/icon-512.png', ROOT / 'android/app/src/main/res/drawable-nodpi/icon.png')
    write_vector('ic_launcher_foreground.xml', [vector_path(shape) for shape in shapes[1:]])
    # Cut display and key holes out of the silhouette for Android themed icons.
    silhouette = ET.Element('path', {
        f'{{{ANDROID}}}pathData': ' '.join(rect_path(shape) for shape in (body, display, key1, key2, key3)),
        f'{{{ANDROID}}}fillColor': '#ffffff', f'{{{ANDROID}}}fillType': 'evenOdd'})
    monochrome = [silhouette]
    for shape in (symbol, equals):
        path = vector_path(shape)
        path.set(f'{{{ANDROID}}}strokeColor', '#ffffff')
        monochrome.append(path)
    write_vector('ic_launcher_monochrome.xml', monochrome)


if __name__ == '__main__':
    main()

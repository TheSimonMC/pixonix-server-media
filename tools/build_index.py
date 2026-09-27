"""Generate PIXONIX's small index without changing any original image or manifest."""
from pathlib import Path
import hashlib, json, struct

ROOT = Path(__file__).resolve().parents[1]

def image(folder, names):
    for name in names:
        path = folder/name
        if not path.is_file():
            continue
        data = path.read_bytes()
        if data[:8] != b'\x89PNG\r\n\x1a\n' or len(data) < 24:
            continue
        width, height = struct.unpack('>II', data[16:24])
        if not (0 < width <= 4096 and 0 < height <= 4096 and width*height <= 8388608 and len(data) <= 16777216):
            raise ValueError(f'Image exceeds client limits: {path}')
        return dict(path=path.relative_to(ROOT).as_posix(), sha256=hashlib.sha256(data).hexdigest(),
                    bytes=len(data), width=width, height=height)
    return None

servers = []
for path in sorted((ROOT/'minecraft_servers').glob('*/manifest.json')):
    source = json.loads(path.read_text(encoding='utf-8-sig'))
    addresses = list(dict.fromkeys([source['direct_ip'], *source.get('server_wildcards', [])]))
    row = dict(id=path.parent.name, name=source.get('nice_name', path.parent.name), addresses=addresses)
    for key, names in {
        'icon': ['icon@2x.png', 'icon.png'],
        'banner': ['banner.png'],
        'background': ['background@2x.png', 'background.png'],
        'logo': ['logo@2x.png', 'logo.png'],
    }.items():
        asset = image(path.parent, names)
        if asset:
            row[key] = asset
    servers.append(row)
payload = dict(schema=1, servers=servers)
(ROOT/'index.json').write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
print(f'{len(servers)} servers, {sum("banner" in s for s in servers)} original banners')

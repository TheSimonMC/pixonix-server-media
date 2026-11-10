"""Validate reviewed Minecraft server media and produce its client index."""
import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = {
    "icon": ("icon@2x.png", "icon.png"), "background": ("background@2x.png", "background.png"),
    "logo": ("logo@2x.png", "logo.png"), "banner": ("banner.png",),
}
SLUG = re.compile(r"[a-z0-9][a-z0-9_-]{0,63}")
LABEL = r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
HOST = re.compile(rf"({LABEL}(?:\.{LABEL})+)(?::([1-9][0-9]{{0,4}}))?")
def require(ok, message):
    if not ok:
        raise ValueError(message)

def address(value):
    m = HOST.fullmatch(value)
    require(m and len(m[1]) <= 253 and int(m[2] or 25565) <= 65535, f"Invalid Java server address: {value}")
    return m[1] + (":" + m[2] if m[2] and m[2] != "25565" else "")

def label(value, maximum):
    require(isinstance(value, str) and value.strip() == value and 0 < len(value) <= maximum
            and value.isprintable(), "Invalid display name")
    return value

def image(path, root):
    size = path.stat().st_size
    require(24 <= size <= 16*1024**2, f"{path.name}: file size")
    with Image.open(path, formats=["PNG"]) as png:
        w, h = png.size
        require(max(w,h) <= 4096 and w*h <= 8388608 and not png.is_animated, f"{path.name}: dimensions or animation")
        png.verify()
    with Image.open(path) as png:
        png.load()
    return dict(path=path.relative_to(root).as_posix(), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                bytes=size, width=w, height=h)

def unique_fields(pairs):
    obj = dict(pairs)
    require(len(pairs) == len(obj), "Duplicate JSON key")
    return obj

def server(folder, root, catalog):
    require(folder.is_dir() and not folder.is_symlink() and SLUG.fullmatch(folder.name), "Invalid server folder")
    files = {}
    allowed = {"manifest.json"}.union(*ASSETS.values())
    for path in folder.iterdir():
        require(path.is_file() and not path.is_symlink() and path.name in allowed, f"Unexpected file: {path.name}")
        files[path.name] = path
    manifest = files["manifest.json"]
    require(manifest.stat().st_size <= 65536, "Manifest exceeds 64 KiB")
    data = json.loads(manifest.read_text("utf-8-sig"), object_pairs_hook=unique_fields)
    require(set(data) <= {"server_name","nice_name","direct_ip","aliases","quick_joins","policy","tab_width"}, "Unknown manifest field")
    require(data["server_name"] == folder.name, "Invalid server ID")
    aliases = data.get("aliases", [])
    require(isinstance(aliases,list) and len(aliases)<64, "Too many aliases")
    addresses = [address(a) for a in [data["direct_ip"], *aliases]]
    require(len(set(addresses)) == len(addresses), "Duplicate alias")
    row = dict(id=folder.name, name=label(data["nice_name"],64), addresses=addresses)
    width = data.get("tab_width",250)
    require(type(width) is int and 80 <= width <= 250, "TAB width must be 80–250")
    row["tabWidth"] = width
    modes = data.get("quick_joins",[])
    require(isinstance(modes,list) and len(modes)<=12, "At most 12 Quick Joins")
    if modes:
        joins = []
        for mode in modes:
            require(set(mode)=={"name","address"}, "Quick Join needs a name and address")
            target = address(mode["address"])
            host = target.split(":")[0]
            require(any(host == a.split(":")[0] or host.endswith("."+a.split(":")[0]) for a in addresses),
                    "Quick Join must belong to the mapped network")
            joins.append(dict(name=label(mode["name"],32), address=target))
        for key in ("name","address"):
            require(len({m[key].casefold() for m in joins}) == len(joins), f"Duplicate Quick Join {key}")
        row["quickJoins"] = joins
    if "policy" in data:
        p = data["policy"]
        require(set(p) <= {"version","modules","options"} and type(p["version"]) is int and p["version"]==1,
                "Unknown policy version or field")
        for section, known in catalog.items():
            entries = p["modules"] if section=="modules" else p.get("options",{})
            require(isinstance(entries,dict) and all(k in known and type(v) is bool for k,v in entries.items()),
                    f"Unknown {section} or invalid permission")
        row["policy"] = p
    for kind, names in ASSETS.items():
        for name in names:
            if name in files:
                metadata = image(files[name],root)
                row.setdefault(kind, metadata)
    return row

def build(root):
    modules = json.loads((ROOT/"docs/modules.json").read_text("utf-8"))
    catalog = {"modules": {m["id"] for m in modules},
               "options": {m["id"]+"."+key for m in modules for key in m["options"]}}
    base = root/"minecraft_servers"
    require(base.is_dir() and not base.is_symlink(), "Missing or invalid minecraft_servers")
    rows, addresses = [], set()
    for folder in sorted(base.iterdir()):
        try:
            row = server(folder,root,catalog)
            require(addresses.isdisjoint(row["addresses"]), "Address already belongs to another mapping")
            addresses.update(row["addresses"])
            rows.append(row)
        except Exception as exc:
            raise ValueError(f"{folder.name}: {exc}") from exc
    require(len(rows)<=5000, "Too many servers")
    payload = json.dumps(dict(schema=1,servers=rows),ensure_ascii=False,separators=(",",":"))+"\n"
    require(len(payload.encode())<=4*1024**2, "Client index size limit")
    return payload

if __name__=="__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = build(args.root)
    if args.output:
        args.output.write_text(result, encoding="utf-8")
    print(f"Validated {len(json.loads(result)['servers'])} mappings.")

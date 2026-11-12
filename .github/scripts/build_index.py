"""Validate server mappings and build the Pixonix client catalog."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = {
    "icon": ("icon@2x.png", "icon.png"), "background": ("background@2x.png", "background.png"),
    "logo": ("logo@2x.png", "logo.png"), "banner": ("banner.png",),
}
SLUG = re.compile(r"[a-z0-9][a-z0-9_-]{0,63}")
LABEL = r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
HOST = re.compile(rf"({LABEL}(?:\.{LABEL})+)(?::([1-9][0-9]{{0,4}}))?")
SERVER_FIELDS = json.loads((ROOT / "docs/server-fields.json").read_text("utf-8"))
def require(ok, message):
    if not ok:
        raise ValueError(message)

def address(value):
    m = HOST.fullmatch(value)
    require(m and len(m[1]) <= 253 and int(m[2] or 25565) <= 65535, f"Invalid Java server address: {value}")
    return m[1] + (":" + m[2] if m[2] and m[2] != "25565" else "")

def label(value, maximum):
    require(isinstance(value, str) and value.strip() == value and 0 < len(value) <= maximum
            and value.isprintable(), f"Enter a display name between 1 and {maximum} printable characters, with no leading or trailing spaces.")
    return value

def social_link(platform, value):
    require(isinstance(value, str) and 0 < len(value) <= 2048 and value.isprintable()
            and not any(c.isspace() or c == "\\" for c in value), f"Invalid {platform} link.")
    url = urlsplit(value)
    schemes = ("http", "https", "ts3") if platform == "teamspeak" else ("http", "https")
    require(url.scheme in schemes and url.hostname and "@" not in url.netloc and url.port != 0,
            f"Enter a full {platform} link with a supported scheme and host.")
    return value

def image(path, root):
    size = path.stat().st_size
    require(24 <= size <= 16*1024**2, f"{path.name} must be between 24 bytes and 16 MiB.")
    with Image.open(path, formats=["PNG"]) as png:
        w, h = png.size
        require(max(w,h) <= 4096 and w*h <= 8388608 and not png.is_animated, f"{path.name} must be a still PNG with no side longer than 4,096 pixels and no more than 8,388,608 pixels in total.")
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
    require(set(data) <= {"server_name","nice_name","direct_ip","aliases","quick_joins","policy","tab_width","categories","socials"}, "Unknown manifest field")
    require(data["server_name"] == folder.name, "server_name must match the folder name.")
    aliases = data.get("aliases", [])
    require(isinstance(aliases,list) and len(aliases)<64, "Provide aliases as a list of up to 63 alternate addresses.")
    addresses = [address(a) for a in [data["direct_ip"], *aliases]]
    require(len(set(addresses)) == len(addresses), "List each server address only once.")
    row = dict(id=folder.name, name=label(data["nice_name"],64), addresses=addresses)
    if "categories" in data:
        categories = data["categories"]
        require(isinstance(categories, list) and categories and
                all(isinstance(c, str) and c in SERVER_FIELDS["categories"] for c in categories) and
                len(set(categories)) == len(categories), "Choose one or more distinct server categories.")
        row["categories"] = categories
    if "socials" in data:
        socials = data["socials"]
        require(isinstance(socials, dict) and socials.keys() <= SERVER_FIELDS["socials"].keys(),
                "Unknown social link platform.")
        if socials:
            row["socials"] = {key: social_link(key, value) for key, value in socials.items()}
    width = data.get("tab_width",250)
    require(type(width) is int and 80 <= width <= 250, "Set tab_width to a whole number between 80 and 250 pixels.")
    row["tabWidth"] = width
    modes = data.get("quick_joins",[])
    require(isinstance(modes,list) and len(modes)<=12, "Provide quick_joins as a list of up to 12 destinations.")
    if modes:
        joins, routes = [], []
        for mode in modes:
            if set(mode) == {"name", "server"}:
                backend = mode["server"]
                require(isinstance(backend, str) and SLUG.fullmatch(backend), "Invalid proxy server ID.")
                routes.append(dict(name=label(mode["name"],32), server=backend))
                continue
            require(set(mode)=={"name","address"}, "Each Quick Join must have a name and an address.")
            target = address(mode["address"])
            host = target.split(":")[0]
            require(any(host == a.split(":")[0] or host.endswith("."+a.split(":")[0]) for a in addresses),
                    "Each Quick Join must use a listed hostname or one of its subdomains.")
            joins.append(dict(name=label(mode["name"],32), address=target))
        for key in ("name","address"):
            require(len({m[key].casefold() for m in joins}) == len(joins), f"Duplicate Quick Join {key}")
        names = [m["name"].casefold() for m in joins + routes]
        require(len(set(names)) == len(names), "Duplicate Quick Join name")
        require(len({m["server"] for m in routes}) == len(routes), "Duplicate proxy server ID")
        if joins: row["quickJoins"] = joins
        if routes: row["proxyJoins"] = routes
    if "policy" in data:
        p = data["policy"]
        require(set(p) <= {"version","modules","options"} and type(p["version"]) is int and p["version"]==1,
                "Unknown policy version or field")
        for section, known in catalog.items():
            entries = p["modules"] if section=="modules" else p.get("options",{})
            require(isinstance(entries,dict) and all(k in known and type(v) is bool for k,v in entries.items()),
                    f"The policy field {section} must contain supported rules with true or false values.")
        row["policy"] = p
    for kind, names in ASSETS.items():
        for name in names:
            if name in files:
                metadata = image(files[name],root)
                row.setdefault(kind, metadata)
    if "icon" in row:
        row.setdefault("logo", row["icon"])
    elif "logo" in row:
        row["icon"] = row["logo"]
    return row

def build(root):
    modules = json.loads((ROOT/"docs/modules.json").read_text("utf-8"))
    catalog = {"modules": {m["id"] for m in modules},
               "options": {m["id"]+"."+key for m in modules for key in m["options"]}}
    base = root/"minecraft_servers"
    require(base.is_dir() and not base.is_symlink(), "The minecraft_servers directory is missing or invalid.")
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
    require(len(payload.encode())<=4*1024**2, "The client catalog exceeds the 4 MiB limit.")
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

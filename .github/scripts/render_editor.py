"""Give the editor's stylesheets and scripts cache keys for the Pages deployment."""

import hashlib
import re
import sys
from pathlib import Path


def render_editor(docs):
    html = (docs / "index.html").read_text(encoding="utf-8")

    def versioned_url(match):
        asset = match["asset"]
        digest = hashlib.sha256((docs / asset).read_bytes()).hexdigest()[:16]
        return f'{match["attribute"]}="{asset}?v={digest}"'

    return re.sub(r'\b(?P<attribute>href|src)="(?P<asset>[\w./-]+\.(?:css|js))"', versioned_url, html)


if __name__ == "__main__":
    docs, output = map(Path, sys.argv[1:])
    output.write_text(render_editor(docs), encoding="utf-8", newline="\n")

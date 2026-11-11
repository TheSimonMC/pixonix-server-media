import re
import shutil
import tempfile
import unittest
from pathlib import Path

from render_editor import render_editor


class EditorAssetsTest(unittest.TestCase):
    def test_layout_update_gets_a_new_stylesheet_url(self):
        docs = Path(__file__).resolve().parents[2] / "docs"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ("index.html", "editor.css", "editor.js", "renderer.js"):
                shutil.copyfile(docs / name, root / name)

            def local_urls():
                return dict(re.findall(r'(?:src|href)="([^"]+\.(?:css|js))\?v=([0-9a-f]+)"', render_editor(root)))

            before = local_urls()
            self.assertEqual(set(before), {"editor.css", "editor.js", "renderer.js"})
            with (root / "editor.css").open("ab") as stylesheet:
                stylesheet.write(b"\n/* layout change */")
            after = local_urls()
            self.assertNotEqual(before.pop("editor.css"), after.pop("editor.css"))
            self.assertEqual(before, after)

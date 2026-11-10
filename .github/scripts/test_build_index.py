import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from PIL import Image
from build_index import build

class MappingTests(unittest.TestCase):
    def setUp(self):
        temp = TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.mapping = dict(server_name="oak",nice_name="Oak",direct_ip="oak.example",
                            quick_joins=[dict(name="Duels",address="duels.oak.example")],
                            policy=dict(version=1,modules={"freelook":False},options={"hit_range.highlight":False}))
        self.folder = self.root/"minecraft_servers"/"oak"
        self.folder.mkdir(parents=True)

    def index(self):
        (self.folder/"manifest.json").write_text(json.dumps(self.mapping),encoding="utf-8")
        return json.loads(build(self.root))["servers"][0]

    def test_artwork_and_quick_joins(self):
        for n,size in [("icon.png",16),("icon@2x.png",32)]:
            Image.new("RGBA",(size,size)).save(self.folder/n)
        row = self.index()
        self.assertEqual(row["icon"]["width"],32)
        self.assertEqual(row["quickJoins"][0]["address"],"duels.oak.example")
        self.assertFalse(row["policy"]["options"]["hit_range.highlight"])

    def test_no_duplicate_or_wildcard_addresses(self):
        for alias in ["oak.example:25565","*.oak.example"]:
            self.mapping["aliases"]=[alias]
            with self.assertRaises(ValueError):
                self.index()

    def test_reject_foreign_mode_and_unknown_rule(self):
        self.mapping["quick_joins"][0]["address"]="oak.example.somewhere.test"
        with self.assertRaises(ValueError):
            self.index()
        self.mapping.pop("quick_joins")
        self.mapping["policy"]["modules"]={"typo":False}
        with self.assertRaises(ValueError):
            self.index()

    def test_protected_mods_and_options(self):
        for section,key in [("modules","zoom"),("modules","server_media"),("modules","social_wheel"),("options","zoom.scroll")]:
            with self.subTest(key=key):
                self.mapping["policy"] = {"version":1,"modules":{},section:{key:False}}
                with self.assertRaises(ValueError):
                    self.index()

    def test_legacy_asset_is_also_checked(self):
        Image.new("RGBA",(32,32)).save(self.folder/"icon@2x.png")
        (self.folder/"icon.png").write_bytes(b"not an image")
        with self.assertRaises(ValueError):
            self.index()

if __name__=="__main__":
    unittest.main()

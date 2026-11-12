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
                            policy=dict(version=1,modules={"freelook":False},options={"fullbright.gamma":False}))
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
        self.assertEqual(row["icon"], row["logo"])
        self.assertEqual(row["quickJoins"][0]["address"],"duels.oak.example")
        self.assertFalse(row["policy"]["options"]["fullbright.gamma"])

    def test_separate_legacy_logo(self):
        Image.new("RGB", (16, 16)).save(self.folder / "icon.png")
        Image.new("RGB", (32, 32)).save(self.folder / "logo.png")
        row = self.index()
        self.assertEqual(row["icon"]["width"], 16)
        self.assertEqual(row["logo"]["width"], 32)

    def test_categories_and_optional_socials(self):
        self.mapping["categories"] = ["PVP", "KITPVP"]
        self.assertNotIn("socials", self.index())
        self.mapping["socials"] = {"website": "https://oak.example/", "teamspeak": "ts3://ts.oak.example:9987"}
        row = self.index()
        for key in ("categories", "socials"):
            self.assertEqual(row[key], self.mapping[key])

    def test_invalid_categories_and_links(self):
        for key, value in [
            ("categories", []), ("categories", ["PVP", "PVP"]), ("categories", ["Other"]),
            ("socials", {"other": "https://oak.example"}), ("socials", {"x": "ts3://oak.example"}),
            ("socials", {"discord": "javascript:alert(1)"}), ("socials", {"store": "https://user@oak.example"}),
            ("socials", {"teamspeak": "ts3://oak.example:70000"}),
        ]:
            with self.subTest(value=value):
                self.mapping[key] = value
                with self.assertRaises(ValueError):
                    self.index()
                del self.mapping[key]

    def test_no_duplicate_or_wildcard_addresses(self):
        for alias in ["oak.example:25565","*.oak.example"]:
            self.mapping["aliases"]=[alias]
            with self.assertRaises(ValueError):
                self.index()

    def test_proxy_joins_are_separate_from_direct_addresses(self):
        self.mapping["quick_joins"].append(dict(name="FFA", server="ffa-01"))
        row = self.index()
        self.assertEqual(row["proxyJoins"], [dict(name="FFA", server="ffa-01")])
        self.assertEqual(len(row["quickJoins"]), 1)
        for invalid in ("server ffa-01", "/op player", "ffa\nhelp", ""):
            self.mapping["quick_joins"][1]["server"] = invalid
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
        for section,key in [("modules","zoom"),("modules","server_media"),("modules","social_wheel"),("options","zoom.scroll"),("options","hit_range.highlight"),("options","freelook.toggle"),("options","shield_status.ready"),("options","fullbright.active"),("options","fullbright.use_keybind")]:
            with self.subTest(key=key):
                self.mapping["policy"] = {"version":1,"modules":{},section:{key:False}}
                with self.assertRaises(ValueError):
                    self.index()

    def test_supported_mod_rules(self):
        allowed = ["shield_status", "hit_range", "stretched_res", "fly_speed",
                   "fullbright", "freelook", "health_indicator"]
        rules = dict.fromkeys(allowed, False)
        self.mapping["policy"] = {"version": 1, "modules": rules}
        self.assertEqual(self.index()["policy"]["modules"], rules)

    def test_legacy_asset_is_also_checked(self):
        Image.new("RGBA",(32,32)).save(self.folder/"icon@2x.png")
        (self.folder/"icon.png").write_bytes(b"not an image")
        with self.assertRaises(ValueError):
            self.index()

if __name__=="__main__":
    unittest.main()

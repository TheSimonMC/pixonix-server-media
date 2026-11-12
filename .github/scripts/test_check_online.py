import unittest
from check_online import changed_endpoints, check_reply


class StatusTests(unittest.TestCase):
    def test_only_submitted_mappings_and_public_destinations(self):
        unchanged = {"id": "other", "addresses": ["other.example"]}
        row = {"id": "oak", "addresses": ["oak.example", "join.oak.example:25570"],
               "quickJoins": [{"address": "oak.example"}, {"address": "ffa.oak.example"}],
               "proxyJoins": [{"server": "duels-01"}]}
        self.assertEqual(changed_endpoints({"servers": [unchanged]}, {"servers": [row, unchanged]}),
                         ["ffa.oak.example", "join.oak.example:25570", "oak.example"])
        self.assertEqual(changed_endpoints({"servers": [row]}, {"servers": []}), [])

    def test_requires_java_status(self):
        self.assertEqual(check_reply({"online": True, "version": {"protocol": 777}}), 777)
        for bad in ([], {}, {"online": False}, {"online": True}, {"online": True, "version": {"protocol": True}}):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                check_reply(bad)

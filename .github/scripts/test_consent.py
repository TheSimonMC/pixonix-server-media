import unittest
from check_consent import accepted, DECLARATION


class ConsentTest(unittest.TestCase):
    def test_checked(self):
        self.assertTrue(accepted("Introduction\r\n- [X] " + DECLARATION + "\r\n"))

    def test_missing_or_quoted(self):
        line = "- [x] " + DECLARATION
        for body in (None, "- [ ] " + DECLARATION, "> " + line, "<!--\n" + line + "\n-->", "```md\n" + line + "\n```"):
            with self.subTest(body=body):
                self.assertFalse(accepted(body))

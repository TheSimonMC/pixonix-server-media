"""Check the contributor's declaration in the GitHub pull request event."""
import json
import os
import re
from pathlib import Path

DECLARATION = "I agree to the mapping submission terms and have permission to publish these files."
CHECKED = re.compile(r"^- \[[xX]\] " + re.escape(DECLARATION) + r"[ \t]*$")


def accepted(body):
    # Ignore examples and hidden checkboxes pasted into a PR description.
    visible = re.sub(r"<!--.*?(?:-->|$)", "", body or "", flags=re.S)
    fence = None
    for line in visible.splitlines():
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})", line)
        if marker:
            token = marker[1]
            if fence is None:
                fence = token
            elif token.startswith(fence) and not line[marker.end():].strip():
                fence = None
        elif fence is None and CHECKED.fullmatch(line):
            return True
    return False


if __name__ == "__main__":
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
    if not accepted(event["pull_request"]["body"]):
        raise SystemExit("Check the submission terms box in your pull request description.")

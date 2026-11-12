"""Verify public Minecraft Java endpoints in submitted mappings."""
import argparse
import json
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import HTTPRedirectHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


def changed_endpoints(before, after):
    previous = {row["id"]: row for row in before["servers"]}
    addresses = set()
    for row in after["servers"]:
        if row != previous.get(row["id"]):
            addresses.update(row["addresses"])
            addresses.update(mode["address"] for mode in row.get("quickJoins", []))
    return sorted(addresses)


def check_reply(reply):
    if not isinstance(reply, dict) or type(reply.get("online")) is not bool:
        raise ValueError("incomplete status response")
    if not reply["online"]:
        raise ValueError("no Minecraft Java status reply; check the hostname, port and server availability")
    version = reply.get("version")
    if not isinstance(version, dict) or type(version.get("protocol")) is not int:
        raise ValueError("missing Minecraft Java protocol version")
    return version["protocol"]


def probe(address):
    # The runner contacts only the public status service, including for fork submissions.
    url = "https://api.mcstatus.io/v2/status/java/" + quote(address, safe=":") + "?query=false&timeout=8"
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "Pixonix-Mapping-Checks/1"})
    opener = build_opener(NoRedirect())
    for attempt in range(3):
        try:
            with opener.open(request, timeout=20) as response:
                payload = response.read(2_000_001)
            if len(payload) > 2_000_000:
                raise ValueError("status response too large")
            return check_reply(json.loads(payload))
        except HTTPError as error:
            if error.code != 429 and error.code < 500:
                raise ValueError(f"status service returned HTTP {error.code}") from error
            failure = f"status service returned HTTP {error.code}"
        except (URLError, TimeoutError, OSError) as error:
            failure = f"could not reach the status service ({error})"
        if attempt < 2:
            time.sleep(2 ** (attempt + 1))
    raise ValueError(f"{failure}; retry this check")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("previous", type=Path)
    parser.add_argument("candidate", type=Path)
    args = parser.parse_args()
    endpoints = changed_endpoints(json.loads(args.previous.read_bytes()), json.loads(args.candidate.read_bytes()))
    failed = False
    for address in endpoints:
        try:
            print(f"{address}: Minecraft Java protocol {probe(address)}", flush=True)
        except ValueError as error:
            print(f"{address}: {error}", flush=True)
            failed = True
        time.sleep(0.25)
    if failed:
        raise SystemExit(1)
    print(f"Verified {len(endpoints)} public Java endpoints.")


if __name__ == "__main__":
    main()

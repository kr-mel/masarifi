#!/usr/bin/env python3
"""Build & deploy مصاريفي in one command (token-efficient: no inline python needed).

Re-encodes decoded_app.js into the base64 `_all` bundle inside مصاريفي.html,
bumps the service-worker cache version, verifies the round-trip, and optionally
commits + pushes.

Usage:
    python build.py                 # re-encode + bump SW cache (no git)
    python build.py "commit message"   # also: git add + commit + push to main
"""
import base64, re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).parent
HTML = ROOT / "مصاريفي.html"
JS   = ROOT / "decoded_app.js"
SW   = ROOT / "service-worker.js"

START = 'var _all="'
END   = '";(function(){function b(s)'

def main():
    js  = JS.read_bytes()
    b64 = base64.b64encode(js).decode("ascii")

    html = HTML.read_text(encoding="utf-8")
    i = html.find(START)
    assert i != -1, "could not find `var _all=` in HTML"
    i += len(START)
    j = html.find(END, i)
    assert j != -1, "could not find end of _all bundle"
    html = html[:i] + b64 + html[j:]
    assert base64.b64decode(b64) == js, "round-trip mismatch!"
    HTML.write_text(html, encoding="utf-8", newline="")

    sw = SW.read_text(encoding="utf-8")
    m = re.search(r"masarifi-v(\d+)", sw)
    ver = int(m.group(1)) + 1
    sw = re.sub(r"masarifi-v\d+", f"masarifi-v{ver}", sw)
    SW.write_text(sw, encoding="utf-8", newline="")

    print(f"[build] OK  bundle={len(b64)//1024}KB  cache=masarifi-v{ver}")

    if len(sys.argv) > 1:
        msg = sys.argv[1] + "\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
        subprocess.run(["git", "add", "مصاريفي.html", "service-worker.js"], cwd=ROOT, check=True)
        subprocess.run(["git", "commit", "-q", "-m", msg], cwd=ROOT, check=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=ROOT, check=True)
        print(f"[deploy] pushed: {sys.argv[1]}")

if __name__ == "__main__":
    main()

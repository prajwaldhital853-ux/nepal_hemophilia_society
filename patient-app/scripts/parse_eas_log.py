import json
import subprocess
import sys
import urllib.request

build_id = sys.argv[1] if len(sys.argv) > 1 else "2b782723-7a53-416e-9496-3484708cf8d4"
raw = subprocess.check_output(
    ["npm", "exec", "--package=eas-cli@24.6.0", "--", "eas", "build:view", build_id, "--json"],
    text=True,
    errors="ignore",
)
data = json.loads(raw[raw.find("{") :])
url = data["logFiles"][0]
text = urllib.request.urlopen(url).read().decode("utf-8", "ignore")
for line in text.splitlines():
    if not any(k in line.lower() for k in ("failed", "error", "exception", "what went wrong")):
        continue
    try:
        obj = json.loads(line)
    except json.JSONDecodeError:
        continue
    msg = obj.get("msg", "")
    if msg:
        print(msg[:800])

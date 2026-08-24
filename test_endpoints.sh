cat << 'EOF' > /tmp/test_ollama.py
import urllib.request
import json
import os

endpoints = [
    "http://127.0.0.1:11434/api/tags",
    "http://localhost:11434/api/tags",
    "http://host.docker.internal:11434/api/tags",
]

# Read resolv.conf
try:
    with open('/etc/resolv.conf') as f:
        for line in f:
            if 'nameserver' in line:
                ip = line.split()[1]
                endpoints.append(f"http://{ip}:11434/api/tags")
except:
    pass

for ep in endpoints:
    try:
        req = urllib.request.urlopen(ep, timeout=2)
        print(f"SUCCESS: {ep} -> {req.status}")
    except Exception as e:
        print(f"FAILED: {ep} -> {e}")
EOF
python3 /tmp/test_ollama.py

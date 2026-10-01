#!/usr/bin/env python3
"""Lance les recherches listées dans run.json (utilisé par GitHub Actions). Aucun envoi."""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = json.loads((HERE / "run.json").read_text(encoding="utf-8"))
for job in spec["jobs"]:
    cmd = [sys.executable, str(HERE / "prospect.py"), "--country", job["country"], "--city", job["city"],
           "--sector", job["sector"], "--limit", str(job.get("limit", 30)), "--mode", spec.get("mode", "both"),
           "--min-score", str(spec.get("min_score", 65)), "--send-email", "false"]
    print("\n$", " ".join(cmd[1:]), flush=True)
    subprocess.run(cmd, check=False)

#!/bin/bash
# quick smoke test: start each backend, curl endpoints, kill.
cd "$(dirname "$0")"
for name in "$@"; do
  cwd=$(node -e "console.log(require('./backend-defs.json')['$name'].cwd)")
  cmd=$(node -e "console.log(require('./backend-defs.json')['$name'].cmd)")
  port=$(node -e "console.log(require('./backend-defs.json')['$name'].port)")
  (cd "$cwd" && PORT=$port setsid bash -c "$cmd" > /tmp/smoke-$name.log 2>&1 &)
  ok=""
  for i in $(seq 1 100); do
    if curl -s -m 1 "http://127.0.0.1:$port/api/rows" | head -c 20 | grep -q '"id"'; then ok=1; break; fi
    sleep 0.3
  done
  sse=$(curl -s -m 1 -N "http://127.0.0.1:$port/api/events" | head -c 30)
  post=$(curl -s -m 2 -X POST "http://127.0.0.1:$port/api/action" -H 'content-type: application/json' -d '{}' | head -c 40)
  echo "$name rows=${ok:-FAIL} sse=${sse:0:12} post=$post"
  fuser -k -s $port/tcp 2>/dev/null
  sleep 0.5
done

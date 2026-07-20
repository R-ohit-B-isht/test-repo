#!/bin/bash
# usage: build-frontends.sh name1 name2 ...
cd "$(dirname "$0")/../frontends"
mkdir -p ../results
for n in "$@"; do
  (
    cd "$n" || exit 1
    npm install --silent --no-audit --no-fund > install.log 2>&1
    S=$(date +%s.%N)
    npm run build --silent > build.log 2>&1
    RC=$?
    E=$(date +%s.%N)
    echo "{\"name\":\"$n\",\"build_ok\":$([ $RC -eq 0 ] && echo true || echo false),\"build_s\":$(echo "$E - $S" | bc)}" > ../../results/build-$n.json
  ) &
done
wait
echo done

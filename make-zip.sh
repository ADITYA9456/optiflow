#!/usr/bin/env bash
#
# make-zip.sh — build a clean, portable zip of OptiFlow (run this on the Mac).
#
# It EXCLUDES node_modules, .next, and .git because those contain
# machine-specific native binaries (the Mac build of Next.js SWC and
# Tailwind's lightningcss). Those are exactly what break on Windows.
# The target machine rebuilds them with `npm install`.
#
# Usage:  bash make-zip.sh
# Output: OptiFlow.zip  (in the parent folder)

set -euo pipefail
cd "$(dirname "$0")"

OUT="../OptiFlow.zip"
rm -f "$OUT"

zip -r "$OUT" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x ".DS_Store" \
  -x "*/.DS_Store" \
  -x "*.log"

echo ""
echo "Created $(cd .. && pwd)/OptiFlow.zip"
echo "Send THAT file. On the other machine: unzip, then run setup (see START-HERE.md)."

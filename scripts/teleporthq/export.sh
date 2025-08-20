#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TELEPORTHQ_TOKEN:-}" ]]; then
  echo "Skipping TeleportHQ export (TELEPORTHQ_TOKEN not set)."
  exit 0
fi

# Placeholder; replace with actual TeleportHQ CLI once configured.
echo "TeleportHQ export placeholder — implement your project-specific export here."


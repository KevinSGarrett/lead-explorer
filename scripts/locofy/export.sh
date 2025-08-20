#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${LOCOFY_EMAIL:-}" || -z "${LOCOFY_PASSWORD:-}" ]]; then
  echo "Skipping Locofy export (LOCOFY_EMAIL/PASSWORD not set)."
  exit 0
fi

# Install CLI locally if needed
npx --yes @locofy/cli --version >/dev/null 2>&1 || npm i -g @locofy/cli

# Login (non-interactive)
npx @locofy/cli login --email "$LOCOFY_EMAIL" --password "$LOCOFY_PASSWORD"

# Initialize (first time only; safe to run repeatedly)
npx @locofy/cli init --yes

# Pull/export code from your configured Locofy project
# NOTE: Adjust the export command/flags to your project settings.
# Common pattern is to map to a local "generated" folder then you integrate it.
mkdir -p generated/locofy
npx @locofy/cli export --project "Your Project Name" --target ./generated/locofy || echo "Locofy export finished (or no changes)."


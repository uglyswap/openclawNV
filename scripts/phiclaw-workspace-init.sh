#!/usr/bin/env bash
#
# phiclaw-workspace-init.sh — Initialize the PhiClaw workspace with agent catalog
#
# This script generates the PHICLAW-AGENTS.md file in the workspace directory,
# listing all available PhiClaw agents organized by division with
# orchestration instructions embedded in the system prompt.
#
# This file is SEPARATE from the user's AGENTS.md to avoid overwriting
# custom workspace protocols. Both files are loaded into the system prompt.
#
# Run this at container boot AFTER the standard OpenClaw workspace setup.
# It ALWAYS regenerates PHICLAW-AGENTS.md to ensure the catalog reflects the
# current set of agent files (may have been updated by phiclaw auto-updater).
#
# Usage: ./scripts/phiclaw-workspace-init.sh [workspace-dir]
#
set -euo pipefail

WORKSPACE_DIR="${1:-${HOME}/.openclaw/workspace}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[phiclaw-init] Initializing PhiClaw workspace at ${WORKSPACE_DIR}..."

# Ensure workspace directory exists
mkdir -p "$WORKSPACE_DIR"

# Generate the PHICLAW-AGENTS.md with full agent catalog + orchestration protocol
# This is a SEPARATE file from AGENTS.md to avoid overwriting user customizations
if command -v node >/dev/null 2>&1; then
    node "${SCRIPT_DIR}/generate-agents-catalog.cjs" "${WORKSPACE_DIR}/PHICLAW-AGENTS.md"
    echo "[phiclaw-init] ✅ PHICLAW-AGENTS.md generated with agent catalog + orchestration protocol"
else
    echo "[phiclaw-init] ⚠️  Node.js not available, skipping PHICLAW-AGENTS.md generation"
fi

echo "[phiclaw-init] ✅ PhiClaw workspace initialization complete"

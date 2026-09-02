#!/usr/bin/env bash
# AI Hub dev environment: one tmux session, one window per role.
# Usage: ./scripts/tmux-aihub.sh   (re-attaches if the session already exists)
set -euo pipefail
SESSION=aihub
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  exec tmux attach -t "$SESSION"
fi

# 1: dev — main Claude Code session (backend/mobile work)
tmux new-session -d -s "$SESSION" -n dev -c "$ROOT"
tmux send-keys -t "$SESSION:dev" 'claude' Enter

# 2: po — separate Claude Code session for the PO role.
#    Inside: "use the po agent" or /new-ticket <idea>. Needs Atlassian MCP (see below).
tmux new-window -t "$SESSION" -n po -c "$ROOT"
tmux send-keys -t "$SESSION:po" 'claude' Enter

# 3: run — local backend + Postgres
tmux new-window -t "$SESSION" -n run -c "$ROOT/deploy"
tmux send-keys -t "$SESSION:run" 'docker compose up' # not executed: press Enter when compose exists

# 4: git — free shell for status/log/PR review
tmux new-window -t "$SESSION" -n git -c "$ROOT"

tmux select-window -t "$SESSION:dev"
exec tmux attach -t "$SESSION"

# One-time MCP setup for the po window (run once per machine):
#   claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp
# then authenticate via /mcp inside the session.

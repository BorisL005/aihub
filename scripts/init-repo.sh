#!/usr/bin/env bash
# AI Hub repo initialisation: protected main, PR-only flow, optional gitflow.
# Usage:            ./scripts/init-repo.sh [github-repo-name]
# Gitflow variant:  GITFLOW=1 ./scripts/init-repo.sh
# Bot-account gate: set BOT_REVIEWS=1 once the aihub-bot machine account exists
#                   (agents open PRs as the bot; required approvals then really bite).
set -euo pipefail
REPO_NAME="${1:-aihub}"
GITFLOW="${GITFLOW:-1}"
BOT_REVIEWS="${BOT_REVIEWS:-0}"

cd "$(dirname "$0")/.."

if [ ! -d .git ]; then
  git init -b master
  cat > .gitignore << 'GI'
.env*
node_modules/
build/
.gradle/
*.iml
.DS_Store
deploy/secrets/
GI
  git add -A
  git commit -m "chore: scaffold, agent roles, design baseline (KAN-5)"
fi

if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh repo view "$REPO_NAME" >/dev/null 2>&1 || gh repo create "$REPO_NAME" --private --source=. --push
  git push -u origin master || true
  OWNER=$(gh api user -q .login)

  REQUIRED_APPROVALS=0
  [ "$BOT_REVIEWS" = "1" ] && REQUIRED_APPROVALS=1

  protect () {
    gh api -X PUT "repos/$OWNER/$REPO_NAME/branches/$1/protection" \
      --input - << JSON
{
  "required_status_checks": { "strict": true, "contexts": ["build-and-test"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": $REQUIRED_APPROVALS,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
  }
  protect master

  if [ "$GITFLOW" = "1" ]; then
    git branch develop 2>/dev/null || true
    git push -u origin develop
    protect develop
    gh api -X PATCH "repos/$OWNER/$REPO_NAME" -f default_branch=develop
    echo "gitflow: develop is the default; features branch from develop, release PRs into master."
  fi

  # production deploy gate: owner approval required
  gh api -X PUT "repos/$OWNER/$REPO_NAME/environments/production" \
    --input - << JSON
{ "reviewers": [ { "type": "User", "id": $(gh api user -q .id) } ] }
JSON
  echo "Done. main protected, PR-only, production environment gated on $OWNER."
else
  echo "gh not authenticated - local git initialised only. Run 'gh auth login' and re-run."
fi

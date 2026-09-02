Implement Jira ticket $ARGUMENTS end to end as the dev role:
1. Read the ticket via Atlassian MCP. It must be in Ready for Dev - if not, stop and say why. Read ARCHITECTURE.md and the relevant skills (.claude/skills/) before writing anything.
2. Verify identity: `gh auth status` must show trshbxacc-dev active - if not, stop and tell the owner.
3. Branch KAN-<n>-short-slug from up-to-date develop. Implement strictly within the ticket's scope; anything in Out of scope is forbidden even if trivial.
4. Tests per acceptance criteria - every AC gets a named test, AC-S included. Run what is cheap locally (compile, unit); Testcontainers runs belong to CI.
5. Open a PR to develop with the template fully filled: every AC mapped to its test name. Push, confirm build-and-test starts (`gh run watch`).
6. Move the ticket to In Review with a comment linking the PR. Then stop - review, QA, and merge are other roles. Never merge, never approve, never touch master.

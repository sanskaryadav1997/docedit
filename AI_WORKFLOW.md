# AI Workflow Notes

## Tools Used
- **Claude** (Anthropic): Architecture planning, code generation, debugging
- **GitHub Copilot**: Inline completions during implementation

## Where AI Sped Up Work
- Scaffolding Prisma schema and Express route boilerplate (~30 min saved)
- TipTap editor configuration and menu bar component (~20 min saved)
- Tailwind styling for dashboard and editor layouts (~15 min saved)
- Writing test boilerplate

## What I Changed or Rejected
- Rejected AI suggestion to use localStorage instead of SQLite (persistence requirement)
- Modified generated share modal to include proper error handling and loading states
- Rewrote auth middleware to properly type Express request extensions
- Fixed AI-generated Prisma queries that didn't include proper relation loading

## How I Verified Correctness
- Manually tested all CRUD flows in browser
- Tested sharing between two seeded accounts
- Verified persistence survives page refresh
- Ran automated API tests
- Checked rich-text formatting round-trips (save → reload → verify)

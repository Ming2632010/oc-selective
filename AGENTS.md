# Agent guidelines

## Testing & demonstrations

- Do not create screen recordings to demonstrate changes. Use command output, logs, and (only when necessary) screenshots as evidence instead.

## Development environment

- The Cloud Agent environment is configured in `.cursor/` (`environment.json`, `install.sh`, `start.sh`) and provisions a local PostgreSQL — no external database is required.
- Local dev config lives in `.env.local` (created by `.cursor/install.sh`). AI scoring is optional: without `OPENAI_API_KEY` the app uses heuristic fallback scoring.
- Common commands: `npm run dev` (dev server on port 3000), `npm run db:seed-writing` (seed writing prompts).

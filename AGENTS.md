# AgentGuard

## Cursor Cloud specific instructions

This is a single-package TypeScript/Node.js project (not a monorepo). No databases, Docker, or external services are required.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` (root) then `cd skills/agentguard/scripts && npm install` |
| Build | `npm run build` (runs `tsc`) |
| Dev (watch) | `npm run dev` (runs `tsc -w`) |
| Type check | `npx tsc --noEmit` |
| Test | `npm test` (requires build first — tests run from `dist/tests/*.test.js`) |
| MCP server | `npm start` (stdio-based MCP server at `dist/mcp-server.js`) |

### Non-obvious caveats

- **Tests require a build first.** The test runner executes compiled JS from `dist/tests/`, so always run `npm run build` before `npm test` if source has changed.
- **No dedicated lint command.** Use `npx tsc --noEmit` for type checking; there is no ESLint config in this project.
- **CLI scripts package** at `skills/agentguard/scripts/` depends on the root package via `file:../../..`. It must be installed after the root package is built.
- **Scanner API** expects a `ScanPayload` object (not a bare path): `{ skill: { name, version }, payload: { type: 'dir', ref: 'file://./path' } }`.
- **Action API** uses `action.data` (not `action.params`): `{ action: { type: 'exec_command', data: { command: '...' } }, actor: { skill: '...' }, context: { platform: '...' } }`.
- **MCP server** communicates over stdio (JSON-RPC). Pipe JSON to `node dist/mcp-server.js` for testing.
- **GoPlus API keys** (`GOPLUS_API_KEY`, `GOPLUS_API_SECRET`) are optional; only needed for Web3 simulation features.

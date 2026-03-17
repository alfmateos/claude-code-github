# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (unit tests in src/lib/__tests__/)
npm run db:reset     # Drop and recreate the SQLite database
```

Single test: `npx vitest run src/lib/__tests__/<file>.test.ts`

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without it the app falls back to a `MockLanguageModel` that streams a static response — useful for UI development without API costs.

## Architecture

UIGen is an AI-powered React component generator with a live in-browser preview. Users describe a component in chat; Claude edits a virtual file system via tool calls; a client-side JSX-to-iframe pipeline renders the result instantly.

### Request Flow

1. User sends a message → `ChatProvider` (`src/lib/contexts/chat-context.tsx`) calls `useChat` (Vercel AI SDK)
2. POST `/api/chat` (`src/app/api/chat/route.ts`) streams responses from Claude with two tools:
   - `str_replace_editor` — create/view/insert/replace in files (`src/lib/tools/str-replace.ts`)
   - `file_manager` — rename/delete files (`src/lib/tools/file-manager.ts`)
3. Tool call results stream back to the client and are intercepted by `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`), which applies them to the in-memory virtual FS
4. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) detects FS changes and re-runs the JSX transformer
5. The transformer (`src/lib/transform/jsx-transformer.ts`) uses Babel standalone to transpile JSX → ES modules, creates blob URLs per file, builds an import map (React/ReactDOM from esm.sh, third-party packages from esm.sh CDN, local files as blob URLs), and loads everything in a sandboxed iframe

### Key Abstractions

**Virtual File System** (`src/lib/file-system.ts`): An in-memory Map-based tree with create/read/update/delete/rename/list operations. Serializes to `Record<path, FileNode>` for DB persistence. All edits happen in memory — no disk I/O.

**Provider pattern** (`src/lib/provider.ts`): Returns either the real Anthropic model or a `MockLanguageModel` depending on whether `ANTHROPIC_API_KEY` is set.

**System prompt** (`src/lib/prompts/generation.tsx`): Instructs Claude to produce self-contained React + Tailwind components with `/App.jsx` as the entry point. Understand this file when changing generation behavior.

**Anonymous vs. authenticated users**: Anonymous sessions use `anon-work-tracker.ts` to track ephemeral project IDs in a cookie. Authenticated users get JWT sessions (7-day, httpOnly cookie via `src/lib/auth.ts`) and their projects persist in SQLite via Prisma.

### Data Model (SQLite via Prisma)

- `User`: email + bcrypt-hashed password
- `Project`: `messages` (JSON string of chat history), `data` (JSON string of serialized file system), optional `userId`

Prisma client is generated into `src/generated/` (not `node_modules`).

### UI Layout

Three-panel layout managed in `src/app/main-content.tsx`:
- **Left**: `ChatInterface` (streaming chat, message history)
- **Right top**: Tab bar switching between Preview and Code views
- **Right**: `PreviewFrame` (sandboxed iframe) or `CodeEditor` (Monaco) + file tree

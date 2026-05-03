# Copilot Instructions

## Project Overview

This is a **browser-based Python code editor** that runs Python entirely in the browser using [Pyodide](https://pyodide.org/) (WebAssembly). It is a static single-page application deployed to GitHub Pages. There is no backend server.

Key features:
- Write and run Python code in an [Ace](https://ace.c9.io/) editor
- Provide standard input and see stdout/stderr output
- Interrupt long-running code with a SIGINT signal (via `SharedArrayBuffer`)
- Format code using `black` + `isort` (run inside Pyodide via `micropip`) and copy to clipboard
- Code is persisted in `localStorage` across sessions
- Load/save `.py` files from/to disk

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript (ES2024, `"module": "esnext"`) | All source code |
| Vite | Dev server & bundler |
| Ace editor (`ace-builds`) | In-browser code editor with Python syntax highlighting |
| Pyodide | Python runtime in the browser (via Web Workers) |
| pnpm (v10) | Package manager |
| Biome | Linter + formatter (replaces ESLint + Prettier) |
| Lefthook | Git hooks (pre-commit runs Biome) |

## Repository Structure

```
.
├── index.html              # App entry point (lang="ja")
├── src/
│   ├── main.ts             # App entry; wires textarea-path keyboard shortcut (Ctrl/Cmd+Enter)
│   ├── editor.ts           # Ace editor setup, theme switching, keyboard shortcuts
│   ├── python.ts           # run() and formatAndCopy() — high-level UI actions
│   ├── workerApi.ts        # Worker message protocol; runAsync(), interrupt(), formatAsync()
│   ├── runWorker.ts        # Web Worker: loads Pyodide, executes Python, handles interrupt
│   ├── formatWorker.ts     # Web Worker: loads Pyodide, installs black+isort, formats code
│   ├── elements.ts         # DOM element refs + type-guard helpers (isButton, isTextArea, isP)
│   ├── config.ts           # Constants: PYODIDE_INDEX_URL, CODE_LOCALSTORAGE_KEY
│   ├── main.py             # Template Python code loaded into editor on "new file"
│   └── style.css           # App styles
├── public/
│   └── enable-threads.js   # Sets COOP/COEP headers via Service Worker (required for SharedArrayBuffer)
├── biome.json              # Biome config (linter + formatter)
├── lefthook.yml            # Pre-commit hook: auto-format staged files with Biome
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config (sets COOP/COEP headers for dev server)
└── .github/workflows/
    ├── deploy.yml          # Deploy to GitHub Pages on push to main
    └── pull_request.yml    # Run Biome CI check on all pushes and PRs
```

## Development Commands

```bash
pnpm i                  # Install dependencies
pnpm lefthook install   # Install git hooks (run once after cloning)
pnpm dev                # Start dev server (with COOP/COEP headers required for SharedArrayBuffer)
pnpm build              # Type-check (tsc) + build for production
pnpm preview            # Preview production build locally
pnpm check              # Lint and format check (Biome)
pnpm check:write        # Lint and format, auto-fixing issues (Biome)
```

**There are no tests** in this project. CI only runs `biome ci .` (lint + format check).

## Code Style & Conventions

Enforced by **Biome** (`biome.json`):
- **Double quotes** for strings in TypeScript/JavaScript
- **No semicolons** (ASI)
- **Space indentation** (2 spaces)
- **Imports automatically organized** (Biome assist)

TypeScript conventions (`tsconfig.json`):
- Target: `ES2024`; lib: `ES2024`, `DOM`
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `noUnusedLocals` and `noUnusedParameters` are enabled — remove unused symbols
- `erasableSyntaxOnly`: avoid TypeScript-specific emit-generating syntax (e.g., `const enum`)
- Module resolution: `bundler` (Vite)

DOM element access pattern (see `elements.ts`):
- Get elements with `document.getElementById()` and export them
- Always validate with the exported type guards (`isButton`, `isTextArea`, `isP`) before use

Worker communication pattern (see `workerApi.ts`):
- Each request gets a `crypto.randomUUID()` id
- Response listener checks the id and resolves a `Promise.withResolvers()` promise
- Worker message types use discriminated unions with a `type` field

Keyboard shortcuts in `editor.ts` always define **both** `win: "Ctrl-*"` and `mac: "Command-*"` bindings.

## Architecture Notes

### Python Execution
- Python runs in a dedicated **Web Worker** (`runWorker.ts`) to avoid blocking the UI
- Interrupt is implemented using `SharedArrayBuffer` + `Uint8Array` — setting `interruptBuffer[0] = 2` sends SIGINT to Pyodide
- `SharedArrayBuffer` requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers — these are set both in `vite.config.ts` (dev) and in `public/enable-threads.js` (production via Service Worker)
- Pyodide automatically loads packages from imports via `loadPackagesFromImports()` before running code

### Code Formatting
- Formatting runs in a separate **Web Worker** (`formatWorker.ts`)
- Uses `black` + `isort` installed at runtime via Pyodide's `micropip` (first-use is slow)
- After formatting, the result is written back into the Ace editor and also copied to the clipboard

### Editor Persistence
- Code is saved to `localStorage` on every edit (key: `"code"` from `config.ts`)
- `src/main.py` is bundled as a raw string (Vite `?raw` import) and used as the template for "new file"

## CI/CD

- **`pull_request.yml`**: Runs `biome ci .` on every push and PR. Must pass before merging.
- **`deploy.yml`**: Builds and deploys to **GitHub Pages** on every push to `main`.

Always run `pnpm check` (or `pnpm check:write` to auto-fix) before pushing. The pre-commit Lefthook also does this automatically on staged `.ts/.json` etc. files.

## Known Errors & Workarounds

- **`SharedArrayBuffer` not available**: If the page is served without `COOP`/`COEP` headers, `SharedArrayBuffer` will be `undefined` and interrupts will not work. The `enable-threads.js` Service Worker is the workaround for GitHub Pages (which does not let you set custom headers).
- **Pyodide package install on format**: The first call to "Format & Copy" installs `black` and `isort` via `micropip` inside the Web Worker, which takes several seconds. Subsequent calls reuse the already-loaded worker and are faster.

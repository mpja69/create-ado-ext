# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`create-ado-ext` is an npm scaffolding CLI (like `npm create vite`) that generates boilerplate for **Azure DevOps browser extensions written in Elm**. Running `create-ado-ext <folder>` prompts for extension metadata and copies `templates/default/` into the target folder, replacing `__PLACEHOLDER__` tokens throughout all text files.

## Generator commands

```bash
npm link          # install the CLI locally as `create-ado-ext`
create-ado-ext <folder>   # run the generator
```

There are no tests. There is no build step for the generator itself — `src/cli.mjs` runs directly via Node.

## Template commands (run inside a generated project)

```bash
npm install
npm run dev       # development build (NODE_ENV=development, Elm debug mode on)
npm run build     # production build (minified)
npm run zip       # production build + zip dist/ for browser store upload
npm run release   # generate release notes, update changelog, then zip
npm run bump:patch / bump:minor / bump:major   # bump version in package.json
```

The build pipeline (`scripts/build.mjs`) does, in order:
1. Generates `dist/infrastructure/version.ts` from `package.json`
2. Generates `dist/manifest.json` from `scripts/templates/manifest.template.json`
3. Copies `public/` into `dist/`
4. Bundles `src/ts/content.ts` and `src/ts/app.ts` via esbuild (with `esbuild-plugin-elm` to compile Elm inline)
5. Builds Tailwind CSS from `src/styles.css`

## Architecture

### Generator (`src/`)

- `src/cli.mjs` — entry point: reads argv, prompts user, copies template, replaces tokens
- `src/lib/copy.mjs` — recursive directory copy
- `src/lib/replace.mjs` — walks all text files in a directory and does string replacement for every token
- `src/lib/prompts.mjs` — thin readline wrapper

Token replacement covers `.json .js .mjs .ts .html .css .elm .md .txt .yml .yaml` files.

### Generated extension (`templates/default/`)

The extension is a **Chrome MV3** extension targeting `https://dev.azure.com/*`. It has two independent JS bundles:

#### `content.ts` — content script

Runs on every ADO page. Responsibilities:
- Injects a toggle button into ADO's `.region-header-menubar`
- Mounts/unmounts a full-screen overlay `<div>` containing an `<iframe>` (via `infrastructure/mount.ts`)
- Acts as the **fetch bridge**: receives `adoFetch` postMessages from the iframe, performs `fetch()` with `credentials: "include"`, and replies with `adoFetchResult`

#### `app.ts` — overlay app (runs inside the iframe)

Responsibilities:
- Waits for the `adoExt:init` postMessage from the content script to receive `{ token, org, project }`
- Calls `setBridgeToken()` so all `adoFetch()` calls are authenticated
- Loads the shared team catalog (`infrastructure/catalog.ts`)
- Mounts the Elm app and wires all Elm ports via feature modules
- Sends `app.ports.appReady` to signal Elm that data requests can start (avoids race conditions)

### The ADO fetch bridge

Iframes cannot make credentialed ADO REST API calls because cookies don't follow cross-origin iframes. The bridge solves this:

```
Elm port → app.ts → bridge.ts (postMessage "adoFetch") → content.ts → fetch(credentials:"include") → ADO API
                                                       ← postMessage "adoFetchResult" ←
```

A random `__BRIDGE_TOKEN__` (generated per project at scaffold time) is embedded in both `content.ts` and `app.ts` to authenticate messages and prevent collisions between multiple extensions.

`infrastructure/http.ts` wraps the bridge with session-expiry detection: if ADO returns a sign-in HTML page instead of JSON, a module-level fuse (`sessionExpired = true`) short-circuits all subsequent requests immediately.

### Elm ↔ TypeScript port protocol

Elm ports are wired in `src/ts/modules/*/index.ts` files. The pattern:

- **Pull model for data**: Elm sends `requestTeamCatalog ()`, TS responds via `receiveTeamCatalog { teams, favorites }`
- **Push model for selections**: Elm sends `selectedTeamChanged teamId`, TS persists to `chrome.storage.local`
- `appReady` port: TS fires this once all infrastructure is initialized; Elm only requests data after receiving it

### Infrastructure modules

| File | Purpose |
|---|---|
| `bridge.ts` | Message types + factory functions for both sides of the iframe↔content bridge |
| `http.ts` | `adoFetch()` + `safeJson()` with session-expiry fuse |
| `fetch.ts` | ADO REST API wrappers (teams, iterations, boards, work items, WIQL) |
| `catalog.ts` | In-memory cache of project teams, populated once at startup |
| `mount.ts` | Overlay DOM lifecycle (open/close/toggle, Escape key, backdrop click) |
| `types.ts` | Shared TypeScript types (`Iteration`, `BoardColumn`, `ProjectTeam`, `TeamConfig`) |
| `util.ts` | `chunk()` for batching, `fetchParentItemsMap()` for work item parent lookups |

### Elm structure

`Main.elm` is a `Browser.element` with a single `TeamSelector` child component. New features should be added as new controls under `src/elm/Controls/` and wired via ports in `src/ts/modules/`.

The `TeamSelector` update function returns `( Model, Maybe String )` — the `Maybe String` carries a selected team ID outward to `Main` when a selection occurs, avoiding a callback port per component.

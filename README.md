# DevDash

A complete developer dashboard for Windows. Manage projects, deploy to Vercel and Render, monitor uptime, track performance, run pipelines, collaborate with your team — all from one window.

![DevDash](build/icon.png)

## Highlights

- **27 tabs** covering every aspect of your dev workflow
- **Smart onboarding**: scan a parent folder, auto-detect frameworks, match existing deployments, import with one click
- **First-deploy flow**: create new Vercel projects and Render services from inside the app
- **One-click redeploy**: per-project or bulk across all deployments
- **CI/CD Pipelines**: visual pipeline builder with step types and execution simulation
- **AI Assistant**: project-aware chat with deploy log analysis and commit message generation
- **Team collaboration**: real-time sync via Supabase, activity feed, roles
- **Performance monitoring**: Lighthouse-style scores, Core Web Vitals, bundle size tracking
- **Incident management**: status flow, timeline, post-mortem, MTTR stats
- **Plugin system**: extensible with hooks (onDeploy, onCommit, onError)

## Features by Tab

### Core
| Tab | What it does |
| --- | --- |
| **Dashboard** | KPI cards, activity feed, deploy status breakdown, quick actions |
| **Projects** | Git status, framework detection, quick actions, tags, multi-select bulk operations |
| **Deploys** | Live deploy status from Vercel/Render, auto-poll, bulk redeploy |
| **Uptime** | HTTP checks, latency history, uptime %, status notifications |

### Monitoring
| Tab | What it does |
| --- | --- |
| **Performance** | Lighthouse scores, Core Web Vitals, bundle size trends, alert thresholds |
| **Incidents** | Create/track incidents, status timeline, post-mortem, status page generator |
| **Analytics** | Git heatmap, deploy frequency, project health scores, cost estimation |
| **Metrics** | Render CPU/memory, Vercel visitor/pageview sparklines |
| **DB Health** | Ping MongoDB and Postgres connections, auto-detect from env files |
| **Env Manager** | Centralized env vars, compare local vs cloud, sync, secret vault |
| **Time** | Time tracking per project |
| **Deps** | Dependency audit, outdated detection, bulk update |
| **Ports** | Dev server port monitoring |

### Build & Dev
| Tab | What it does |
| --- | --- |
| **Terminal** | Integrated terminal with command history, tab completion, multi-session |
| **Pipelines** | Visual CI/CD pipeline builder, step types, templates, run history |
| **AI Assistant** | Project-aware AI chat, deploy log analyzer, commit message generator |
| **Build Code** | Scaffold projects from templates with AI |
| **Zero to Live** | First-deploy wizard for new projects |
| **AI Code Gen** | AI-powered code generation |
| **Templates** | Template editor, testing, analytics |
| **Snippets** | Code snippet library |

### Collaboration & Platform
| Tab | What it does |
| --- | --- |
| **Team** | Supabase-powered real-time sync, members, activity feed, roles |
| **Chat** | Ollama LLM chat with streaming, markdown, syntax highlighting |
| **Mobile** | QR pairing, push notification settings, device management |
| **Plugins** | Plugin registry, install/uninstall, hook system, event log |
| **Automations** | Cron jobs for auto-pull, auto-deploy, scheduled tasks |
| **Settings** | API tokens, theme, export/import config, update checker |

## Install

### Grab the installer

1. Download `DevDash-Setup-1.0.0.exe` from the [Releases](https://github.com/ZafranYusof/devdash/releases) page.
2. Run the installer (NSIS, per-user, no admin needed).
3. Launch DevDash from the Start menu or desktop shortcut.

### From source

```powershell
git clone https://github.com/ZafranYusof/devdash.git
Set-Location devdash
npm install
npm run dev       # Vite + Electron with hot reload
npm run dist      # builds dist/DevDash-Setup-<version>.exe
```

Node 22+ recommended. The first `npm install` triggers `electron-builder install-app-deps` which rebuilds `better-sqlite3` for the Electron ABI.

## API token setup

Both tokens are optional. DevDash runs without them; you just lose live deploy status and auto-matching.

### Vercel

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens).
2. Create a token scoped to your projects.
3. Paste into Settings → Vercel API token (or in the onboarding wizard).

### Render

1. Go to [dashboard.render.com/u/settings#api-keys](https://dashboard.render.com/u/settings#api-keys).
2. Create an API key.
3. Paste into Settings → Render API token.

### Supabase (for Team features)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and anon key.
3. Paste into the Team tab setup screen.

### Ollama (for AI features)

1. Install [Ollama](https://ollama.com) and pull a model.
2. DevDash auto-connects to `localhost:11434`.
3. Or configure a custom endpoint in Settings.

## Storage

| Path | Contents |
| --- | --- |
| `%APPDATA%\devdash\config.json` | Projects, settings, automations, DB targets |
| `%APPDATA%\devdash\cache.db` | Deploys, uptime, time, screenshots, automation runs |
| `%APPDATA%\devdash\logs\` | Application logs |
| `%APPDATA%\devdash\screenshots\` | Project screenshots |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` | Command palette |
| `Ctrl+`` ` | Toggle activity log |
| `N` | New item (context-dependent) |
| `R` | Refresh current view |
| `/` | Focus search |
| `?` | Shortcuts overlay |
| `Esc` | Close modal/panel |

## Tech stack

- Electron 32 + TypeScript
- React 18 + Vite 5
- Tailwind CSS 3
- `simple-git` for git operations
- `better-sqlite3` for local cache
- `@supabase/supabase-js` for team collaboration
- `axios` for Vercel, Render, MongoDB, Postgres, Ollama APIs
- `node-cron` for scheduled jobs
- `mongodb` + `pg` for DB health pings
- `marked` + `DOMPurify` + `highlight.js` for markdown/code rendering
- `electron-builder` NSIS installer

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server + Electron with hot TS compile |
| `npm run build` | TS compile main + Vite build renderer |
| `npm run dist` | Full NSIS installer at `dist/DevDash-Setup-<version>.exe` |
| `npm run typecheck` | Strict type check main + renderer |
| `npm run rebuild` | Force rebuild native modules for Electron |

## File structure

```
devdash/
├─ electron/           # Main process (IPC, windows, APIs)
│  ├─ main.ts
│  ├─ preload.ts
│  ├─ config.ts
│  ├─ git.ts
│  ├─ deploys.ts
│  ├─ uptime.ts
│  ├─ automations.ts
│  ├─ dbhealth.ts
│  ├─ ollama.ts
│  ├─ scheduler.ts
│  ├─ cache.ts
│  └─ ...
├─ src/                # Renderer (React UI)
│  ├─ App.tsx
│  ├─ components/      # 40+ components
│  ├─ types.ts
│  └─ styles.css
├─ templates/          # Project scaffold templates
├─ scripts/
└─ build/
```

## License

MIT © Vexccz

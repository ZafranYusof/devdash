## DevDash v1.1.0

25 polish improvements across UX, visuals, data sync, power user features, and AI enhancements.

### UX Improvements
- **Tab pinning** - right-click sidebar items to pin, pinned section at top
- **Breadcrumb navigation** - clickable path below topbar (Home > Tab > SubView)
- **Sidebar collapse** - smooth animation, icons-only mode, persisted state
- **Drag-and-drop tab reorder** - custom sidebar order, stored in localStorage

### Visual Polish
- **Page transitions** - fade + slide-up animation on tab switch (150ms)
- **Shimmer loading** - animated gradient skeleton states (ShimmerCard, ShimmerList, ShimmerGrid)
- **Toast queue** - max 3 visible, rest queued, newest promoted on dismiss
- **Card micro-interactions** - hover lift, accent glow, press scale

### Data and Sync
- **Auto-backup** - export to file/GitHub Gist, import, auto-backup every 5min
- **Cross-device sync** - Supabase sync with per-data-type toggles, conflict resolution
- **Webhook receiver** - event log, source filtering, auto-create incidents from errors
- **Deploy log streaming** - progressive log viewer with search, copy, auto-scroll

### Power User
- **Split view** (Ctrl+\) - two tabs side by side, draggable divider
- **Custom dashboard widgets** - add/remove/reorder KPI cards, persisted layout
- **Macro recorder** - record, save, replay, edit action sequences
- **CLI companion** - documentation for CLI commands in Settings
- **Vim keyboard navigation** - j/k/h/l/Enter/g g/G/q bindings with mode indicator

### AI Enhancements
- **Deploy error summaries** - AI or pattern-match analysis on failed deploys
- **Why did this fail?** - modal with error context, common causes, retry button
- **AI changelogs** - auto-generate from commit messages, grouped by date/type
- **Smart notifications** - priority scoring, focus mode, mute rules, daily digest

### Stats
- 14 new components added
- 2,238 lines of new code
- Zero new dependencies
- Build: 3.4s clean

## Install
Download DevDash-Setup-1.1.0.exe below.

<h1 align="center">💼 Steam Inventory Value</h1>

<p align="center">
  <b>Vencord plugin that puts CS2 inventory values, trade buttons, and Steam profile links directly on Discord profile popouts.</b>
  <br/>
  <sub>Prices via CSFloat, Skinport, or live Steam Market · Cross-plugin trade URL sharing via a Cloudflare Worker · Rich embeds for <code>/inventory</code> and <code>/csinv</code>.</sub>
</p>

<p align="center">
  <a href="https://github.com/VisaHolder/steam-inventory-value/actions"><img alt="Build" src="https://img.shields.io/badge/build-passing-23a55a?style=flat-square"/></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-5865f2?style=flat-square"/></a>
  <a href="https://github.com/Vendicated/Vencord"><img alt="Vencord" src="https://img.shields.io/badge/vencord-dev%20build-5865f2?style=flat-square"/></a>
  <a href="https://vsi-share.reap-dev.workers.dev/health"><img alt="Worker" src="https://img.shields.io/badge/vsi--share-online-23a55a?style=flat-square"/></a>
</p>

---

## What it does

- **CS2 Inventory card** on every profile popout — total value, delta since last check, top 5 items, source badge, refresh spinner.
- **Trade Offer + Steam Profile buttons** — five themes, matches Discord's button language, opens the URL in a new tab.
- **`/inventory`** — Discord user picker OR any Steam profile ref. Ephemeral rich embed by default, or public markdown if you want the whole channel to see.
- **`/csinv <ref>`** — same as above but typed as free text, no `steam:` label prefix. Handled by a message pre-send interceptor.
- **Bio auto-detect** — anyone with a trade URL in their Discord "About Me" gets a Trade button on their popout automatically, no coordination needed.
- **Cross-plugin sharing** — opt-in publish of your trade URL to `vsi-share`. Friends running the plugin see your Trade button on your popout without you touching your bio.
- **Snapshot history** — last 20 runs persisted per SteamID via Vencord's DataStore. Powers the green/red delta chip and the "STALE" tag.
- **Untradeable filter** — service medals, coins, badges are counted separately, not padded into the "missing from feed" list.

---

## Install

Requires the **[Vencord dev build](https://docs.vencord.dev/installing/)** (the installer version can't load loose plugins). Node 18+ and pnpm.

```powershell
# 1. Clone Vencord and this repo
cd $env:USERPROFILE\Desktop
git clone https://github.com/Vendicated/Vencord.git
git clone https://github.com/VisaHolder/steam-inventory-value.git
cd Vencord
pnpm install

# 2. Drop the plugin into src/userplugins
mkdir src\userplugins\SteamInventoryValue
copy ..\steam-inventory-value\plugin\index.tsx src\userplugins\SteamInventoryValue\
copy ..\steam-inventory-value\plugin\native.ts src\userplugins\SteamInventoryValue\

# 3. Build + inject
pnpm build
pnpm inject      # pick your Discord install (Stable / PTB / Canary)
```

Restart Discord fully (tray → **Quit Discord**, not just close), then **User Settings → Vencord → Plugins → SteamInventoryValue** → toggle on and paste your trade URL.

<details>
<summary>Bash/Linux install</summary>

```bash
cd ~/Desktop
git clone https://github.com/Vendicated/Vencord.git
git clone https://github.com/VisaHolder/steam-inventory-value.git
cd Vencord
pnpm install

mkdir -p src/userplugins/SteamInventoryValue
cp ../steam-inventory-value/plugin/*.ts* src/userplugins/SteamInventoryValue/

pnpm build
pnpm inject
```
</details>

---

## Commands

| Command | Example | Notes |
|---|---|---|
| `/inventory user:<@user>` | `/inventory user:@friend` | Uses their linked Discord → Steam connection |
| `/inventory steam:<ref>` | `/inventory steam:76561197961109817` | Steam URL / vanity / SteamID64 / trade URL |
| `/csinv <ref>` | `/csinv VACaroni` | Same as `/inventory steam:` but no label prefix, intercepted before Discord sends |

### Steam reference formats accepted

| Input                                                                       | Resolved via                       |
| --------------------------------------------------------------------------- | ---------------------------------- |
| `76561197961109817`                                                         | Used directly (SteamID64)          |
| `VACaroni`                                                                  | Vanity → `steamcommunity.com/id/<name>/?xml=1` |
| `https://steamcommunity.com/id/VACaroni`                                    | Vanity URL                         |
| `https://steamcommunity.com/profiles/76561197961109817`                     | Profile URL                        |
| `https://steamcommunity.com/tradeoffer/new/?partner=1149562692&token=xxx`   | Partner ID + Steam epoch → SteamID64 |

### Sample output

Ephemeral rich embed (default) — appears in Discord as:

```
┌ (green bar) ────────────────────────────┐
│ reap. · CS2 Inventory                   │
│                                         │
│  $301.73  +$0.11                        │
│                                         │
│  Priced    Unique    Source             │
│  25/25     25        CSFloat            │
│                                         │
│  Top items                              │
│  $198.00  ★ Paracord Doppler (FN)       │
│   $28.58  ST M4A4 In Living Color (BS)  │
│   $23.00  Souv AWP Pink DDPAT (BS)      │
│   $10.15  B Squadron Officer SAS        │
│    $7.99  ST Desert Eagle Blue Ply (FN) │
│                                         │
│  CSFloat · 1s · 10 untradeable · 4:31PM │
└─────────────────────────────────────────┘
Only you can see this · Dismiss message
```

Public post (when **Post Publicly** is on) — plain markdown that everyone in the channel sees, since Discord blocks user-authored embeds:

```markdown
### 💼 reap. — CS2 Inventory
# $301.73 `+$0.11`
-# CSFloat · 25/25 priced · 25 unique · 10 untradeable · 1s

**Top items**
`$198.00`  ★ Paracord Doppler (FN)
` $28.58`  ST M4A4 In Living Color (BS)
` $23.00`  Souv AWP Pink DDPAT (BS)
` $10.15`  B Squadron Officer SAS
`  $7.99`  ST Deagle Blue Ply (FN)
```

---

## Profile popout

When a popout opens for anyone with visible Steam / a trade URL in their bio / a cloud share entry:

- **Send Trade Offer** button (blurple/green/steam gradient/dark/auto — picks your theme)
- **Steam Profile** button (opens their Steam profile in a browser)
- **CS2 Inventory card** below, showing the cached snapshot value + delta + top 5 items + source + timestamp
- **Refresh ↻** icon in the card header — click to re-fetch prices live, spinner runs during the fetch

Priority order for foreign users' trade URLs: **vsi-share cloud → Discord bio scrape → Discord Steam connection** (Steam profile fallback only).

---

## Settings

Grouped into six labeled sections inside the plugin page.

### 👤 Your Profile
| Setting | Default | What it does |
|---|---|---|
| Trade URL | *(empty)* | Your Steam trade offer URL. What the Trade button opens. |
| Button Theme | Blurple | Blurple / Green / Steam Blue / Dark / Auto |
| Show On Own Profile | On | Show Trade + Steam row on your own popout |
| Show Inventory On Profile | On | Show CS2 Inventory card on popouts (yours + friends') |

### ☁️ Sharing
| Setting | Default | What it does |
|---|---|---|
| Share Via Cloud | **On** | Publish your trade URL / Steam profile to `vsi-share` so friends with the plugin see them |
| Share Trade URL | On | Include your Trade URL in what you publish |
| Share Steam Profile | On | Include your Steam profile link |
| Share Worker URL | *(empty)* | Advanced: self-hosted worker URL override |

### 💰 Prices
| Setting | Default | What it does |
|---|---|---|
| Price Source | CSFloat | CSFloat (bulk, ~300ms), Skinport (bulk), or Live Steam Market (slow) |
| Currency | USD | USD, GBP, EUR, CHF, RUB, PLN, BRL, SGD |
| Skinport Price Kind | Suggested | Only when source = Skinport. Suggested / Min / Median / Mean |
| Use Live Steam Fallback | Off | Fill items missing from bulk feeds via live Steam per-item |

### 📊 Inventory Card
| Setting | Default | What it does |
|---|---|---|
| Show Price Change | On | Green/red delta chip when the total moves between runs |
| Show Item Count | Off | Add "X items" to the card meta line |
| Delta Min Age (min) | 60 | Ignore snapshots newer than this when computing delta |
| Snapshot Staleness (h) | 24 | Mark card STALE if snapshot is older than N hours (0 = never) |

### 💬 Chat & Commands
| Setting | Default | What it does |
|---|---|---|
| Post Publicly | Off | On: `/inventory` sends real markdown to the channel. Off: rich embed only you see. |

### ⚙️ Advanced
| Setting | Default | What it does |
|---|---|---|
| Price Cache Minutes | 60 | How long to keep the bulk price feed in memory before refetching |
| Request Delay Ms | 1600 | Live Steam Market only — delay between per-item requests |

---

## Cross-plugin sharing (`vsi-share` Worker)

Opt-in Cloudflare Worker + KV that lets plugin users see each other's trade URLs and Steam profiles on Discord popouts without pasting anything in a Discord bio.

**Default hosted instance:** `https://vsi-share.reap-dev.workers.dev`
Set your own instance in **Share Worker URL** if you want to self-host.

### Endpoints

| Method | Path | Body / Response |
|---|---|---|
| `GET`    | `/health`            | `{ ok, service, endpoints }` |
| `GET`    | `/profile/:discordId`| `{ found, discord_id, trade_url?, steam_id?, updated_at }` (only fields the user opted into) |
| `POST`   | `/profile`           | `{ discord_id, share_trade, share_steam, trade_url?, steam_id?, share_inventory?, inventory? }` → `{ ok }` |
| `DELETE` | `/profile/:discordId`| `{ ok }` (removes an entry) |

No auth on writes for MVP — trust model is "the plugin only writes to the current user's own key". If we see abuse, we'll add Discord OAuth verification.

### Self-hosting the Worker

```bash
cd worker
npm i -g wrangler
wrangler login

wrangler kv namespace create PROFILES    # paste the returned id into wrangler.toml
wrangler deploy
```

Then set **Share Worker URL** in plugin settings to your worker URL.

Free-tier limits: 100k KV reads/day + 1k writes/day → wildly more than you'll ever hit for personal use.

---

## How it works

- **Prices** — CSFloat's `listings/price-list` bulk feed (`min_price` in cents), or Skinport's `/v1/items` (USD/GBP/EUR), or live `market/priceoverview` per item. All routed through Vencord's native (Electron main-process) helper because Discord's CSP blocks `fetch()` to non-whitelisted hosts.
- **Steam IDs** — Discord's `/users/:id/profile` API for Discord users (checks `connected_accounts` for `type: steam`), Steam's public `?xml=1` endpoint for vanity → SteamID64 resolution.
- **Snapshots** — last 20 runs persisted per SteamID via Vencord's `DataStore` (IndexedDB-backed). Delta computed against the oldest snapshot older than `deltaMinAgeMinutes`.
- **Popout injection** — `MutationObserver` on `document.body`, targets Discord's stable `user-profile-popout` class, inserts before Game Collection / after View Full Bio / above Message input.
- **`/csinv` handling** — a Vencord `MessagePreSendListener` catches the raw text before Discord sends it, extracts the ref, runs the pipeline, and returns `{cancel: true}` so the raw text never posts.
- **Reactive settings** — `settings.use()` hook in the About component means the CTA card disappears the instant you paste a URL, and a `useEffect` triggers an immediate publish. Background poll every 15s catches any missed changes.

---

## Screenshots

*Add screenshots to `docs/` and reference them here.*

```
docs/
├── profile-card.png
├── inventory-embed.png
├── settings-panel.png
└── trade-buttons.png
```

---

## Submitting to Vencord's official plugin list

If you want this bundled with Vencord itself so users don't need the userplugin folder step:

1. **Fork** [Vendicated/Vencord](https://github.com/Vendicated/Vencord)
2. **Move** `plugin/index.tsx` and `plugin/native.ts` to `src/plugins/steamInventoryValue/` in your fork
3. **Read** [`CONTRIBUTING.md`](https://github.com/Vendicated/Vencord/blob/main/CONTRIBUTING.md) — Vencord has specific code-style rules (no `any`, license header on every file, etc.)
4. **Add** the license header at the top of both files:
   ```ts
   /*
    * Vencord, a Discord client mod
    * Copyright (c) 2026 VisaHolder
    * SPDX-License-Identifier: GPL-3.0-or-later
    */
   ```
5. **Format** with `pnpm lint --fix` and check `pnpm test`
6. **PR** to the `dev` branch, not `main`. Include a short demo GIF and reference this repo.
7. **Wait** — Vencord's maintainers review at their own pace. Expect back-and-forth on code style.

The cross-plugin sharing (Cloudflare Worker) would need to either become opt-in with a clear disclosure, or be gated behind a config toggle Vencord's team approves. Bio auto-detection and the `/inventory` command are fine as-is.

---

## Contributing

Issues and PRs welcome. Keep the code style consistent (no comments explaining what obvious code does, no AI-generated fluff, conventional-commits style). Test in the Vencord dev build before opening a PR.

---

## License

MIT — see [LICENSE](LICENSE).

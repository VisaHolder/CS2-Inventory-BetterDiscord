# steam-inventory-value

Vencord plugin that adds a CS2 inventory card + Trade / Steam buttons to any Discord user's profile popout, plus a `/inventory` and `/csinv` slash command for pricing any Steam profile.

Prices come from CSFloat's bulk feed (~26k items, ~300 ms first hit, instant on cache), Skinport (USD/GBP/EUR), or live Steam Market per-item as a slow-but-fresh fallback.

An optional Cloudflare Worker (`vsi-share`) lets users share their trade URL / Steam profile so other plugin users see them on the popout, without pasting anything in their bio.

## Features

- **`/inventory user:@friend`** — CS2 inventory value for any Discord user with linked Steam
- **`/inventory steam:VACaroni`** — or a SteamID64 / vanity / Steam profile URL / trade URL
- **`/csinv <ref>`** — same as above but typed without the `steam:` label prefix, intercepted before send
- **Profile popout card** — clean box under Trade / Steam buttons showing total, delta since last snapshot, top 5 items, timestamp, source
- **Refresh button** — click ↻ on any card to re-price live, spinner runs during fetch
- **Snapshot delta** — 📈 green / 📉 red arrows on the embed color bar based on price change since your last check
- **Untradeable filter** — service medals, coins, badges are counted separately, not padded into the "missing" list
- **postPublicly toggle** — ephemeral rich embed by default, or post a clean markdown result publicly
- **Bio auto-detect** — if a friend pastes their trade URL in their Discord About Me, the Trade button auto-appears on their popout (no plugin needed on their end)
- **vsi-share cloud** — opt-in cross-plugin sharing so trade URLs / Steam profile links published from settings show up on your popout for others

## Install (plugin)

Requires the Vencord dev build (the installer version can't load loose `.tsx` files).

```powershell
# 1. Prereqs
node -v      # 18+
npm i -g pnpm

# 2. Clone Vencord
cd $env:USERPROFILE\Desktop
git clone https://github.com/Vendicated/Vencord.git
cd Vencord
pnpm install

# 3. Drop this plugin in
git clone https://github.com/VisaHolder/steam-inventory-value.git ..\steam-inventory-value
mkdir src\userplugins\SteamInventoryValue
copy ..\steam-inventory-value\plugin\index.tsx src\userplugins\SteamInventoryValue\
copy ..\steam-inventory-value\plugin\native.ts src\userplugins\SteamInventoryValue\

# 4. Build + inject
pnpm build
pnpm inject     # pick your Discord install
```

Restart Discord, then **User Settings → Vencord → Plugins → SteamInventoryValue** → toggle on and configure.

## Settings

| Setting                     | Default         | Description |
| --------------------------- | --------------- | ----------- |
| **Trade URL**               | *(empty)*       | Your Steam trade offer URL — shows as a button on your own profile |
| **Button Theme**            | Discord Blurple | Blurple / Green / Steam / Dark / Match Discord Theme |
| **Show On Own Profile**     | On              | Show the Trade button on your own popout |
| **Price Source**            | CSFloat         | CSFloat / Skinport / Live Steam Market |
| **Use Live Steam Fallback** | Off             | Bulk mode: fill items missing from the feed via live Steam per-item |
| **Skinport Price Kind**     | Suggested price | Only relevant when source = Skinport |
| **Currency**                | 1 (USD)         | 1=USD, 2=GBP, 3=EUR, 5=CHF, 6=RUB, 7=PLN, 8=BRL, 24=SGD |
| **Delay MS**                | 1600            | Live Steam: delay between requests, bump to 2500 if you 429 |
| **Cache Minutes**           | 60              | How long to cache the bulk price feed in memory |
| **Show Inventory On Profile** | On            | Show the CS2 inventory card on profile popouts |
| **Show Price Change**       | On              | Show `+/-` delta since previous snapshot |
| **Show Item Count**         | Off             | Also show item count on the profile card |
| **Delta Min Age (min)**     | 60              | Ignore snapshots newer than this many minutes when computing delta |
| **Snapshot Staleness (h)**  | 24              | Add a `STALE` tag on the profile card if last snapshot is older than N hours |
| **Post Publicly**           | Off             | If on, `/inventory` posts a real message with markdown; off = ephemeral embed |
| **Share Via Cloud**         | Off             | Publish your trade URL / Steam profile to `vsi-share` so other plugin users see them on your popout |
| **Share Trade URL**         | On              | When cloud share is on: include your trade URL |
| **Share Steam Profile**     | On              | When cloud share is on: include your Steam profile |
| **Share Worker URL**        | *(blank)*       | Override the default vsi-share endpoint (leave blank for the hosted default) |

## Commands

- **`/inventory user:@friend`** — Discord user picker; uses their linked Steam
- **`/inventory steam:<ref>`** — Steam profile URL, vanity name, SteamID64, or trade URL
- **`/csinv <ref>`** — same as `/inventory steam:` but no label prefix (intercepted by a message-pre-send listener)

`<ref>` can be:

| Input                                                                       | Resolved via                       |
| --------------------------------------------------------------------------- | ---------------------------------- |
| `76561197961109817`                                                         | Used directly (SteamID64)          |
| `VACaroni`                                                                  | Vanity → `steamcommunity.com/id/<name>/?xml=1` |
| `https://steamcommunity.com/id/VACaroni`                                    | Vanity URL                         |
| `https://steamcommunity.com/profiles/76561197961109817`                     | Profile URL                        |
| `https://steamcommunity.com/tradeoffer/new/?partner=1149562692&token=xxx`   | Partner ID + Steam epoch → SteamID64 |

## Worker (optional — for cross-plugin sharing)

A default hosted instance is baked in (`https://vsi-share.reap-dev.workers.dev`). To run your own:

```powershell
cd worker
npm i -g wrangler
wrangler login

# Create a KV namespace and paste the ID into wrangler.toml
wrangler kv namespace create PROFILES

# Deploy
wrangler deploy
```

Then set **Share Worker URL** in plugin settings to your worker's URL.

### Endpoints

```
GET  /profile/:discordId    → { found, discord_id, trade_url?, steam_id?, updated_at }
POST /profile               → { ok } — publish/update (see body schema in src/index.ts)
DELETE /profile/:discordId  → { ok } — user removes their own entry
GET  /health                → { ok, service, endpoints }
```

Only fields the user opted into sharing (`share_trade`, `share_steam`) are exposed on GET. No auth on writes for MVP — trust model is "the plugin only writes to the current user's own key".

## How it works

- **Prices**: CSFloat's `listings/price-list` bulk feed (`min_price` in cents), or Skinport's `/v1/items` (USD/GBP/EUR), or live `market/priceoverview` per item. All routed through Vencord's native (Electron main-process) helper because Discord's CSP blocks `fetch` to non-whitelisted hosts.
- **Steam IDs**: Discord's `/users/:id/profile` API for Discord users (checks `connected_accounts` for type `steam`); Steam's public `?xml=1` endpoint for vanity → SteamID64 resolution.
- **Snapshots**: last 20 runs persisted per SteamID via Vencord's `DataStore` (IndexedDB). Delta is computed against the oldest snapshot older than `deltaMinAgeMinutes`.
- **Popout injection**: `MutationObserver` on `document.body`; targets Discord's `user-profile-popout` class (stable) and inserts before Game Collection / after View Full Bio / before Message input.

## Notes

- Discord blocks user-authored embeds. `postPublicly=true` falls back to markdown (headings + monospace-aligned prices). Only ephemeral posts render as embeds.
- The default hosted vsi-share worker has no auth on writes. If you don't trust the hosted instance, self-host with your own KV.
- Steam Market's per-item endpoint is rate-limited at ~20 requests/minute per IP. Live mode paces at 1.6s between calls to stay safe.

## License

MIT — see [LICENSE](LICENSE).

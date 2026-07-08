# SteamInventoryValue

See anyone's CS2 inventory value right on their Discord profile — real Doppler phase pricing (Ruby / Sapphire / Black Pearl / Phase 1-4), live prices in your currency, and a Send Trade Offer / Steam button.

---

## Install (2 minutes)

**1. Get BetterDiscord** (skip if you already have it)
Download and run the installer — https://betterdiscord.app

**2. Download the plugin**
Grab `SteamInventoryValue.plugin.js` from the [latest release](https://github.com/VisaHolder/steam-inventory-value/releases/latest).

**3. Drop it in your plugins folder**
In Discord: **Settings** (bottom-left) → scroll to **Plugins** → click **Open Plugins Folder** → drag the file in.

**4. Turn it on**
Back in **Settings → Plugins**, turn **SteamInventoryValue** on.

Done. Open anyone's profile (with a linked Steam) and their CS2 inventory value shows up.

---

## Optional — exact Doppler phase prices

Want a Ruby priced as a Ruby (not the generic Doppler price)?

1. Get a free CSFloat API key: csfloat.com → **Profile → Developer → API key**
2. In the Plugins list, click the gear next to **SteamInventoryValue** → paste it into **CSFloat API key**.

That is the only setting that ever needs a key — everything else works out of the box.

---

## What you get

- Full inventory value in your currency (CSFloat prices + live FX), with rarity-colored top items
- Doppler / Gamma Doppler phase pricing (with the optional key) — Ruby, Sapphire, Black Pearl, Emerald, Phase 1-4
- Real float + paint seed on every skin, for any public inventory (straight from Steam — no login or key)
- Click any card (or right-click a user) for a searchable, sortable, type-filterable breakdown of every item — thumbnails, float + seed, wear tags (FN→BS), rarity colors, StatTrak™ / Souvenir tags, custom name tags, and one click through to each item's Steam Market page
- Price history sparkline with all-time-high / low markers, a gain/loss delta chip, and a value-milestone badge ($1K / $5K / $10K …)
- "What changed" line showing items gained / dropped since last time
- Send Trade Offer + Steam Profile buttons on profiles
- Commands: `/inventory`, `/price <item>`, `/leaderboard` (add `here` for this server only), `/compare`
- Optional applied-sticker value toggle (off by default — applied stickers rarely resell for much)
- Shared cache: once anyone prices a profile it loads instantly for everyone else, and phase-accurate prices propagate even to people without a key
- 100% client-side. Only your public SteamID and inventory value are ever shared — no Discord identity, no accounts

---

## Build from source

```bash
cd betterdiscord
npm install
npm run build      # -> SteamInventoryValue.plugin.js
```

# SteamInventoryValue — BetterDiscord edition

CS2 inventory value on Discord profile popouts: full inventory pricing (CSFloat /
Skinport / live Steam Market), **Doppler & Gamma Doppler phase pricing** (Ruby /
Sapphire / Black Pearl / Phase 1–4 via a CSFloat API key), FX-converted prices, and
a **Send Trade Offer / Steam** button row.

## Install (drag & drop)

1. Install **BetterDiscord**: https://betterdiscord.app
2. Download **`SteamInventoryValue.plugin.js`** from this folder.
3. Drop it into your plugins folder:
   - Windows: `%AppData%\BetterDiscord\plugins\`
   - (Discord → Settings → Plugins → **Open Plugins Folder** opens it for you)
4. Discord → Settings → **Plugins** → toggle **SteamInventoryValue** on.
5. (Optional) Open its settings and paste a **CSFloat API key**
   (csfloat.com → Profile → Developer) to unlock Doppler/Gamma **phase pricing**.

That's it — open any profile with a linked Steam account and the CS2 inventory card
appears.

## Notes

- Everything runs client-side. Network calls go through `BdApi.Net.fetch` (CSP-free),
  hitting only Steam, CSFloat, Skinport, the ByMykel phase-data CDN, and an FX API.
- The CSFloat key is optional and stored locally in your BetterDiscord data.
- No slash commands in this edition (BetterDiscord has no slash-command API) — the
  profile card is the feature.

## Build from source

```
cd betterdiscord
npm install
npm run build      # → SteamInventoryValue.plugin.js
```

/*
 * vsi-share — Cloudflare Worker for cross-plugin sharing of Steam trade / profile data.
 *
 * Design:
 * - Storage: single KV namespace `PROFILES`, keyed by `p:<discordId>`.
 * - No auth on writes for MVP — trust model is "the plugin only writes to the current user's own key".
 *   If we see abuse, add Discord OAuth verification.
 * - Reads only expose fields the writer opted into sharing. Fields not marked `share_*: true` are stripped.
 * - Values capped at ~2KB.
 *
 * Endpoints:
 *   GET  /profile/:discordId    → { found, discord_id, trade_url?, steam_id?, inventory?, updated_at }
 *   POST /profile               → { ok } — body includes discord_id + share_* flags + data
 *   DELETE /profile/:discordId  → { ok } — user removes their entry
 *   GET  /health, /             → { ok, service }
 */

export interface Env {
    PROFILES: KVNamespace;
}

interface StoredProfile {
    discord_id: string;
    trade_url?: string;
    steam_id?: string;
    share_trade?: boolean;
    share_steam?: boolean;
    share_inventory?: boolean;
    inventory?: {
        total: number;
        top_items?: { name: string; price: number }[];
        item_count?: number;
        priced?: number;
        marketable_count?: number;
        unique_names?: number;
        ts: number;
        source: string;
        currency: number;
    };
    updated_at: number;
}

const CORS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
    });
}

const DISCORD_ID_RE = /^\d{15,25}$/;
const STEAM_ID_RE = /^7656\d{13}$/;
const TRADE_URL_RE = /^https?:\/\/(?:www\.)?steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+(?:&token=[A-Za-z0-9_-]+)?$/;

function sanitizeProfile(body: any): StoredProfile | { error: string } {
    if (!body || typeof body !== "object") return { error: "body must be JSON object" };
    if (typeof body.discord_id !== "string" || !DISCORD_ID_RE.test(body.discord_id)) return { error: "invalid discord_id" };

    const record: StoredProfile = {
        discord_id: body.discord_id,
        share_trade: !!body.share_trade,
        share_steam: !!body.share_steam,
        share_inventory: !!body.share_inventory,
        updated_at: Date.now(),
    };

    if (typeof body.trade_url === "string") {
        const t = body.trade_url.trim();
        if (t && !TRADE_URL_RE.test(t)) return { error: "trade_url must be a steamcommunity.com/tradeoffer/new/?partner=... URL" };
        if (t) record.trade_url = t.slice(0, 500);
    }

    if (typeof body.steam_id === "string" && STEAM_ID_RE.test(body.steam_id)) {
        record.steam_id = body.steam_id;
    }

    if (body.inventory && typeof body.inventory === "object") {
        const inv = body.inventory;
        record.inventory = {
            total: Number(inv.total) || 0,
            top_items: Array.isArray(inv.top_items)
                ? inv.top_items.slice(0, 5).map((i: any) => ({
                    name: String(i?.name ?? "").slice(0, 120),
                    price: Number(i?.price) || 0,
                })).filter(i => i.name)
                : undefined,
            item_count: Number(inv.item_count) || 0,
            priced: Number(inv.priced) || 0,
            marketable_count: Number(inv.marketable_count) || 0,
            unique_names: Number(inv.unique_names) || 0,
            ts: Number(inv.ts) || Date.now(),
            source: String(inv.source ?? "unknown").slice(0, 24),
            currency: Number(inv.currency) || 1,
        };
    }

    return record;
}

function stripPrivateFields(profile: StoredProfile) {
    const out: Record<string, unknown> = {
        found: true,
        discord_id: profile.discord_id,
        updated_at: profile.updated_at,
    };
    if (profile.share_trade && profile.trade_url) out.trade_url = profile.trade_url;
    if (profile.share_steam && profile.steam_id) out.steam_id = profile.steam_id;
    if (profile.share_inventory && profile.inventory) out.inventory = profile.inventory;
    return out;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

        const url = new URL(request.url);
        const parts = url.pathname.split("/").filter(Boolean);

        // GET /profile/:discordId
        if (parts[0] === "profile" && parts[1] && request.method === "GET") {
            if (!DISCORD_ID_RE.test(parts[1])) return json({ error: "invalid discord_id" }, 400);
            const data = await env.PROFILES.get(`p:${parts[1]}`, "json") as StoredProfile | null;
            if (!data) return json({ found: false }, 404);
            return json(stripPrivateFields(data));
        }

        // POST /profile
        if (parts[0] === "profile" && !parts[1] && request.method === "POST") {
            let body: any;
            try { body = await request.json(); } catch { return json({ error: "invalid JSON body" }, 400); }
            const sanitized = sanitizeProfile(body);
            if ("error" in sanitized) return json(sanitized, 400);
            await env.PROFILES.put(`p:${sanitized.discord_id}`, JSON.stringify(sanitized));
            return json({ ok: true });
        }

        // DELETE /profile/:discordId — user removes their own record
        if (parts[0] === "profile" && parts[1] && request.method === "DELETE") {
            if (!DISCORD_ID_RE.test(parts[1])) return json({ error: "invalid discord_id" }, 400);
            await env.PROFILES.delete(`p:${parts[1]}`);
            return json({ ok: true });
        }

        // Health / root
        if (parts[0] === "health" || url.pathname === "/") return json({ ok: true, service: "vsi-share", endpoints: ["GET /profile/:id", "POST /profile", "DELETE /profile/:id"] });

        return json({ error: "not found", path: url.pathname }, 404);
    },
};

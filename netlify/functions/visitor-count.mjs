// ── PRAJNA VISITOR COUNTER ──────────────────────────────────────────────────
// Real visitor count stored in Netlify Blobs.
// GET  /api/visitors        → { count }
// GET  /api/visitors?hit=1  → increments (new visitor), returns { count }
import { getStore } from "@netlify/blobs";

export default async (req) => {
    const store = getStore("visitors");
    const url = new URL(req.url);
    let count = Number(await store.get("count")) || 0;

    if (url.searchParams.get("hit") === "1") {
        count += 1;
        await store.set("count", String(count));
    }

    return new Response(JSON.stringify({ count }), {
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
        },
    });
};

export const config = { path: "/api/visitors" };

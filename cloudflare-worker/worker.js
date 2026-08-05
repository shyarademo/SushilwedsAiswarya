/**
 * Sushil & Aiswarya RSVP API — Cloudflare Worker + D1
 *
 * Endpoints:
 *   POST / or /rsvp   + header X-RSVP-Secret     → insert RSVP (duplicates allowed)
 *   GET  / or /rsvp   + header X-Admin-Password  → JSON list
 *   GET  /rsvp?format=csv + X-Admin-Password     → CSV download
 *
 * Hardening (free-tier):
 *   1. POST rate limit: 5 / 10 min / IP
 *   2. Admin auth-failure rate limit: 10 / 15 min / IP
 *   3. Body ≤ 8 KB; name ≤ 80; phone ≤ 20; message ≤ 500
 *   5. CORS locked to invite origins (+ localhost)
 *
 * Secrets (Worker Settings → Variables):
 *   RSVP_SECRET, ADMIN_PASSWORD
 * Binding:
 *   DB → D1 database wedding-rsvps
 */

const ALLOWED_ORIGINS = new Set([
  "https://sushilwedsaiswarya.onrender.com",
  "https://sushilwedsaiswarya.com",
  "https://www.sushilwedsaiswarya.com",
  "http://localhost:3000",
  "http://localhost:8743",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8743",
]);

const MAX_BODY_BYTES = 8 * 1024;
const MAX_NAME = 80;
const MAX_PHONE = 20;
const MAX_MESSAGE = 500;

const POST_LIMIT = 5;
const POST_WINDOW_MS = 10 * 60 * 1000;

const ADMIN_FAIL_LIMIT = 10;
const ADMIN_FAIL_WINDOW_MS = 15 * 60 * 1000;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const isRsvpPath = path === "/" || path === "/rsvp";

    if (!isRsvpPath) {
      return json({ ok: false, error: "Not found" }, 404, cors);
    }

    try {
      if (request.method === "POST") {
        return await handlePost(request, env, cors, ctx);
      }
      if (request.method === "GET") {
        return await handleGet(request, env, cors, url, ctx);
      }
      return json({ ok: false, error: "Method not allowed" }, 405, cors);
    } catch (err) {
      return json({ ok: false, error: "Server error" }, 500, cors);
    }
  },
};

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-RSVP-Secret, X-Admin-Password",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Best-effort free rate limit via Cache API (per colo).
 * Good enough to blunt casual spam without paid Rate Limiting / KV burn.
 */
async function consumeRateLimit(key, limit, windowMs, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(
    `https://rsvp-rate-limit.invalid/${encodeURIComponent(key)}`
  );

  const now = Date.now();
  let count = 0;
  let resetAt = now + windowMs;

  const hit = await cache.match(cacheKey);
  if (hit) {
    try {
      const data = await hit.json();
      if (data && typeof data.resetAt === "number" && data.resetAt > now) {
        count = Number(data.count) || 0;
        resetAt = data.resetAt;
      }
    } catch {
      /* start fresh */
    }
  }

  count += 1;
  const allowed = count <= limit;
  const ttlSec = Math.max(1, Math.ceil((resetAt - now) / 1000));

  const store = new Response(JSON.stringify({ count, resetAt }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `max-age=${ttlSec}`,
    },
  });

  // Keep the request moving even if cache write is slow.
  ctx.waitUntil(cache.put(cacheKey, store));

  return { allowed, count, resetAt };
}

async function handlePost(request, env, cors, ctx) {
  const ip = clientIp(request);
  const limited = await consumeRateLimit(
    `post:${ip}`,
    POST_LIMIT,
    POST_WINDOW_MS,
    ctx
  );
  if (!limited.allowed) {
    return json(
      { ok: false, error: "Too many RSVPs from this network. Please try later." },
      429,
      cors
    );
  }

  const secret = request.headers.get("X-RSVP-Secret") || "";
  if (!env.RSVP_SECRET || secret !== env.RSVP_SECRET) {
    return json({ ok: false, error: "Unauthorized" }, 401, cors);
  }

  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Payload too large" }, 413, cors);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Payload too large" }, 413, cors);
  }

  let body;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400, cors);
  }

  const full_name = String(body.full_name ?? "").trim();
  const phone = body.phone == null ? null : String(body.phone).trim();
  const attendance = String(body.attendance ?? "").trim();
  const side = String(body.side ?? "").trim();
  const message =
    body.message == null || body.message === ""
      ? null
      : String(body.message).trim();

  const attend_wedding =
    body.attend_wedding == null || body.attend_wedding === ""
      ? null
      : String(body.attend_wedding).trim();
  const attend_reception =
    body.attend_reception == null || body.attend_reception === ""
      ? null
      : String(body.attend_reception).trim();
  const attend_reception_bengaluru =
    body.attend_reception_bengaluru == null ||
    body.attend_reception_bengaluru === ""
      ? null
      : String(body.attend_reception_bengaluru).trim();

  let guest_count = null;
  if (body.guest_count != null && body.guest_count !== "") {
    const n = Number(body.guest_count);
    if (!Number.isFinite(n) || n < 1 || n > 40 || !Number.isInteger(n)) {
      return json(
        { ok: false, error: "Guest count must be a whole number from 1 to 40" },
        400,
        cors
      );
    }
    guest_count = n;
  }

  if (!full_name || !attendance || !side) {
    return json({ ok: false, error: "Missing required fields" }, 400, cors);
  }

  if (attendance === "yes" && guest_count == null) {
    return json({ ok: false, error: "Guest count is required" }, 400, cors);
  }

  if (full_name.length > MAX_NAME) {
    return json({ ok: false, error: "Name is too long" }, 400, cors);
  }
  if (phone && phone.length > MAX_PHONE) {
    return json({ ok: false, error: "Phone is too long" }, 400, cors);
  }
  if (message && message.length > MAX_MESSAGE) {
    return json({ ok: false, error: "Message is too long" }, 400, cors);
  }

  // Duplicates are intentionally allowed — always INSERT.
  // attend_reception = Kochi (13 Sept); attend_reception_bengaluru = Bengaluru (19 Sept)
  const result = await env.DB.prepare(
    `INSERT INTO rsvps
      (full_name, phone, attendance, guest_count, attend_wedding, attend_reception,
       attend_reception_bengaluru, side, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      full_name,
      phone || null,
      attendance,
      guest_count,
      attend_wedding,
      attend_reception,
      attend_reception_bengaluru,
      side,
      message
    )
    .run();

  return json(
    { ok: true, id: result?.meta?.last_row_id ?? null },
    200,
    cors
  );
}

async function handleGet(request, env, cors, url, ctx) {
  const ip = clientIp(request);

  const failLimited = await peekOrConsumeAdminFailLimit(ip, ctx, false);
  if (!failLimited.allowed) {
    return json(
      {
        ok: false,
        error: "Too many failed login attempts. Please try again later.",
      },
      429,
      cors
    );
  }

  const password = request.headers.get("X-Admin-Password") || "";
  if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
    await peekOrConsumeAdminFailLimit(ip, ctx, true);
    return json({ ok: false, error: "Unauthorized" }, 401, cors);
  }

  const asCsv = url.searchParams.get("format") === "csv";
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, full_name, phone, attendance, guest_count,
            attend_wedding, attend_reception, attend_reception_bengaluru,
            side, message
     FROM rsvps
     ORDER BY created_at DESC, id DESC`
  ).all();

  const rows = results || [];

  if (asCsv) {
    const header = [
      "id",
      "created_at",
      "full_name",
      "phone",
      "attendance",
      "guest_count",
      "attend_wedding",
      "attend_reception",
      "attend_reception_bengaluru",
      "side",
      "message",
    ];
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(header.map((key) => csvEscape(row[key])).join(","));
    }
    return new Response(lines.join("\n") + "\n", {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rsvps.csv"',
      },
    });
  }

  return json({ ok: true, count: rows.length, rows }, 200, cors);
}

/**
 * @param {boolean} consume  when true, increments the failure counter
 */
async function peekOrConsumeAdminFailLimit(ip, ctx, consume) {
  const cache = caches.default;
  const cacheKey = new Request(
    `https://rsvp-rate-limit.invalid/admin-fail:${encodeURIComponent(ip)}`
  );

  const now = Date.now();
  let count = 0;
  let resetAt = now + ADMIN_FAIL_WINDOW_MS;

  const hit = await cache.match(cacheKey);
  if (hit) {
    try {
      const data = await hit.json();
      if (data && typeof data.resetAt === "number" && data.resetAt > now) {
        count = Number(data.count) || 0;
        resetAt = data.resetAt;
      }
    } catch {
      /* fresh */
    }
  }

  if (!consume) {
    return { allowed: count < ADMIN_FAIL_LIMIT, count, resetAt };
  }

  count += 1;
  const ttlSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const store = new Response(JSON.stringify({ count, resetAt }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `max-age=${ttlSec}`,
    },
  });
  ctx.waitUntil(cache.put(cacheKey, store));

  return { allowed: count <= ADMIN_FAIL_LIMIT, count, resetAt };
}

function csvEscape(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

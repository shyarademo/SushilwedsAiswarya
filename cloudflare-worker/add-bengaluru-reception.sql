-- Run in Cloudflare Dashboard → D1 → wedding-rsvps → Console
-- Safe to run each statement once (ignore "duplicate column" if already added).

ALTER TABLE rsvps ADD COLUMN attend_reception_bengaluru TEXT;
ALTER TABLE rsvps ADD COLUMN guest_count INTEGER;

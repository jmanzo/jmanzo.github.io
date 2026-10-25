-- The unlock (plan step 4). Still no contact data here: it goes to Klaviyo
-- and to Jean's Telegram. Only when it happened and the country, to segment.
ALTER TABLE results ADD COLUMN unlocked_at INTEGER;  -- ms since epoch, null until unlocked
ALTER TABLE results ADD COLUMN country TEXT;         -- from the WhatsApp prefix (contacto.ts)
-- events.type gains 'unlocked' (worker/index.ts, unlock).

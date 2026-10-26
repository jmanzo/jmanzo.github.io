/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  // Secrets, set by scripts/setup-escaneo.sh (.dev.vars locally). Without
  // them the unlock still works and only skips that notice.
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  KLAVIYO_API_KEY?: string;
  KLAVIYO_LIST_ID?: string;
}

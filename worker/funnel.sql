-- Weekly Escaneo funnel, by channel (?c=). Last 7 days.
--   npx wrangler d1 execute escaneo --remote --file worker/funnel.sql
-- Each column counts sessions that reached that step. A drop between two
-- answer columns is the question where merchants abandon.
WITH s AS (
  SELECT session, MAX(channel) AS channel,
    MAX(type = 'view') AS viewed,
    MAX(type = 'answer' AND step = 'store') AS store,
    MAX(type = 'answer' AND step = 'orders') AS orders,
    MAX(type = 'answer' AND step = 'payments') AS payments,
    MAX(type = 'answer' AND step = 'hours') AS hours,
    MAX(type = 'completed') AS completed,
    MAX(type = 'click') AS clicked
  FROM events
  WHERE at > (unixepoch() - 7 * 86400) * 1000 AND session IS NOT NULL
  GROUP BY session
)
SELECT COALESCE(channel, 'sin canal') AS channel,
  SUM(viewed) AS visitas, SUM(store) AS iniciados, SUM(orders) AS pedidos,
  SUM(payments) AS pagos, SUM(hours) AS horas, SUM(completed) AS completados,
  SUM(clicked) AS clics_whatsapp
FROM s GROUP BY channel ORDER BY visitas DESC;

-- Completed Escaneos by segment: orders per day, how they get paid, platform.
SELECT orders, payments, platform, route, COUNT(*) AS escaneos,
  SUM(id IN (SELECT result_id FROM events WHERE type = 'click')) AS clics_whatsapp
FROM results
WHERE created_at > (unixepoch() - 7 * 86400) * 1000
GROUP BY orders, payments, platform, route
ORDER BY escaneos DESC;

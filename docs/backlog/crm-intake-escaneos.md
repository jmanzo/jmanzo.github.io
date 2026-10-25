# Ticket: Escaneos como prospect candidates en Outreach OS

**Estado:** backlog. Se activa cuando haya más de 5 Escaneos por día, o cuando M7 de `outreach-os` arranque, lo que pase primero.

**Repositorio destino:** `~/projects/outreach-os`. Mover este ticket allá cuando entre en un PRD.

## Contexto

En la versión 1, el lead magnet "¿Cuánto te cuesta operar a mano?" guarda cada Escaneo en Klaviyo y le envía un aviso a Jean, que crea el lead a mano con "Add prospect". Esto es así porque la regla #2 de `outreach-os` (una sola vía de escritura) prohíbe que un endpoint escriba datos de prospectos. Lo que viene de fuera de un humano entra como `prospect_candidate` y se promueve con un job (decisión D8, milestone M7).

## Alcance

- [ ] Adelantar de M7 lo mínimo: tabla `prospect_candidate`, tokens con alcance de workspace y el job `promote_candidates` (normalizar, deduplicar y revisar la lista de no contactar).
- [ ] Endpoint de intake autenticado con token, validado con Zod y con `idempotency_key` (por ejemplo, el ID del Escaneo).
- [ ] El Worker del sitio llama al endpoint al completarse un Escaneo con WhatsApp.
- [ ] Mapear al candidato: merchant, URL o @, país, pedidos por día, cómo le pagan, la Fuga calculada, los hallazgos y la fuente "Escaneo".
- [ ] En `/admin/jobs`: promover, fusionar o rechazar, con motivo.

## Criterio de hecho

Un Escaneo completado aparece como candidato en Outreach OS sin intervención de Jean. Promoverlo crea organización, contacto y lead sin duplicar a un contacto que ya existe. Repetir el mismo Escaneo no crea un segundo candidato.

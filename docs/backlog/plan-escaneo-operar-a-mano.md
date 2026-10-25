# Plan de arranque: Escaneo "¿Cuánto te cuesta operar a mano?"

Aprobado por Jean el 24/10/2026, en una sesión de grilling. Construcción pendiente: arranca por el paso 1. Este archivo es el punto de entrada; el diseño completo está en `lead-magnets.md` (misma carpeta) y los términos en `GLOSSARY.md` (raíz). Si este plan y `lead-magnets.md` dicen cosas distintas, gana `lead-magnets.md`.

## Objetivo

Convertir respuestas del outreach (Regla de 100) en dinero lo antes posible. Hasta el 10/10/2026 había 96 respuestas sobre 320 contactados, y ningún pago salió del outreach (los clientes que pagan llegaron por Upwork). Por segmento: DTC-LatAm por WhatsApp respondió 16 de 36 (44%), DTC-EN por LinkedIn 16 de 183 (9%). El lead magnet tiene que filtrar a los que solo quieren lo gratis y llevar al pago.

## Restricciones

- Sin presupuesto para pauta ni herramientas: solo planes gratis.
- Jean construye 2 horas al día. No preguntarle por tiempos: sacar una versión decente rápido, en incrementos que funcionen.
- No ofrecer nada que la IA reemplace fácil. Tesis: la información ya no vale; lo que vale es la evidencia en la tienda del merchant, más un humano que responde por el arreglo antes de una fecha límite.
- Copy en español neutro, sin preferencia visible por ningún país. Sin guiones largos.

## Decisiones aprobadas (resumen)

- **Ruta:** `/es/operar-a-mano/`. El resultado se abre en `?r=<id>`, con un ID aleatorio y sin datos personales en la URL.
- **Acepta cualquier plataforma:** Shopify, otras plataformas, o solo un @ de Instagram.
- **Dolor principal:** la operación manual. **Hallazgos automáticos desde la URL:** promos (versión ligera: precio tachado, barra de envío gratis, descuentos automáticos visibles), apps zombis y "Shopify va a apagar algo" (este último solo en Shopify).
- **Preguntas, ramificadas por cómo le pagan y nunca por país:**
  1. URL o @.
  2. País, en lista alfabética, solo para segmentar.
  3. Pedidos por día (menos de 5 / 5 a 9 / 10 a 24 / 25 a 49 / 50 o más). Esta es la que califica.
  4. Cómo le pagan sus clientes, con selección múltiple: contraentrega, transferencia o pago móvil con comprobante, tarjeta o pasarela, billetera o cripto.
  5. *Si elige contraentrega:* cómo confirma los pedidos, y cuántas horas al día se le van en eso.
  6. *Si elige contraentrega:* de cada 10 pedidos, cuántos se rechazan, y cuánto cuesta un envío que vuelve, en su moneda.
  7. *Si elige comprobantes:* cuántos revisa a mano al día.
  8. Cómo pasa los pedidos a la transportadora (a mano / Dropi u otra integración / no aplica).
  9. Si muestra precios en más de una moneda y, si dice que sí, cada cuánto los actualiza a mano.
  10. Desbloqueo: nombre, WhatsApp obligatorio, email opcional, y el checkbox de autorización de datos (Ley 1581).
- **Fuga:** se calcula solo con las respuestas del merchant, sin promedios de mercado. Horas al mes por proceso, más plata al mes (pedidos × % de rechazo × costo del envío que vuelve).
- **Visible al instante:** el titular de la Fuga y 1 hallazgo automático (el más grave).
- **Detrás del desbloqueo:** el desglose, todos los hallazgos, el plan de Arreglos y el CTA. Con 10 o más pedidos por día, el CTA abre el WhatsApp de Jean con el ID del resultado ("Quiero mi Comprobación"). Con menos, el plan llega por email desde Klaviyo. El precio nunca aparece en el resultado.
- **Comprobación (humana, después del Escaneo):** prueba del tiempo de respuesta del WhatsApp de ventas, más una demo con los productos y la marca del merchant.
- **Arreglo estrella:** "Contraentrega Confirmada: tus pedidos se confirman solos por WhatsApp en 7 días".
  - Precio: US$397 (50% al arrancar y 50% al entregar), más el plan mensual opcional.
  - Garantía: si en 30 días no se confirma automáticamente al menos el 80% de los pedidos, se devuelve el setup, y Jean sigue trabajando sin costo.
  - Las respuestas del Escaneo son la línea base del reporte de los 30 días.
- **Outreach:** primero se pide permiso. El primer mensaje es una pregunta sobre el Dolor principal que ofrece la calculadora, y el link va solo cuando el merchant dice que sí, sin precargar nada.
- **Carril en español mínimo:** `/es/` con 2 o 3 pruebas (Marlies Dekkers de 14 s a 6 s, Nuflorist, Duilify en la App Store), un "sobre mí" corto y `/es/privacidad/`. El header del carril solo enlaza a páginas en español.

## Arquitectura

- **Sitio:** Astro 6 estático, servido por un Worker de assets de Cloudflare (`wrangler.jsonc`). Se le suma un script de Worker (`main`) para las rutas `/api/*`; el resto sigue siendo assets.
- **El Worker:**
  - lee el HTML y `products.json` de la tienda del lado del servidor (por CORS) y saca los hallazgos, reutilizando la lógica de `~/business/CRO_LinkedIn_SN/workspace/regla100/scanner.js`;
  - guarda el perfil en Klaviyo con la API key privada como secret, con las respuestas y los hallazgos como propiedades;
  - avisa a Jean por un bot de Telegram (secrets: el token del bot y el chat ID).
- **Almacenamiento de resultados para `?r=<id>`:** KV o D1, en el plan gratis.
- **Medición:** Cloudflare Web Analytics: visita, iniciado, completado, desbloqueado y clic a WhatsApp.
- **CRM:** `~/projects/outreach-os` **no se toca**. Su regla #2 (una sola vía de escritura) prohíbe escribir leads desde un endpoint. En la versión 1, Jean crea el lead a mano con "Add prospect". El ticket para automatizarlo está en `crm-intake-escaneos.md`.
- **Correo:** los MX de `jeanmanzo.com` usan el reenvío de Namecheap. No tocarlos.

## Orden de construcción

Cada paso deja algo que funciona.

1. Estructura i18n de Astro y el carril `/es/`: inicio, sobre mí y privacidad.
2. El Escaneo: preguntas y cálculo de la Fuga en el navegador. Con esto ya sirve compartido por WhatsApp.
3. El Worker: lectura de la tienda y hallazgos automáticos.
4. Desbloqueo, Klaviyo y el aviso por Telegram. Antes, generar un wizard para lo que solo Jean puede hacer: crear el bot con @BotFather y sacar el chat ID, crear la lista y la API key privada en Klaviyo, y cargar los secrets en Cloudflare.
5. Plantillas del outreach y la integración con la Regla de 100. Esto toca las skills y `templates.py`, así que requiere la aprobación explícita de Jean.

## Fuera de alcance de esta versión

Están en la misma carpeta:

- `lead-magnets.md`: los otros 3 lead magnets (promos, apps zombis, Shopify apaga), procesos para versiones siguientes (proveedores, facturación, stock), pauta paga y la idea de Shopify para Venezuela.
- `sitio-en-espanol.md`: el sitio completo en español.
- `crm-intake-escaneos.md`: los Escaneos como prospect candidates en Outreach OS.

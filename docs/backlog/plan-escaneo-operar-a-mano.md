# Plan de arranque: Escaneo "¿Cuánto te cuesta operar a mano?"

Aprobado por Jean el 24/10/2026 y ajustado el 25/10/2026, en sesiones de grilling. Es un experimento Lean: el Escaneo es el instrumento que valida un producto de operación por WhatsApp antes de construirlo.

Este archivo es el punto de entrada para construir. El diseño completo, las hipótesis, la oferta y el criterio de validación están en `lead-magnets.md` (misma carpeta). Los términos están en `GLOSSARY.md` (raíz). Si este plan y `lead-magnets.md` dicen cosas distintas, gana `lead-magnets.md`.

## Objetivo

El Escaneo filtra a los que solo quieren lo gratis y lleva a la Comprobación. De cada 10 Comprobaciones con merchants calificados, al menos 3 tienen que pagar el anticipo para que se construya el producto.

## Restricciones

- Sin presupuesto para pauta ni herramientas: solo planes gratis.
- Jean construye 2 horas al día. No preguntarle por tiempos: sacar una versión decente rápido, en incrementos que funcionen. El código lo escribe el agente.
- No ofrecer nada que la IA reemplace fácil. Tesis: la información ya no vale; lo que vale es la evidencia en la tienda del merchant, más un humano que responde por el arreglo antes de una fecha límite.
- Copy en español neutro, sin preferencia visible por ningún país. Sin guiones largos.
- No se escribe código del producto antes del primer anticipo. El Escaneo y la demo sí.

## Decisiones aprobadas (resumen)

- **Ruta:** `/es/operar-a-mano/`. El resultado se abre en `?r=<id>`, con un ID aleatorio y sin datos personales en la URL.
- **Acepta cualquier plataforma:** Shopify, otras plataformas, o solo un @ de Instagram.
- **Dolor principal:** la operación manual. **Hallazgos automáticos desde la URL:** promos (versión ligera: precio tachado, barra de envío gratis, descuentos automáticos visibles), apps zombis y "Shopify va a apagar algo" (este último solo en Shopify).
- **Preguntas, el mínimo para calificar, elegir módulos y calcular la Fuga (recortadas el 25/10/2026):**
  1. URL o @. Si es Shopify se detecta sola, sin preguntar la plataforma.
  2. Pedidos por día (menos de 5 / 5 a 9 / 10 a 24 / 25 a 49 / 50 o más). Esta es la que califica.
  3. Cómo le pagan sus clientes, con selección múltiple: contraentrega, transferencia o pago móvil con comprobante, tarjeta o pasarela, billetera o cripto. Define qué módulos le aplican.
  4. Cuántas horas al día se le van en confirmar pedidos, revisar comprobantes y pasarlos a la transportadora, en total.
  5. *Solo si elige contraentrega:* de cada 10 pedidos, cuántos se rechazan, y cuánto cuesta un envío que vuelve, en su moneda.
  6. Desbloqueo: nombre, WhatsApp obligatorio, email opcional, y el checkbox de autorización de datos (Ley 1581).
- **Fuera del Escaneo:** el país sale del prefijo del WhatsApp. La transportadora se pregunta en la Comprobación. Cómo confirma y la multimoneda no se preguntan.
- **Fuga:** se calcula solo con las respuestas del merchant, sin promedios de mercado. Horas al mes (horas al día × 30), más plata al mes (pedidos al día × 30 × % de rechazo × costo del envío que vuelve).
- **Visible al instante:** el titular de la Fuga y 1 hallazgo automático (el más grave).
- **Detrás del desbloqueo:** el desglose, todos los hallazgos, el plan de Arreglos y el CTA según la ruta del lead. El precio nunca aparece en el resultado.
  - 10 o más pedidos por día y Shopify: el CTA abre el WhatsApp de Jean con el ID del resultado ("Quiero mi Comprobación").
  - Menos de 10 pedidos por día: email de Klaviyo con una oferta de CRO o desarrollo según los hallazgos.
  - Otra plataforma o solo Instagram: lista de espera del producto, más la oferta de desarrollo o migración a Shopify.
- **Comprobación (humana, después del Escaneo):** prueba del tiempo de respuesta del WhatsApp de ventas, más la demo simulada con los productos y la marca del merchant. Termina con la oferta y el pedido del anticipo.
- **Oferta:** 3 módulos (contraentrega, comprobantes y sincronización de pedidos), precios en 2 niveles, precio de fundador para los primeros 3, garantía y plazos. El detalle está en `lead-magnets.md`, sección "Experimento de producto".
- **Outreach:** primero se pide permiso. El primer mensaje es una pregunta sobre el Dolor principal que ofrece la calculadora, y el link va solo cuando el merchant dice que sí, sin precargar nada.
- **Carril en español mínimo:** solo `/es/operar-a-mano/` y `/es/privacidad/`. Las 2 o 3 pruebas (Marlies Dekkers de 14 s a 6 s, Nuflorist, Duilify en la App Store) y un "sobre mí" de dos líneas van dentro de la página del Escaneo. El inicio en español y el resto del sitio están en `sitio-en-espanol.md`.

## Arquitectura

- **Sitio:** Astro 6 estático, servido por un Worker de assets de Cloudflare (`wrangler.jsonc`). Se le suma un script de Worker (`main`) para las rutas `/api/*`; el resto sigue siendo assets.
- **El Worker:**
  - lee el HTML y `products.json` de la tienda del lado del servidor (por CORS) y saca los hallazgos, reutilizando la lógica de `~/business/CRO_LinkedIn_SN/workspace/regla100/scanner.js`;
  - guarda el perfil en Klaviyo con la API key privada como secret, con las respuestas y los hallazgos como propiedades;
  - avisa a Jean por un bot de Telegram (secrets: el token del bot y el chat ID).
- **Almacenamiento de resultados para `?r=<id>`:** D1, en el plan gratis. La demo lee el mismo resultado.
- **Analítica (solo métricas accionables):**
  - Cloudflare Web Analytics gratis solo cuenta visitas; no registra eventos propios.
  - El Worker registra cada paso en D1: iniciado, pregunta en la que abandona, completado, desbloqueado y clic a WhatsApp. El clic pasa por `/api/go` para poder contarlo.
  - Cada link del outreach lleva `?c=wa`, `?c=li` o `?c=em` (canal), sin datos personales.
  - Una consulta semanal da la conversión de cada paso, por canal y por segmento (pedidos por día, cómo le pagan, país).
  - Desde la Comprobación hasta la garantía, el embudo se registra en el CRM.
  - No se miran visitas totales ni tiempo en la página: son vanidad.
- **CRM:** `~/projects/outreach-os` **no se toca**. Su regla #2 (una sola vía de escritura) prohíbe escribir leads desde un endpoint. En la versión 1, Jean crea el lead a mano con "Add prospect". El ticket para automatizarlo está en `crm-intake-escaneos.md`.
- **Correo:** los MX de `jeanmanzo.com` usan el reenvío de Namecheap. No tocarlos.
- **Producto:** no vive en este repo. Se construye en un repo aparte después del primer anticipo.

## Orden de construcción

Cada paso deja algo que funciona.

1. Estructura i18n de Astro, más `/es/privacidad/` y el layout del carril en español.
2. El Escaneo: preguntas y cálculo de la Fuga en el navegador, con el parámetro `?c=`. Con esto ya sirve compartido por WhatsApp.
3. El Worker: lectura de la tienda, hallazgos automáticos, D1 con los resultados y los eventos del embudo, y `/api/go`.
4. Desbloqueo, Klaviyo y el aviso por Telegram. Antes, generar un wizard para lo que solo Jean puede hacer: crear el bot con @BotFather y sacar el chat ID, crear la lista y la API key privada en Klaviyo, y cargar los secrets en Cloudflare.
5. La demo de la Comprobación: el chat de WhatsApp simulado, generado desde el resultado del Escaneo y el `products.json` del merchant. Jean graba la pantalla mientras se reproduce y manda el video por WhatsApp.
6. Plantillas del outreach y la integración con la Regla de 100. Esto toca las skills y `templates.py`, así que requiere la aprobación explícita de Jean.

Después del paso 6 empieza la medición: tandas de 10 Comprobaciones, con el criterio de validación de `lead-magnets.md`.

## Fuera de alcance de esta versión

Están en la misma carpeta:

- `lead-magnets.md`: los otros 3 lead magnets (promos, apps zombis, Shopify apaga), procesos para versiones siguientes (proveedores, facturación, stock), pauta paga y la idea de Shopify para Venezuela.
- `sitio-en-espanol.md`: el sitio completo en español, incluido el inicio en `/es/`.
- `crm-intake-escaneos.md`: los Escaneos como prospect candidates en Outreach OS.

# Lead magnets: backlog

Familia de lead magnets para el outreach de la Regla de 100 (DTC-LatAm primero, por WhatsApp). Todos siguen el mismo mecanismo y la misma tesis.

## Tesis

La información ya no vale: cualquier merchant la saca de ChatGPT. Lo que vale es la evidencia en la tienda del prospecto, más un humano que responde por el arreglo antes de una fecha límite.

## Mecanismo común (aprobado el 24/10/2026)

1. **Escaneo**: el prospecto pega la URL de su tienda y responde unas preguntas cortas. El resultado sale al instante en pantalla.
2. Un **hallazgo** queda visible. El resto del resultado se desbloquea con el email (Klaviyo).
3. **Comprobación**: Jean verifica la fuga principal en la tienda real y manda la prueba.
4. **Arreglo**: trabajo pagado, con fecha y garantía.

La unidad del resultado no es una nota sobre 100 (eso es terreno de ConvertMate). Es plata, horas o riesgo concreto, calculados con los números del prospecto y sin estimaciones inventadas.

Referencia de mecanismo: el Blueprint de convertmate.co (URL, resultado inmediato y personalizado). No competimos con su contenido (CRO de diseño y velocidad).

## Los 4 lead magnets

| Prioridad | Dolor | Evidencia desde fuera | Estado |
|---|---|---|---|
| 1 | **Operación manual**: confirmar pedidos contraentrega por WhatsApp, novedades y devoluciones, pasar pedidos a la transportadora o a Dropi, responder lo mismo por WhatsApp | Baja: preguntas más detección de apps de COD y de WhatsApp | En diseño |
| 2 | **Promos que regalan margen**: descuentos que se suman, umbral de envío gratis mal calculado, precio tachado que no cuadra | Alta: prueba en el carrito | Backlog |
| 3 | **Apps zombis**: mensualidades de apps que no se usan, código huérfano de apps desinstaladas, peso en velocidad | Alta: HTML de la tienda | Backlog |
| 4 | **Shopify va a apagar algo**: script tags (marzo 2027), additional scripts, apps sin mantenimiento | Alta: HTML de la tienda | Backlog |

Material de apoyo ya publicado en el blog:

- 2: `shopify-bfcm-discount-combination-matrix`, `shopify-cart-savings-math`
- 3: `shopify-app-bloat-audit`
- 4: `shopify-script-tags-deprecation-march-2027`, `shopify-thank-you-page-tracking-additional-scripts`

Lógica reutilizable: `scanner.js` y `psi.py` del workspace de la Regla de 100.

## Primer lead magnet en construcción (24/10/2026)

Un solo Escaneo:

- **Dolor principal (preguntas):** Operación manual. Procesos de la versión 1: confirmar pedidos contraentrega, novedades y devoluciones, y pasar pedidos y guías a la transportadora o a Dropi.
- **Hallazgos secundarios (automáticos desde la URL):** los dolores 2, 3 y 4 de la tabla de arriba (promos, apps zombis y Shopify va a apagar algo).
- **Umbral:** desde 10 pedidos por día, CTA directo al WhatsApp de Jean. Por debajo, resultado sin CTA directo y nutrición en Klaviyo.
- **Desbloqueo:** WhatsApp obligatorio, email opcional pero incentivado.
- **Comprobación:** prueba del tiempo de respuesta en su WhatsApp de ventas, más una demo de su confirmación automatizada con sus productos y su marca.

- **Cualquier plataforma (24/10/2026):** el Escaneo acepta tiendas en cualquier plataforma, o merchants que solo venden por redes y WhatsApp. El dolor principal corre siempre. Los hallazgos automáticos corren según lo que se pueda detectar en la plataforma ("Shopify va a apagar algo" solo existe en Shopify).
- **Sin preferencia de país:** ninguna pregunta deja ver un país favorito. Venezuela se valida como un mercado más, con los mismos datos que los demás.

- **Ramificación por cómo le pagan, no por país:** "¿Cómo te pagan tus clientes?" (contraentrega, transferencia o pago móvil con comprobante, tarjeta o pasarela, billetera o cripto) y "¿Muestras precios en más de una moneda?". El país solo segmenta, en una lista alfabética.
- **Klaviyo en la versión 1:** captura más un email con el resultado completo. La nutrición llega cuando haya más de 20 leads.

### Arreglos, en orden de prioridad

Jean puede entregar los cuatro con instrucciones paso a paso. Se construyen en este orden:

1. **Confirmación automática de pedidos contraentrega por WhatsApp.** Es el Arreglo estrella: el dolor más común y la garantía más fácil de medir (tasa de rechazo antes y después).
2. **Conciliación de comprobantes de pago.** La IA lee el monto y la referencia, los cruza con el pedido y avisa si no cuadra. Es la más diferenciada, y pega fuerte en Venezuela.
3. **Guías automáticas.** El pedido confirmado crea la guía en la transportadora o en Dropi, y el cliente recibe el tracking.
4. **Precios en varias monedas con la tasa del día.**

Los Arreglos 3 y 4 entran primero como ampliaciones del plan mensual.

### Oferta (aprobada el 24/10/2026)

- **Escaneo:** "¿Cuánto te cuesta operar a mano?"
- **Arreglo estrella:** "Contraentrega Confirmada: tus pedidos se confirman solos por WhatsApp en 7 días". Si la carga de trabajo lo exige, el plazo sube, pero solo cuando haga falta.
- **Puente:** Escaneo gratis, Comprobación gratis (prueba más demo), Arreglo pagado. No hay tripwire.
- **Precio:** US$397 de setup (50% al arrancar y 50% al dejarlo funcionando) más el plan mensual opcional (COP 800.000 a 1.200.000, o su equivalente en USD). Los costos de Meta por mensaje los paga el merchant directo.
- **Garantía:** si en 30 días la confirmación automática no maneja al menos el 80% de los pedidos contraentrega sin que el merchant toque WhatsApp, se devuelve el setup completo. Además, Jean sigue trabajando sin costo hasta lograrlo. La tasa de rechazo se reporta, no se promete.
- **Línea base:** las respuestas del Escaneo son el "antes" del reporte de los 30 días.

### CRM (versión 1)

Puente sin tocar `outreach-os`: el Escaneo guarda el perfil en Klaviyo y le envía un aviso a Jean por un bot de Telegram, y Jean crea el lead a mano con "Add prospect". La integración correcta está en el ticket `crm-intake-escaneos.md`.

### Recorrido (aprobado el 24/10/2026)

- **Outreach:** primero se pide permiso. El primer mensaje nombra el Dolor principal con una pregunta y ofrece la calculadora. El link va solo cuando el merchant dice que sí, y sin precargar su tienda.
- **Ruta:** `/es/operar-a-mano/`. El resultado se abre en `?r=<id>`, con un ID aleatorio y sin datos personales en la URL.
- **Preguntas:** URL o @, país, pedidos por día (la que califica), cómo le pagan, y las ramas de contraentrega (confirmación y rechazos), comprobantes, transportadora y multimoneda. Al final, el desbloqueo: nombre, WhatsApp obligatorio y email opcional.
- **Fuga:** se calcula solo con las respuestas del merchant, sin promedios de mercado.
- **Visible al instante:** el titular de la Fuga y 1 hallazgo automático.
- **Detrás del desbloqueo:** el desglose por proceso, todos los hallazgos, el plan de Arreglos y el CTA (con 10 o más pedidos por día, WhatsApp con el ID del resultado; con menos, el plan por email). El precio no aparece.

### Para versiones siguientes

- Más procesos en el Escaneo: manejo de proveedores, facturación (DIAN y equivalentes), sincronización de stock.
- Pauta paga hacia el Escaneo. Jean la maneja después, cuando el Escaneo esté validado con outreach.

### Cobros

USD para toda la región. En Venezuela: Zinli, Kontigo, Binance/USDT, PayPal y Bs por transferencia al Banco de Venezuela. Fuera de Venezuela: Payoneer, Global66, Wise y PayPal.

Los dolores 2, 3 y 4 siguen en el backlog como lead magnets propios, con su propio dolor principal.

## Ideas en reserva

- **Pauta a ciegas**: eventos de Meta o GA4 rotos o duplicados. Confirmar Purchase exige una orden de prueba. Blog: `shopify-customer-events-tracking-audit`.
- **Invisible para la IA**: ChatGPT o Google AI Mode no recomiendan la tienda. JSON-LD más capturas de búsquedas reales. Blog: `json-ld-structured-data-ai-search`, `google-ai-mode-checkout-shopify`.

- **Shopify para Venezuela:** si el levantamiento de sanciones hace viable Shopify en el país, ofrecer montaje o migración a Shopify a los merchants venezolanos que hoy venden por Instagram y WhatsApp. Los Escaneos de merchants sin plataforma que lleguen desde Venezuela son la primera señal de demanda.

## Descartados como gancho

Velocidad y CRO de ficha de producto móvil: son commodity, y es el terreno de ConvertMate. A lo sumo, métricas secundarias dentro de otro escaneo.

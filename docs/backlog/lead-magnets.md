# Lead magnets y experimento de producto

Familia de lead magnets para outreach, y el experimento Lean que valida el producto que se vende al final del primero. Todo sigue el mismo mecanismo y la misma tesis.

Punto de entrada para construir: `plan-escaneo-operar-a-mano.md` (misma carpeta). Términos: `GLOSSARY.md` (raíz). Si este archivo y el plan dicen cosas distintas, gana este.

## Tesis

La información ya no vale: cualquier merchant la saca de ChatGPT. Lo que vale es la evidencia en la tienda del prospecto, más un humano que responde por el arreglo antes de una fecha límite.

## Mecanismo común (aprobado el 24/10/2026)

1. **Escaneo**: el prospecto pega la URL de su tienda y responde unas preguntas cortas. El resultado sale al instante en pantalla.
2. Un **hallazgo** queda visible. El resto del resultado se desbloquea con sus datos de contacto.
3. **Comprobación**: Jean verifica la fuga principal en la tienda real y manda la prueba.
4. **Arreglo**: trabajo pagado, con fecha y garantía.

La unidad del resultado no es una nota sobre 100 (eso es terreno de ConvertMate). Es plata, horas o riesgo concreto, calculados con los números del prospecto y sin estimaciones inventadas.

Referencia de mecanismo: el Blueprint de convertmate.co (URL, resultado inmediato y personalizado). No competimos con su contenido (CRO de diseño y velocidad).

## Los 4 lead magnets

| Prioridad | Dolor | Evidencia desde fuera | Estado |
|---|---|---|---|
| 1 | **Operación manual**: confirmar pedidos contraentrega por WhatsApp, revisar comprobantes, novedades y devoluciones, pasar pedidos a la transportadora o a Dropi, responder lo mismo por WhatsApp | Baja: preguntas más detección de apps de COD y de WhatsApp | En construcción |
| 2 | **Promos que regalan margen**: descuentos que se suman, umbral de envío gratis mal calculado, precio tachado que no cuadra | Alta: prueba en el carrito | Backlog |
| 3 | **Apps zombis**: mensualidades de apps que no se usan, código huérfano de apps desinstaladas, peso en velocidad | Alta: HTML de la tienda | Backlog |
| 4 | **Shopify va a apagar algo**: script tags (marzo 2027), additional scripts, apps sin mantenimiento | Alta: HTML de la tienda | Backlog |

Material de apoyo ya publicado en el blog:

- 2: `shopify-bfcm-discount-combination-matrix`, `shopify-cart-savings-math`
- 3: `shopify-app-bloat-audit`
- 4: `shopify-script-tags-deprecation-march-2027`, `shopify-thank-you-page-tracking-additional-scripts`

Lógica reutilizable: `scanner.js` y `psi.py` del workspace de la Regla de 100 (`~/business/CRO_LinkedIn_SN/workspace/regla100`).

## Primer lead magnet: "¿Cuánto te cuesta operar a mano?"

Un solo Escaneo, en `/es/operar-a-mano/`:

- **Dolor principal (preguntas):** Operación manual. Procesos de la versión 1: confirmar pedidos contraentrega, revisar comprobantes de pago, novedades y devoluciones, y pasar pedidos y guías a la transportadora o a Dropi.
- **Hallazgos secundarios (automáticos desde la URL):** los dolores 2, 3 y 4 de la tabla de arriba (promos, apps zombis y Shopify va a apagar algo).
- **Cualquier plataforma:** acepta tiendas en cualquier plataforma, o merchants que solo venden por redes y WhatsApp. El dolor principal corre siempre. Los hallazgos automáticos corren según lo que se pueda detectar ("Shopify va a apagar algo" solo existe en Shopify).
- **Sin preferencia de país:** ninguna pregunta deja ver un país favorito. Venezuela se valida como un mercado más, con los mismos datos que los demás.
- **Ramificación por cómo le pagan, no por país:** "¿Cómo te pagan tus clientes?" (contraentrega, transferencia o pago móvil con comprobante, tarjeta o pasarela, billetera o cripto). El país no se pregunta: sale del prefijo del WhatsApp y solo segmenta.
- **Desbloqueo:** WhatsApp obligatorio, email opcional pero incentivado.
- **Klaviyo en la versión 1:** captura más un email con el resultado completo. La nutrición llega cuando haya más de 20 leads.

### Recorrido (aprobado el 24/10/2026)

- **Outreach:** primero se pide permiso. El primer mensaje nombra el Dolor principal con una pregunta y ofrece la calculadora. El link va solo cuando el merchant dice que sí, y sin precargar su tienda.
- **Resultado:** se abre en `?r=<id>`, con un ID aleatorio y sin datos personales en la URL.
- **Preguntas (el mínimo, recortadas el 25/10/2026):** URL o @, pedidos por día (la que califica), cómo le pagan, horas al día en tareas manuales de pedidos y, solo con contraentrega, rechazos y costo del envío que vuelve. Al final, el desbloqueo: nombre, WhatsApp obligatorio y email opcional. La lista exacta está en el plan.
- **Fuga:** se calcula solo con las respuestas del merchant, sin promedios de mercado.
- **Visible al instante:** el titular de la Fuga y 1 hallazgo automático.
- **Detrás del desbloqueo:** el desglose por proceso, todos los hallazgos, el plan de Arreglos y el CTA según la ruta del lead (ver abajo). El precio no aparece.
- **Comprobación:** prueba del tiempo de respuesta en su WhatsApp de ventas, más la demo simulada (ver abajo).

### Ruta de cada lead (aprobada el 25/10/2026)

| Lead | Qué recibe |
|---|---|
| 10 o más pedidos por día y Shopify | CTA al WhatsApp de Jean con el ID del resultado ("Quiero mi Comprobación"). Entra al experimento de producto. |
| Menos de 10 pedidos por día | Email de Klaviyo con una oferta de CRO o desarrollo según sus hallazgos. |
| Otra plataforma, o solo Instagram y WhatsApp | Lista de espera del producto, más la oferta de desarrollo o migración a Shopify. |

Todos los leads sirven además para ofrecer los servicios de CRO y desarrollo de siempre.

### CRM (versión 1)

Puente sin tocar `outreach-os`: el Escaneo guarda el perfil en Klaviyo y le envía un aviso a Jean por un bot de Telegram, y Jean crea el lead a mano con "Add prospect". La integración correcta está en el ticket `crm-intake-escaneos.md`.

### Para versiones siguientes del Escaneo

- Más procesos: manejo de proveedores, facturación (DIAN y equivalentes), sincronización de stock.
- Pauta paga hacia el Escaneo. Jean la maneja después, cuando el Escaneo esté validado con outreach.

## Experimento de producto (aprobado el 25/10/2026)

Un producto de operación por WhatsApp para merchants de Shopify en LatAm: los pedidos se procesan sin que el merchant toque WhatsApp. Es un servicio productizado, no horas: Jean escribe la base una vez y cada cliente nuevo es una configuración.

**Nombre:** sin definir. "Ecom Buddy" fue solo un ejemplo y no se usa. El nombre se elige después del primer anticipo. Mientras tanto, en el copy se habla del resultado ("tus pedidos se procesan solos por WhatsApp").

### Por qué este producto y no un asistente general

- Un asistente general de la tienda compite con Shopify Sidekick, que es gratis y lee los datos de la tienda. Choca con la tesis.
- Sidekick no ve lo que pasa en WhatsApp: contraentrega, comprobantes de pago móvil y billeteras, Dropi, precios en varias monedas, venta por chat. Ese es el hueco.
- Solo confirmar contraentrega es commodity (apps de US$5 a 60 al mes). La diferencia está en juntar contraentrega, comprobantes y Dropi, dejarlo funcionando por el merchant y garantizarlo.

### Hipótesis

- **H1, valor:** los merchants de Shopify en LatAm con 10 o más pedidos por día pagan para que sus pedidos se procesen sin tocar WhatsApp.
- **H2, precio:** aceptan un setup de US$297 a 397 más un plan de US$99 a 149 al mes.
- **H3, canal:** el outreach con permiso más el Escaneo produce Comprobaciones con merchants calificados.

### Criterio de validación

- De cada 10 Comprobaciones con merchants calificados, al menos 3 pagan el anticipo del 50%: se construye el producto.
- Menos de 3: se cambia la oferta (precio, garantía, módulos, mensaje) antes que el producto, y se mide otra tanda de 10.
- **Regla:** no se escribe código del producto antes del primer anticipo. El Escaneo y la demo sí se construyen antes, porque son el instrumento del experimento.

### Embudo que se mide

Contactados, aceptan el link, Escaneos completados, desbloqueados, calificados, Comprobaciones, anticipos, entregados a tiempo, garantía cumplida.

Solo métricas accionables: la conversión de cada paso, por canal (`?c=` en el link del outreach) y por segmento. La parte web la registra el Worker en D1, porque Cloudflare Web Analytics gratis no guarda eventos propios. Desde la Comprobación, el resto se registra en el CRM (`outreach-os`). Revisar el embudo cada semana: construir, medir, aprender.

### Módulos del PMV

1. **Contraentrega:** el pedido nuevo dispara un mensaje de WhatsApp con botones para confirmar o cancelar. La IA solo entra cuando el cliente escribe texto libre.
2. **Comprobantes:** la IA lee el monto y la referencia del comprobante, los cruza con el pedido y avisa si no cuadra.
3. **Sincronización de pedidos:** el pedido confirmado pasa solo a Dropi o a la transportadora, con su guía. El estado queda igual en Shopify, Dropi y WhatsApp, y el cliente recibe el tracking solo.

Cada merchant activa los módulos que le aplican según cómo le pagan.

**Siguiente versión:** pedidos cerrados por chat o Instagram creados en Shopify, precios en varias monedas con la tasa del día, y después más áreas (ads, productos, carritos abandonados).

**Criterio para sumar un módulo a un cliente:** su Escaneo mostró esa Fuga, el módulo anterior ya cumplió su garantía y el nuevo usa la misma base técnica. El orden lo pone el tamaño de la Fuga.

### Oferta

- **Puente:** Escaneo gratis, Comprobación gratis, Arreglo pagado, Plan mensual. No hay tripwire.
- **Precios, en 2 niveles que el merchant elige** (es parte de H2):
  - **Base:** setup de US$297 a 397 y Plan de US$99 a 149 al mes. Incluye los módulos del PMV que le apliquen, soporte, reporte mensual y ajustes chicos.
  - **Alto:** Plan de US$300 a 400 al mes. Suma módulos a medida, agentes distintos a los del PMV y horas de desarrollo incluidas.
  - El desarrollo que no entra en el Plan se cobra aparte.
- **Precio de fundador:** solo los primeros 3 clientes, setup de US$197. A cambio dan un testimonio, sus datos de antes y después, y permiso para usarlos como caso de estudio. La escasez se dice de frente.
- **Pago:** 50% al arrancar y 50% al entregar.
- **Plazos:** el primer módulo funcionando en 7 días y los 3 en 21 días, contados desde que Meta aprueba el número. Si la carga de trabajo lo exige, el plazo sube, pero solo cuando haga falta.
- **Garantía:** cubre contraentrega y comprobantes. Si en 30 días esos módulos no procesan al menos el 80% de esos pedidos sin que el merchant toque WhatsApp, se devuelve el setup completo, y Jean sigue trabajando sin costo hasta lograrlo. La sincronización no tiene garantía, porque depende de Dropi y las transportadoras. La tasa de rechazo se reporta, no se promete.
- **Línea base:** las respuestas del Escaneo son el "antes" del reporte de los 30 días.
- **El Plan incluye:** mantener todo funcionando (servidor, IA y monitoreo), arreglarlo si Shopify, Meta o Dropi cambian algo, ajustar mensajes cuando cambien productos o promos, el reporte mensual (pedidos procesados solos, rechazos, horas ahorradas) y soporte por WhatsApp. Si el merchant cancela, la automatización se apaga.
- **Mensajes de Meta:** los paga el merchant directo. Una confirmación en Colombia cuesta cerca de US$0,0008.

### Demo de la Comprobación

Una página del sitio con un chat de WhatsApp simulado, armada con los productos, precios y marca del merchant a partir de su `products.json`. Muestra cómo se vería la confirmación de uno de sus pedidos y la lectura de un comprobante. No necesita Meta ni ningún número real, así que Jean la genera en minutos para cada Comprobación. El número de prueba real llega cuando alguien pague.

**Video:** Jean graba la pantalla de la demo mientras se reproduce (unos 20 segundos) y la manda por WhatsApp. No se usa video generado con IA para la demo: deforma nombres y precios, y se ve falso.

**Clip genérico (para después):** para la página del Escaneo o la pauta paga sí sirve un modelo de video (Higgsfield, Kling, Hailuo o Veo; confirmar créditos gratis antes). La pantalla del celular sale en verde y se le monta la demo real encima en CapCut. Prompt:

```
Vertical 9:16, 8 seconds, realistic handheld smartphone footage.
A small e-commerce stockroom in Latin America, late afternoon light,
cardboard boxes and packing tape on a wooden table. A young business
owner sits relaxed, packing an order, not looking at the phone.
In the foreground, a smartphone lies on the table with a solid
chroma-key green screen, no text, no UI, no reflections on the screen.
The phone vibrates softly three times as if receiving messages;
the owner glances at it, smiles, and keeps packing.
Camera slowly pushes in toward the phone and ends framed on it.
Natural colors, shallow depth of field, no on-screen text, no logos.
```

### Construcción del producto (después del primer anticipo)

- Código propio: un Worker de Cloudflare, los webhooks de pedidos de Shopify, la Cloud API de WhatsApp (Meta) y la API de Dropi. Para la IA alcanza un modelo barato.
- Solo Shopify en la versión 1.
- El primer cliente se configura a mano. La meta es que desde el tercero sea casi pura configuración, y que las funciones nuevas se sumen sin rehacer lo anterior.
- Repo aparte, en `~/projects/<nombre-del-producto>`, que se crea solo después del primer anticipo. El sitio se queda solo con el Escaneo y la demo.

### Riesgos

- La verificación de Meta tarda días. Por eso los plazos cuentan desde la aprobación del número.
- Usar el mismo número en la app de WhatsApp y en la API a la vez depende del país. Hay que comprobarlo con cada cliente antes de cobrar.
- Si la oferta suena a "confirmación de pedidos", se compara con apps de US$9. El copy tiene que vender el resultado completo y la garantía.

### Mercado (investigado el 25/10/2026)

Precios publicados, sin verificar con cada proveedor:

| Tipo | Ejemplos | Precio |
|---|---|---|
| Apps de Shopify para confirmar contraentrega | COD Confirm, Akeed, WASP, OrderX | US$0 a 60 al mes |
| Herramientas de WhatsApp para LatAm | Chatea PRO (contraentrega), LucidBot, Leadsales, PanaBot | US$44 a 399 al mes |
| Agencias que lo dejan funcionando | AsistChat, StriqTech, SyncManager | Setup de US$149 a 499, más US$59 a 120 al mes |
| Agencias profesionales | Uniamos (México) | US$500 a 3.000 al mes |
| Agentes de IA para atención | Gorgias | US$300 a 750 al mes, más un cobro por conversación resuelta |
| Asistente de Shopify | Sidekick | Gratis |

### Cobros

USD para toda la región. En Venezuela: Zinli, Kontigo, Binance/USDT, PayPal y Bs por transferencia al Banco de Venezuela. Fuera de Venezuela: Payoneer, Global66, Wise y PayPal.

Los dolores 2, 3 y 4 siguen en el backlog como lead magnets propios, con su propio dolor principal.

## Ideas en reserva

- **Pauta a ciegas**: eventos de Meta o GA4 rotos o duplicados. Confirmar Purchase exige una orden de prueba. Blog: `shopify-customer-events-tracking-audit`.
- **Invisible para la IA**: ChatGPT o Google AI Mode no recomiendan la tienda. JSON-LD más capturas de búsquedas reales. Blog: `json-ld-structured-data-ai-search`, `google-ai-mode-checkout-shopify`.
- **Shopify para Venezuela:** si el levantamiento de sanciones hace viable Shopify en el país, ofrecer montaje o migración a Shopify a los merchants venezolanos que hoy venden por Instagram y WhatsApp. Los Escaneos de merchants sin plataforma que lleguen desde Venezuela son la primera señal de demanda.

## Descartados como gancho

Velocidad y CRO de ficha de producto móvil: son commodity, y es el terreno de ConvertMate. A lo sumo, métricas secundarias dentro de otro escaneo.

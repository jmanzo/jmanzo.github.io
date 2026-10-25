# Ticket: sitio completo en español

**Estado:** backlog. Se trabaja después del carril en español del primer lead magnet.

## Contexto

Los prospectos de DTC-LatAm llegan por WhatsApp a un lead magnet en español. Si pasan de ahí a páginas en inglés, se rompe la confianza. Para no frenar la venta, la versión 1 solo cubre un carril mínimo en español (decidido el 24/10/2026):

- El lead magnet y su página de resultado.
- `/es/`: inicio con 2 o 3 pruebas (Marlies Dekkers, Nuflorist y Duilify en la App Store).
- Un "sobre mí" corto.
- El header de ese carril solo enlaza a páginas en español.

La estructura i18n de Astro queda montada en la versión 1. Este ticket cubre todo lo demás.

## Alcance

- [ ] Traducir y adaptar `/projects/` y cada proyecto.
- [ ] Traducir `/work/` y cada case study.
- [ ] Traducir los posts que se usen en el outreach, empezando por los del backlog de lead magnets (`docs/backlog/lead-magnets.md`).
- [ ] Decidir qué posts quedan solo en inglés y cómo se señala en el carril en español.
- [ ] `hreflang` entre versiones, sitemap por idioma y RSS en español.
- [ ] Selector de idioma en el header y el footer.
- [ ] Revisar las fechas y los meses con formato en español (`formatMonth` y `formatDay` en `src/consts.ts`).
- [ ] Imagen OG en español.

## Criterio de hecho

Un visitante que entra por `/es/` puede recorrer todo el sitio sin caer en una página en inglés, salvo los posts marcados a propósito como solo en inglés.

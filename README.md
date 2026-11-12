# HLF — micrositio arquitectónico

Sitio estático inspirado en el lenguaje editorial de Thirty High y la estructura de contenido de HYLO. Está preparado para presentar el edificio del modelo `HLF_P2-P6.rvt`.

## Uso

Abre `index.html` directamente o sirve la carpeta con cualquier servidor estático.

## Sustituir placeholders

Los SVG de `assets/` mantienen la relación de aspecto y pueden reemplazarse por renders finales conservando los mismos nombres, o actualizando las rutas en `index.html`.

- `hero-building.svg`: exterior principal / hero.
- `panorama-placeholder.svg`: vista panorámica.
- `gallery-placeholder.svg`: fachada vertical.
- `floor-placeholder.svg`: plano de nivel.

El selector de plantas se configura en `script.js` y actualmente cubre los niveles 2 a 6 del modelo.


# Hotel La Fontana · Piso 2

Sitio estático (GitHub Pages) de la remodelación del Piso 2 del Hotel Estelar La Fontana, Bogotá.
Estética tomada de [Thirty High](https://thirtyhigh.co.uk/) (paleta oliva / lima / lila, serif editorial, selector de pisos)
y [HYLO](https://hylo-london.com/building/) (ficha técnica en grotesk, planos por nivel, recorridos).

Publicado en https://alejagoguti-cpu.github.io/planosfinales/

## Contenido

- `assets/img/`: visualizaciones del repo `hotel-la-fontana-render` (`assets/hf/`, ilustrativas, generadas con IA desde el modelo).
- `assets/planos/`: plantas del Piso 2 exportadas de Revit (mobiliario, arquitectónica y acabados).
- `assets/habitaciones-p2.json`: inventario de las 12 habitaciones (tipología, ala, áreas privada y construida) del `rooms-piso2.json` del mismo repo.
- `script.js`: menú, selector de pisos (SVG), inventario con filtros y suma de áreas seleccionadas.

Para agregar la planta de otro piso: añade `plan: true` y sus datos a `FLOORS` en `script.js`.

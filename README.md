# Hotel La Fontana · Piso 2

Sitio estático (GitHub Pages) de la remodelación del Piso 2 del Hotel Estelar La Fontana, Bogotá.
Maquetación y lenguaje visual siguiendo la página Building de [HYLO](https://hylo-london.com/building/): marca en cuadrado rojo, portada con texto grande, franja gris, carrusel con barras, cifras grandes con píldoras rojas, pantalla dividida (lista de niveles / plano en panel rojo) y pie oscuro. Código, textos e imágenes propios del proyecto.

Fuentes: HYLO usa Px Grotesk y Akzidenz-Grotesk Pro (comerciales). El sitio usa Space Grotesk y Archivo (Google Fonts) como alternativas; si se compran las licencias, basta con cargarlas: `styles.css` ya las pone primero en `--head` y `--body`.

Publicado en https://alejagoguti-cpu.github.io/planosfinales/

## Contenido

- `assets/img/`: visualizaciones del repo `hotel-la-fontana-render` (`assets/hf/`, ilustrativas, generadas con IA desde el modelo).
- `assets/planos/`: plantas del Piso 2 exportadas de Revit (mobiliario, arquitectónica y acabados).
- `assets/habitaciones-p2.json`: inventario de las 12 habitaciones (tipología, ala, áreas privada y construida) del `rooms-piso2.json` del mismo repo.
- `assets/p2-plano.json`: geometría del Piso 2 (losa, muros, columnas, corredor y polígonos de habitaciones, en cm) exportada del modelo; con ella se dibuja el plano vectorial.
- `script.js`: menú, carrusel, plano vectorial con resaltado por tipología y por habitación, lista de niveles.



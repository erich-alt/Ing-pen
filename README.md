# Control Ingresos PWA

App local instalable para iPhone como PWA.

## Publicar rapido

### Opcion GitHub Pages
1. Crea un repositorio nuevo.
2. Sube todo el contenido de esta carpeta.
3. En Settings > Pages, selecciona Deploy from branch y la rama main, carpeta root.
4. Abre la URL publicada en Safari del iPhone.
5. Toca Compartir > Agregar a pantalla de inicio.

### Opcion Cloudflare Pages / Netlify
1. Arrastra esta carpeta o el ZIP en el panel de Pages/Netlify.
2. Abre la URL HTTPS publicada en Safari del iPhone.
3. Toca Compartir > Agregar a pantalla de inicio.

## Privacidad
Los datos, PDFs y respaldos se guardan en el navegador del iPhone usando IndexedDB. El hosting solo sirve los archivos de la app.

## Archivos principales
- index.html: app principal
- manifest.webmanifest: configuracion PWA
- sw.js: cache offline
- vendor/: librerias locales de Excel y PDF

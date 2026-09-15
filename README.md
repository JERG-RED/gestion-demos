# Gestión de Demos — V1

Interfaz web para registrar y actualizar proyectos/demos usando:

- GitHub Pages como frontend
- Google Apps Script como API
- Google Sheets como base de datos

## Archivos

- `index.html` — interfaz
- `styles.css` — diseño
- `app.js` — conexión con Apps Script

## Publicación en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `gestion-demos`.
2. Sube los tres archivos.
3. En GitHub entra a **Settings → Pages**.
4. Selecciona **Deploy from a branch**.
5. Selecciona la rama principal y la carpeta `/root`.
6. Guarda y espera a que GitHub publique la página.

La URL de Apps Script ya está configurada en `app.js`.

## Nota

Si el navegador bloquea las solicitudes POST por CORS, no cambies el frontend todavía. Hay que ajustar el Apps Script para el mecanismo de comunicación que usemos finalmente.

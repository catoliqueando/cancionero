# Cancionero Catoliqueando

Cancionero parroquial estático, gratuito y preparado para GitHub Pages.

## La forma recomendada de agregar un canto

Cada canto vive en su propio archivo `.txt` dentro de la carpeta `cantos`.
Ya no es necesario escribir objetos de JavaScript ni crear páginas HTML.

1. Haz una copia de `plantillas/nuevo-canto.txt`.
2. Ponle un nombre único, en minúsculas y separado con guiones. Ejemplo:
   `pescador-de-hombres.txt`.
3. Completa `TITULO`, `CATEGORIA` y `LETRA`.
4. Los demás datos son opcionales y pueden quedar vacíos.
5. Guarda o sube el archivo dentro de la carpeta `cantos`.

Ejemplo:

```text
TITULO: Canto de ejemplo
CATEGORIA: Comunión
AUTOR:
COMPOSITOR:
ANO:
TONO:
YOUTUBE:
AUDIO:
OBSERVACIONES:
MOMENTO:

LETRA:
Aquí va el texto autorizado del canto.

Las estrofas pueden separarse con una línea vacía.
```

## Agregar acordes, YouTube o MP3

Todos estos datos son opcionales. Para colocar acordes, escríbelos dentro de la
letra justo antes de la sílaba donde deben aparecer:

```text
[C]La misa es una [F]fiesta muy a[C]legre,
[C]la misa es una [G]fiesta con Je[C]sús.
```

El canto se abrirá inicialmente sin acordes. El botón **Ver acordes** los muestra
y habilita los controles para subir o bajar el tono.

En `YOUTUBE` coloca el enlace completo del video. El reproductor solamente se
carga cuando el usuario pulsa **Ver video**. En `AUDIO` puedes colocar una URL
directa `https` a un MP3 o una ruta como `assets/audio/grabacion.mp3` si el archivo
está guardado dentro del repositorio.

El nombre del archivo se convierte automáticamente en el ID del canto.
Por ejemplo, `canto-de-ejemplo.txt` genera el ID `canto-de-ejemplo`.

## Agregar un canto directamente desde GitHub

1. Abre la carpeta `cantos` en el repositorio.
2. Selecciona **Add file > Create new file**.
3. Escribe el nombre del archivo terminado en `.txt`.
4. Copia la plantilla, agrega la letra y selecciona **Commit changes**.
5. La automatización revisará el archivo, actualizará el cancionero y publicará el sitio.

Si utilizas una categoría nueva, aparecerá automáticamente entre las categorías del
sitio después de la publicación.

## Si la letra está en PDF

No se recomienda publicar el PDF como fuente del canto. La extracción automática de
PDF puede unir versos, romper estrofas o mezclar columnas.

La opción segura es copiar el texto del PDF a la plantilla y revisar los saltos de
línea. También puedes adjuntar el PDF en Codex y pedir que se importe: el texto se
extraerá, se revisará y se convertirá al formato de la carpeta `cantos`.

## Cambiar la Misa de hoy

Abre el [Administrador de la Misa de hoy](https://catoliqueando.github.io/cancionero/admin-misa.html).
Allí puedes cambiar el título, seleccionar los cantos, repetir un momento, ordenar
la lista y descargar o copiar la configuración terminada.

Para publicarla:

1. Pulsa **Copiar configuración** en el administrador.
2. Pulsa **Abrir misa-hoy.json en GitHub** e inicia sesión si se solicita.
3. Reemplaza todo el contenido del archivo por la configuración copiada.
4. Selecciona **Commit changes**.

La publicación se ejecuta automáticamente. Cada versión usa una identificación
nueva y el sitio comprueba si hay cambios al abrirse o volver a la pestaña, para
que navegadores y celulares no mantengan una lista antigua.

También se puede editar `misa-hoy.json` manualmente. Cada `id` debe coincidir con
el nombre de un archivo de la carpeta `cantos`, sin la extensión `.txt`.

## Probar los cambios en la computadora

Después de agregar o editar cantos, ejecuta:

```text
node scripts/generar-cantos.js
```

Luego abre `index.html`. El archivo `cantos.js` es generado automáticamente y no
debe editarse a mano.

## Activar GitHub Pages por primera vez

1. Abre **Settings > Pages** en el repositorio.
2. En **Build and deployment**, selecciona **GitHub Actions**.
3. La acción “Actualizar y publicar el cancionero” se encargará de las siguientes publicaciones.

## Importante sobre las letras

Incluye únicamente letras que la parroquia tenga derecho o autorización para
reproducir: obras de dominio público, contenido con permiso o con la licencia
correspondiente.

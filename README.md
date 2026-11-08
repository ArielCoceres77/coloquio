# Coloquio Final · Auxiliar en IA · 2026

Inscripción en tiempo real al Coloquio Final del ISFD y T «República Federal de Alemania», El Colorado, Formosa. Se expone el **martes 17** (lugares 1 al 16) y el **martes 24 de noviembre** (lugares 17 al 32).

- **1 · Inscripción:** individual o en grupo de 2 o 3, apellido y nombres, proyecto (uno de los 30 de la lista u otro propio), nombre, objetivos, herramientas y logo obligatorio. Cada proyecto de la lista lo toma una sola inscripción y se bloquea para el resto al instante. Al terminar, el alumno toca el **bolillero** con su código y le sale su lugar de exposición.
- **2 · Expositores:** orden de exposición por martes, con el logo de cada proyecto. Cuando el profesor sortea, el número aparece en vivo en todas las pantallas.
- **3 · ADM:** botón **Iniciar** (desde ahí corren 12 horas), resultados, sorteo uno por uno o de una vez, descarga para Excel, impresión y botón para borrar todos los datos.

Hay 32 lugares: cada inscripción ocupa uno, sea individual o de un grupo.

Los datos se guardan en una planilla de Google Sheets y los logos en una carpeta de Google Drive (`Codigo.gs`). AG1 (https://arielcoceres77.github.io/ag01/) lee la misma planilla en el modo **Coloquio Final**.

## Conectar la planilla (una sola vez)

1. Crear una planilla nueva en Google Sheets.
2. Menú **Extensiones → Apps Script**. Borrar lo que haya, pegar `Codigo.gs` y guardar.
3. **Implementar → Nueva implementación → Tipo: App web**. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**.
4. Autorizar los permisos y copiar la **URL de la app web** (termina en `/exec`).
5. En `index.html`, reemplazar `__API__` por esa URL.

DIA · Didáctica con IA · Aprendé jugando

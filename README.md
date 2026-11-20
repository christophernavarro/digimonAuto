# XPath Auto Clicker

Extensión de Chrome/Edge (Manifest V3) que hace click automático cada X segundos en los elementos que coinciden con un XPath. Es genérica: la configuración se guarda por sitio (host).

## Instalación
1. Descarga esta carpeta (`extension/`).
2. Abre `chrome://extensions` (o `edge://extensions`) y activa **Modo de desarrollador**.
3. Pulsa **Cargar descomprimida** y selecciona la carpeta `extension`.
4. Recarga (F5) la pestaña del juego.

## Uso
1. Abre el popup de la extensión en la pestaña del juego.
2. Pega el XPath y pulsa **Probar** (resalta en rosa lo que encuentra). En DigiIdle el campo está oculto porque ya viene configurado.
3. Pulsa **Iniciar**. Para parar, **Detener**.

El intervalo es automático: entre 1 y 3 s al azar, y cada espera difiere en al menos 0,3 s de la anterior. No hay límite de clicks: sigue hasta que pulses **Detener**. Opciones: clickear todas las coincidencias o solo la primera, y solo elementos visibles. En la consola (F12) se ve el registro `[XPath Auto Clicker]`.

## DigiIdle: automático, sin escribir nada
En `digiidle.com` la extensión ya trae la configuración y **arranca sola** al cargar el juego:
cada 1–3 s al azar (siempre distinto al anterior) busca los Digimon caídos y lanza el scanner que tengas seleccionado en el juego
(el de `#caidos-bolas`). Cada cuerpo se clickea **una sola vez**, porque el juego permite
una tentativa por cuerpo.

Estructura real que arma el juego (`app.js`, `atualizarCaidos`):
```html
<div id="caidos-lista">
  <div class="caido" data-corpo="ID"> ... <button type="button" data-sc="scanner-basico">…</button></div>
</div>
```
XPath incluido:
```
//div[@id='caidos-lista']/div[contains(concat(' ',normalize-space(@class),' '),' caido ') and @data-corpo]/button
```
Si un probador de XPath da 0 resultados es normal cuando no hay nadie en el suelo: las filas
solo existen mientras hay Digimon caídos. Para pausarlo, pulsa **Detener** en el popup;
**Restaurar config de DigiIdle** vuelve a los valores incluidos.

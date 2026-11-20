# XPath Auto Clicker

Extensión de Chrome/Edge (Manifest V3) que hace click automático cada X segundos en los elementos que coinciden con un XPath. Es genérica: la configuración se guarda por sitio (host).

## Instalación
1. Descarga esta carpeta (`extension/`).
2. Abre `chrome://extensions` (o `edge://extensions`) y activa **Modo de desarrollador**.
3. Pulsa **Cargar descomprimida** y selecciona la carpeta `extension`.
4. Recarga (F5) la pestaña del juego.

## Uso
1. Abre el popup de la extensión en la pestaña del juego.
2. Pega el XPath, elige cada cuántos segundos, y pulsa **Probar XPath** (resalta en rosa lo que encuentra).
3. Pulsa **Iniciar**. Para parar, **Detener**.

Opciones: azar extra entre clicks, límite de clicks (0 = sin límite), clickear todas las coincidencias o solo la primera, y solo elementos visibles. En la consola (F12) se ve el registro `[XPath Auto Clicker]`.

## XPath para digiidle (escáner en los caídos)
```
//div[@class='caido']/button[@data-sc='scanner-basico']
```
También funciona `//div[@class='caido']/button/img[@class='item-ico ']/@src`: si el XPath apunta a un atributo, se clickea el elemento que lo contiene.

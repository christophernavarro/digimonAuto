// XPath Auto Clicker - content script
// La configuración se guarda por host en chrome.storage.local bajo la clave "cfg:<host>".
(() => {
  const KEY = "cfg:" + location.host;
  let timer = null;
  let cfg = null;
  let clicks = 0;

  const log = (...a) => console.log("%c[XPath Auto Clicker]", "color:#0a7", ...a);

  // Evalúa el XPath y devuelve elementos clickeables.
  // Si el XPath apunta a un atributo (ej. .../@src) se usa su elemento dueño.
  function resolver(xpath) {
    const res = document.evaluate(xpath, document, null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const out = [];
    for (let i = 0; i < res.snapshotLength; i++) {
      let n = res.snapshotItem(i);
      if (n.nodeType === Node.ATTRIBUTE_NODE) n = n.ownerElement;
      else if (n.nodeType === Node.TEXT_NODE) n = n.parentElement;
      if (n && n.nodeType === Node.ELEMENT_NODE && !out.includes(n)) out.push(n);
    }
    return out;
  }

  function visible(el) {
    if (!el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none";
  }

  function habilitado(el) {
    const b = el.closest("button, input, [aria-disabled]");
    if (!b) return true;
    return !b.disabled && b.getAttribute("aria-disabled") !== "true";
  }

  function tick() {
    if (!cfg || !cfg.enabled || !cfg.xpath) return;
    let els;
    try {
      els = resolver(cfg.xpath);
    } catch (e) {
      log("XPath inválido:", e.message);
      return;
    }
    els = els.filter(el => (!cfg.soloVisibles || visible(el)) && habilitado(el));
    if (cfg.modo !== "todos") els = els.slice(0, 1);
    for (const el of els) {
      el.click();
      clicks++;
    }
    if (els.length) log(`click en ${els.length} elemento(s). Total: ${clicks}`);
    if (cfg.maxClicks > 0 && clicks >= cfg.maxClicks) {
      log("Límite de clicks alcanzado, deteniendo.");
      chrome.storage.local.set({ [KEY]: { ...cfg, enabled: false } });
    }
  }

  function programar() {
    clearTimeout(timer);
    timer = null;
    if (!cfg || !cfg.enabled) return;
    const base = Math.max(0.2, Number(cfg.segundos) || 5) * 1000;
    const jitter = (Number(cfg.jitter) || 0) * 1000 * Math.random();
    timer = setTimeout(() => { tick(); programar(); }, base + jitter);
  }

  function aplicar(nuevo) {
    const estabaActivo = cfg && cfg.enabled;
    cfg = nuevo || null;
    if (cfg && cfg.enabled && !estabaActivo) {
      clicks = 0;
      log(`Activado: "${cfg.xpath}" cada ${cfg.segundos}s`);
    } else if (!(cfg && cfg.enabled) && estabaActivo) {
      log("Detenido.");
    }
    programar();
  }

  chrome.storage.local.get(KEY, r => aplicar(r[KEY]));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[KEY]) aplicar(changes[KEY].newValue);
  });

  // Mensajes desde el popup: probar XPath y obtener estado.
  chrome.runtime.onMessage.addListener((msg, _sender, responder) => {
    if (msg.tipo === "probar") {
      try {
        const els = resolver(msg.xpath);
        els.forEach(el => {
          const prev = el.style.outline;
          el.style.outline = "3px solid #f0c";
          setTimeout(() => (el.style.outline = prev), 2000);
        });
        responder({ ok: true, total: els.length, visibles: els.filter(visible).length });
      } catch (e) {
        responder({ ok: false, error: e.message });
      }
    } else if (msg.tipo === "estado") {
      responder({ clicks, activo: !!(cfg && cfg.enabled) });
    }
  });
})();

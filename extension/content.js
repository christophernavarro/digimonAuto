// XPath Auto Clicker - content script
// La configuración se guarda por host en chrome.storage.local bajo la clave "cfg:<host>".
(() => {
  const KEY = "cfg:" + location.host;
  let timer = null;
  let cfg = null;
  let clicks = 0;

  // Espera entre clicks: aleatoria entre MIN_SEG y MAX_SEG, y siempre al menos
  // DIF_MIN s distinta de la anterior, para que nunca se repita el mismo ritmo.
  const MIN_SEG = 1, MAX_SEG = 3, DIF_MIN = 0.3;
  let ultimaEspera = 0;
  function siguienteEspera() {
    let s;
    do s = MIN_SEG + Math.random() * (MAX_SEG - MIN_SEG);
    while (Math.abs(s - ultimaEspera) < DIF_MIN);
    ultimaEspera = s;
    return s;
  }

  // Configuración incluida para sitios conocidos: se activa sola sin escribir nada.
  // DigiIdle: cada Digimon caído es <div class="caido" data-corpo="ID"> dentro de
  // #caidos-lista, con un <button> que lanza el scanner elegido. Solo se permite
  // una tentativa por cuerpo, así que cada cuerpo se clickea una sola vez.
  const PRESETS = {
    "digiidle.com": {
      xpath: "//div[@id='caidos-lista']/div[contains(concat(' ',normalize-space(@class),' '),' caido ') and @data-corpo]/button",
      modo: "todos",
      soloVisibles: false,
      unaVez: true,
      enabled: true,
    },
  };
  const preset = Object.entries(PRESETS)
    .find(([h]) => location.host === h || location.host.endsWith("." + h))?.[1] || null;

  // Cuerpos ya clickeados (data-corpo -> momento), para no gastar dos veces en el mismo.
  const usados = new Map();

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
    const ahora = Date.now();
    for (const [id, t] of usados) if (ahora - t > 120000) usados.delete(id);
    const idDe = el => el.closest("[data-corpo]")?.dataset.corpo;
    if (cfg.unaVez) els = els.filter(el => !idDe(el) || !usados.has(idDe(el)));
    if (cfg.modo !== "todos") els = els.slice(0, 1);
    for (const el of els) {
      const id = idDe(el);
      if (id) usados.set(id, ahora);
      el.click();
      clicks++;
    }
    if (els.length) log(`click en ${els.length} elemento(s). Total: ${clicks}`);
  }

  function programar() {
    clearTimeout(timer);
    timer = null;
    if (!cfg || !cfg.enabled) return;
    const seg = siguienteEspera();
    timer = setTimeout(() => { tick(); programar(); }, seg * 1000);
  }

  function aplicar(nuevo) {
    const estabaActivo = cfg && cfg.enabled;
    cfg = nuevo || null;
    if (cfg && cfg.enabled && !estabaActivo) {
      clicks = 0;
      log(`Activado: "${cfg.xpath}" cada ${MIN_SEG}–${MAX_SEG} s al azar`);
    } else if (!(cfg && cfg.enabled) && estabaActivo) {
      log("Detenido.");
    }
    programar();
  }

  chrome.storage.local.get(KEY, r => aplicar(r[KEY] || preset));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[KEY]) aplicar(changes[KEY].newValue || preset);
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
      responder({ host: location.host, clicks, activo: !!(cfg && cfg.enabled), cfg, preset });
    }
  });
})();

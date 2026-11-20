const $ = id => document.getElementById(id);
const campos = ["xpath", "modo", "soloVisibles", "unaVez"];
let tab, KEY, cfg = {};

function leerForm() {
  return {
    xpath: $("xpath").value.trim(),
    modo: $("modo").value,
    soloVisibles: $("soloVisibles").checked,
    unaVez: $("unaVez").checked,
  };
}

function pintar() {
  for (const c of campos) {
    if (cfg[c] === undefined) continue;
    if (c === "soloVisibles" || c === "unaVez") $(c).checked = cfg[c];
    else $(c).value = cfg[c];
  }
  $("toggle").textContent = cfg.enabled ? "Detener" : "Iniciar";
  $("toggle").classList.toggle("on", !!cfg.enabled);
}

function msg(texto, error) {
  $("msg").textContent = texto;
  $("msg").className = "msg" + (error ? " err" : "");
}

function enviar(mensaje) {
  return new Promise(res => chrome.tabs.sendMessage(tab.id, mensaje, r => {
    if (chrome.runtime.lastError) res(null); else res(r);
  }));
}

async function guardar(extra = {}) {
  cfg = { ...cfg, ...leerForm(), ...extra };
  await chrome.storage.local.set({ [KEY]: cfg });
  pintar();
}

(async () => {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // El host lo informa el content script (tab.url no siempre está disponible).
  const estado = await enviar({ tipo: "estado" });
  if (!estado) {
    msg("No hay conexión con la página. Recárgala (F5) e intenta de nuevo.", true);
    return;
  }
  const host = estado.host;
  $("host").textContent = host;
  KEY = "cfg:" + host;
  // Si no hay nada guardado, se muestra la config que usa la página (preset incluido).
  cfg = (await chrome.storage.local.get(KEY))[KEY] || estado.cfg || {};
  pintar();
  // En sitios con config incluida (DigiIdle) el XPath queda oculto: no hace falta tocarlo.
  if (!estado.preset) $("campoXpath").hidden = false;
  if (estado.preset) {
    $("preset").hidden = false;
    $("preset").onclick = async () => {
      cfg = { ...estado.preset };
      pintar();
      await chrome.storage.local.set({ [KEY]: cfg });
      msg("Config de DigiIdle restaurada.");
    };
  }
  if (estado.activo) msg(`Activo. Clicks hechos: ${estado.clicks}`);

  campos.forEach(c => $(c).addEventListener("change", () => guardar()));

  $("probar").onclick = async () => {
    const r = await enviar({ tipo: "probar", xpath: leerForm().xpath });
    if (!r) return msg("No hay conexión con la página. Recárgala.", true);
    if (!r.ok) return msg("XPath inválido: " + r.error, true);
    msg(`Coincidencias: ${r.total} (visibles: ${r.visibles}). Resaltadas en rosa.`, r.total === 0);
  };

  $("toggle").onclick = async () => {
    if (!cfg.enabled && !leerForm().xpath) return msg("Escribe un XPath primero.", true);
    await guardar({ enabled: !cfg.enabled });
    msg(cfg.enabled ? "Iniciado." : "Detenido.");
  };
})();

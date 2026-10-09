import { S, MESI, addDays, iso, todayIdx, isCurrentWeek, nextMonday, rangeLabel, esc, grams, isBuy } from "./stato.js";
import { DAYS, MEALS, CAT_ORDER, NO_SHOP, category } from "./dieta.js";

/* ---------- Lista della spesa ---------- */
function shoppingList(){
  const map = new Map();
  DAYS.forEach((day, d) => {
    for (const [m] of MEALS){
      day.meals[m].forEach((opts, i) => {
        const j = S.data.choices[`${d}-${m}-${i}`] || 0;
        const [n, g] = opts[j] || opts[0];
        if (g == null || NO_SHOP.has(n)) return;
        if (!map.has(n)) map.set(n, { n, g:0, days:new Set(), cat:category(n) });
        const it = map.get(n); it.g += g; it.days.add(day.short);
      });
    }
  });
  return [...map.values()].sort((a,b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || a.n.localeCompare(b.n, "it"));
}
function qtyLabel(it){
  if (it.n.startsWith("Uova")) return `${grams(it.g)} <small>circa ${Math.round(it.g/60)} uova</small>`;
  return grams(it.g);
}

/* ---------- Viste ---------- */
function viewLogin(){
  return `<div class="wrap center"><div class="hero">
    <h1>Piano<br>alimentare</h1>
    <p>La settimana della dieta, le alternative per ogni pasto e la lista della spesa, condivise con la famiglia su tutti i dispositivi.</p>
    ${S.error ? `<div class="error">${esc(S.error)}</div>` : ""}
    <button class="btn" data-action="login">Accedi con Google</button>
  </div></div>`;
}
function viewSetup(){
  return `<div class="wrap center"><div class="hero" style="width:100%">
    <h1>Ciao!</h1>
    <p>Per condividere il piano serve una famiglia. Chi inizia la crea e manda il codice agli altri.</p>
    ${S.error ? `<div class="error">${esc(S.error)}</div>` : ""}
    <div class="stack">
      <button class="btn" data-action="create" ${S.busy ? "disabled" : ""}>Crea la famiglia</button>
      <div class="or">oppure, se hai ricevuto un codice</div>
      <input class="field" id="join-code" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="Codice invito" aria-label="Codice invito">
      <button class="btn ghost" data-action="join" ${S.busy ? "disabled" : ""}>Entra nella famiglia</button>
      <button class="btn small ghost" data-action="logout" style="margin-top:14px;justify-self:start">Esci dall'account</button>
    </div>
  </div></div>`;
}

function viewTop(){
  return `<div class="top"><div class="wrap">
    <div class="weeknav">
      <button class="iconbtn" data-action="week" data-delta="-1" aria-label="Settimana precedente">‹</button>
      <div class="range">${rangeLabel()}</div>
      <button class="iconbtn" data-action="week" data-delta="1" aria-label="Settimana successiva">›</button>
    </div>
    ${isCurrentWeek() ? "" : `<button class="today-btn" data-action="week" data-delta="0">Oggi</button>`}
  </div></div>`;
}

function viewPiano(){
  const day = DAYS[S.day], date = addDays(S.week, S.day), cur = isCurrentWeek(), t = todayIdx();
  const strip = DAYS.map((d, i) => {
    const dt = addDays(S.week, i);
    return `<button class="day ${i === S.day ? "on" : ""} ${cur && i === t ? "is-today" : ""}" data-action="day" data-i="${i}" aria-label="${d.name} ${dt.getDate()}">
      <span class="wd">${d.short}</span><span class="dn">${dt.getDate()}</span></button>`;
  }).join("");

  const meals = MEALS.map(([m, label]) => {
    const rows = day.meals[m].map((opts, i) => {
      const key = `${S.day}-${m}-${i}`, j = S.data.choices[key] || 0;
      const [n, g] = opts[j] || opts[0];
      if (opts.length === 1) return `<div class="row"><span class="name">${esc(n)}</span><span class="g">${grams(g)}</span></div>`;
      const hint = j > 0 ? `invece di ${esc(opts[0][0].toLowerCase())}` : `${opts.length - 1} ${opts.length === 2 ? "alternativa" : "alternative"}`;
      return `<button class="row ${j > 0 ? "swapped" : ""}" data-action="swap" data-m="${m}" data-i="${i}">
        <span class="name">${esc(n)}<span class="hint">${hint}</span></span><span class="g">${grams(g)}</span></button>`;
    }).join("");
    return `<section class="meal"><h2>${label}</h2>${rows}</section>`;
  }).join("");

  return `<div class="wrap">
    <div class="days">${strip}</div>
    <div class="dayhead"><h1>${day.name}</h1><p>${date.getDate()} ${MESI[date.getMonth()]}${cur && S.day === t ? ", oggi" : ""}</p></div>
    <div class="meals">${meals}</div>
  </div>`;
}

function viewSpesa(){
  const list = shoppingList(); S.shop = list;
  const T = S.data.toBuy;
  const extras = Object.entries(S.data.extras).sort((a,b) => a[0].localeCompare(b[0]));
  const indexed = list.map((it, idx) => [it, idx]);
  const buyItems = indexed.filter(([it]) => T[it.n]);
  const buyExtras = extras.filter(([,x]) => isBuy(x));
  const n = buyItems.length + buyExtras.length;

  const tiles = buyItems.map(([it, idx]) => `<button class="tile" data-action="buy" data-idx="${idx}" aria-label="${esc(it.n)}: segna come comprato">
      <span class="t-name">${esc(it.n)}</span><span class="t-qty">${grams(it.g)}</span></button>`)
    .concat(buyExtras.map(([id, x]) => `<button class="tile" data-action="extra-toggle" data-id="${id}" aria-label="${esc(x.t)}: segna come comprato">
      <span class="t-name">${esc(x.t)}</span></button>`)).join("");

  const groups = CAT_ORDER.map(cat => {
    const items = indexed.filter(([it]) => it.cat === cat && !T[it.n]);
    if (!items.length) return "";
    return `<section class="group"><h3>${cat}</h3>${items.map(([it, idx]) => `<button class="item" data-action="buy" data-idx="${idx}" aria-label="${esc(it.n)}: aggiungi alle cose da comprare">
        <span class="plus" aria-hidden="true">+</span>
        <span class="txt">${esc(it.n)}<small>${[...it.days].join(", ")}</small></span>
        <span class="qty">${qtyLabel(it)}</span></button>`).join("")}</section>`;
  }).join("");

  const others = extras.filter(([,x]) => !isBuy(x));
  const otherGroup = others.length ? `<section class="group"><h3>Altri prodotti</h3>${others.map(([id, x]) => `<div class="item">
      <button class="plus" data-action="extra-toggle" data-id="${id}" aria-label="${esc(x.t)}: aggiungi alle cose da comprare">+</button>
      <span class="txt">${esc(x.t)}</span>
      <button class="del" data-action="extra-del" data-id="${id}" aria-label="Elimina ${esc(x.t)}">×</button></div>`).join("")}</section>` : "";

  return `<div class="wrap">
    <section class="tobuy">
      <div class="tobuy-head"><h2>Cose da comprare</h2><span class="count">${n}</span></div>
      ${n ? `<div class="tiles">${tiles}</div><p class="tobuy-note">Tocca un prodotto quando l'hai comprato: torna nell'elenco qui sotto.</p>`
          : `<p class="tobuy-note">Niente da comprare. Tocca i prodotti dell'elenco qui sotto per aggiungerli.</p>`}
      <div class="addrow"><input id="extra-input" placeholder="Aggiungi un altro prodotto" aria-label="Aggiungi un altro prodotto" enterkeyhint="done">
        <button class="btn small" data-action="extra-add">Aggiungi</button></div>
      ${n ? `<div class="tobuy-actions"><button class="btn small light" data-action="copy-list">Copia la lista</button><button class="btn small light" data-action="all-bought">Tutto comprato</button></div>` : ""}
    </section>
    <h2 class="sec-title">Elenco della settimana</h2>
    <p class="sub">Quantità per la settimana del ${rangeLabel()}, calcolate sulle scelte del piano. Tocca un prodotto per aggiungerlo alle cose da comprare.</p>
    ${groups}${otherGroup}
  </div>`;
}

function viewFamiglia(){
  return `<div class="wrap">
    <h2 class="sec-title">Famiglia</h2>
    <p class="sub">${S.members === 1 ? "Per ora ci sei solo tu." : `${S.members} persone condividono questo piano.`}</p>
    <div class="panel">
      <h3>Codice invito</h3>
      <p>Chi apre l'app per la prima volta accede con Google e inserisce questo codice.</p>
      <div class="code">${esc(S.familyId)}</div>
      <button class="btn" data-action="share">Condividi il codice</button>
    </div>
    <div class="panel">
      <h3>Installa sulla schermata Home</h3>
      <p>In Chrome tocca il menu ⋮ e scegli "Installa app" o "Aggiungi a schermata Home". L'app funziona anche senza connessione e si aggiorna appena torni online.</p>
    </div>
    <div class="panel">
      <h3>Account</h3>
      <p>Accesso con ${esc(S.user.email || S.user.displayName || "Google")}.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn ghost" data-action="logout">Esci dall'account</button>
        <button class="btn danger" data-action="leave">Esci dalla famiglia</button>
      </div>
    </div>
  </div>`;
}

function viewSheet(){
  if (!S.sheet) return "";
  const { m, i } = S.sheet, opts = DAYS[S.day].meals[m][i];
  const key = `${S.day}-${m}-${i}`, sel = S.data.choices[key] || 0;
  const label = MEALS.find(x => x[0] === m)[1];
  return `<div class="scrim" data-action="close"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Scegli un'alternativa">
    <header><h3>Scegli un'alternativa</h3><p>${label} di ${DAYS[S.day].name.toLowerCase()}</p></header>
    <div class="list">${opts.map(([n, g], j) => `<button class="opt ${j === sel ? "on" : ""}" data-action="pick" data-j="${j}">
      <span class="dot"></span><span class="name">${esc(n)}${j === 0 ? "<small>previsto dalla dieta</small>" : ""}</span><span class="g">${grams(g)}</span></button>`).join("")}</div>
    <footer><button class="btn ghost" data-action="close">Chiudi</button></footer>
  </div>`;
}

function viewPianifica(){
  const w = S.planWeek, C = S.planData.choices;
  const isNext = iso(w) === iso(nextMonday());
  const days = DAYS.map((day, d) => {
    const dt = addDays(w, d);
    const meals = MEALS.map(([m, label]) => {
      const rows = day.meals[m].map((opts, i) => {
        const j = C[`${d}-${m}-${i}`] || 0;
        const [n, g] = opts[j] || opts[0];
        if (opts.length === 1) return `<div class="pl-fixed"><span>${esc(n)}</span><span>${grams(g)}</span></div>`;
        return `<select class="pl-sel ${j > 0 ? "swapped" : ""}" data-d="${d}" data-m="${m}" data-i="${i}" aria-label="${label} di ${day.name}">${
          opts.map(([on, og], k) => `<option value="${k}" ${k === j ? "selected" : ""}>${esc(on)}${og != null ? ` · ${og} g` : ""}</option>`).join("")
        }</select>`;
      }).join("");
      return `<div class="pl-meal"><h4>${label}</h4>${rows}</div>`;
    }).join("");
    return `<section class="pl-day"><h3>${day.name}<span>${dt.getDate()} ${MESI[dt.getMonth()].slice(0,3)}</span></h3>${meals}</section>`;
  }).join("");
  const n = Object.keys(C).length;
  return `<div class="wrap wide">
    <h2 class="sec-title">Organizza la settimana</h2>
    <p class="sub">Scegli i pasti di tutta la settimana in una sola schermata. Le scelte si salvano subito e le vede tutta la famiglia.</p>
    <div class="pl-nav">
      <button class="iconbtn" data-action="plan-week" data-delta="-1" aria-label="Settimana precedente">‹</button>
      <span class="range">${rangeLabel(w)}</span>
      <button class="iconbtn" data-action="plan-week" data-delta="1" aria-label="Settimana successiva">›</button>
      ${isNext ? `<span class="pl-tag">Prossima settimana</span>` : `<button class="today-btn" data-action="plan-week" data-delta="0">Vai alla prossima</button>`}
    </div>
    <div class="pl-actions">
      <button class="btn small ghost" data-action="plan-copy">Copia la settimana prima</button>
      <button class="btn small ghost" data-action="plan-reset" ${n ? "" : "disabled"}>Torna al piano previsto</button>
      <button class="btn small" data-action="plan-shop">Lista della spesa di questa settimana</button>
    </div>
    <p class="sub">${n ? `${n} ${n === 1 ? "sostituzione" : "sostituzioni"} rispetto al piano previsto (in rosso).` : "Nessuna sostituzione: è il piano previsto dalla dieta."}</p>
    <div class="pl-grid">${days}</div>
  </div>`;
}

function viewMain(){
  const content = S.tab === "spesa" ? viewSpesa() : S.tab === "famiglia" ? viewFamiglia() : S.tab === "pianifica" ? viewPianifica() : viewPiano();
  const tab = (id, ic, label) => `<button class="${S.tab === id ? "on" : ""}" data-action="tab" data-tab="${id}"><span class="ic" aria-hidden="true">${ic}</span>${label}</button>`;
  return `${S.tab === "famiglia" || S.tab === "pianifica" ? "" : viewTop()}
    <main>${S.error ? `<div class="wrap"><div class="error">${esc(S.error)} <button data-action="dismiss" style="text-decoration:underline">Chiudi</button></div></div>` : ""}${content}</main>
    <nav class="nav"><div class="wrap">${tab("piano","◐","Piano")}${tab("pianifica","▦","Organizza")}${tab("spesa","☰","Spesa")}${tab("famiglia","◎","Famiglia")}</div></nav>
    ${viewSheet()}
    ${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ""}`;
}

export function render(){
  const root = document.getElementById("app");
  const inp = document.getElementById("extra-input") || document.getElementById("join-code");
  const keep = inp ? { id: inp.id, v: inp.value, f: document.activeElement === inp } : null;

  if (!S.authReady || (S.user && !S.profileLoaded)) root.innerHTML = `<div class="loading">Caricamento…</div>`;
  else if (!S.user) root.innerHTML = viewLogin();
  else if (!S.familyId) root.innerHTML = viewSetup();
  else root.innerHTML = viewMain();

  if (keep){
    const el = document.getElementById(keep.id);
    if (el){ el.value = keep.v; if (keep.f) el.focus(); }
  }
}

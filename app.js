import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, deleteField, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { S, mondayOf, addDays, iso, todayIdx, isCurrentWeek, nextMonday, isBuy, grams } from "./stato.js";
import { render } from "./viste.js";

/* ---------- Configurazione Firebase ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyCSPV4OnNXEHhFZx2BTCSpoDqrv-aALVe8",
  authDomain: "piano-alimentare-e1303.firebaseapp.com",
  projectId: "piano-alimentare-e1303",
  storageBucket: "piano-alimentare-e1303.firebasestorage.app",
  messagingSenderId: "500554901052",
  appId: "1:500554901052:web:4bd42166d2caa29f5d0539"
};
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
let db;
try {
  db = initializeFirestore(fbApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  db = getFirestore(fbApp);
}

let unsubWeek = null, unsubFam = null, unsubPlan = null, toastTimer = null;
function toast(msg){ S.toast = msg; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { S.toast = ""; render(); }, 2200); }
function fail(prefix){ return e => { console.error(e); S.error = `${prefix} (${e.code || e.message}).`; S.busy = false; render(); }; }

/* ---------- Accesso ---------- */
getRedirectResult(auth).catch(fail("Accesso non riuscito"));

onAuthStateChanged(auth, async u => {
  S.user = u; S.authReady = true; detach();
  if (!u){ S.familyId = null; S.profileLoaded = true; render(); return; }
  S.profileLoaded = false; render();
  try {
    const snap = await getDoc(doc(db, "users", u.uid));
    S.familyId = snap.exists() ? (snap.data().familyId || null) : null;
  } catch (e) { console.error(e); S.familyId = null; }
  S.profileLoaded = true;
  if (S.familyId) attach();
  render();
});

async function login(){
  S.error = ""; const provider = new GoogleAuthProvider();
  try { await signInWithPopup(auth, provider); }
  catch (e){
    if (["auth/popup-blocked","auth/operation-not-supported-in-this-environment","auth/web-storage-unsupported"].includes(e.code)) {
      await signInWithRedirect(auth, provider);
    } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      fail("Accesso non riuscito")(e);
    }
  }
}

/* ---------- Famiglia ---------- */
function newCode(){
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const r = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(r, x => A[x % A.length]).join("");
}
async function createFamily(){
  S.busy = true; S.error = ""; render();
  const code = newCode(), uid = S.user.uid;
  try {
    await setDoc(doc(db, "families", code), { members:[uid], createdAt: serverTimestamp() });
    await setDoc(doc(db, "users", uid), { familyId: code });
    S.familyId = code; S.busy = false; attach(); S.tab = "famiglia"; render();
  } catch (e){ fail("Creazione della famiglia non riuscita")(e); }
}
async function joinFamily(raw){
  const code = (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 8){ S.error = "Il codice ha 8 caratteri: controlla di averlo scritto tutto."; render(); return; }
  S.busy = true; S.error = ""; render();
  const uid = S.user.uid;
  try {
    await updateDoc(doc(db, "families", code), { members: arrayUnion(uid) });
    await setDoc(doc(db, "users", uid), { familyId: code });
    S.familyId = code; S.busy = false; attach(); render();
  } catch (e){
    console.error(e); S.busy = false;
    S.error = (e.code === "not-found" || e.code === "permission-denied")
      ? "Codice non trovato. Controlla di averlo scritto bene."
      : `Non riesco a entrare nella famiglia (${e.code}).`;
    render();
  }
}
async function leaveFamily(){
  if (!confirm("Vuoi uscire dalla famiglia? Il piano condiviso resterà agli altri membri.")) return;
  const uid = S.user.uid, fid = S.familyId;
  detach();
  try {
    await updateDoc(doc(db, "families", fid), { members: arrayRemove(uid) });
  } catch (e){ console.error(e); }
  await setDoc(doc(db, "users", uid), { familyId: null }).catch(console.error);
  S.familyId = null; S.tab = "piano"; render();
}
async function shareCode(){
  const text = `Ecco il codice per il nostro piano alimentare: ${S.familyId}\n${location.href.split("#")[0]}`;
  try {
    if (navigator.share) await navigator.share({ title:"Piano alimentare", text });
    else { await navigator.clipboard.writeText(S.familyId); toast("Codice copiato"); }
  } catch (e){ /* condivisione annullata */ }
}

/* ---------- Sincronizzazione ---------- */
function weekRef(w = S.week){ return doc(db, "families", S.familyId, "weeks", iso(w)); }
function attach(){
  if (unsubFam) unsubFam();
  unsubFam = onSnapshot(doc(db, "families", S.familyId),
    s => { S.members = s.exists() ? (s.data().members || []).length : 0; render(); },
    fail("Non riesco a leggere la famiglia"));
  watchWeek();
  watchPlan();
}
function watchWeek(){
  if (unsubWeek) unsubWeek();
  S.data = { choices:{}, toBuy:{}, extras:{} };
  unsubWeek = onSnapshot(weekRef(), s => {
    const d = s.data() || {};
    S.data = { choices: d.choices || {}, toBuy: d.toBuy || {}, extras: d.extras || {} };
    render();
  }, fail("Non riesco a leggere la settimana"));
}
function watchPlan(){
  if (unsubPlan) unsubPlan();
  S.planData = { choices:{}, toBuy:{}, extras:{} };
  unsubPlan = onSnapshot(weekRef(S.planWeek), s => {
    const d = s.data() || {};
    S.planData = { choices: d.choices || {}, toBuy: d.toBuy || {}, extras: d.extras || {} };
    render();
  }, fail("Non riesco a leggere la settimana da organizzare"));
}
function detach(){ if (unsubWeek) unsubWeek(); if (unsubFam) unsubFam(); if (unsubPlan) unsubPlan(); unsubWeek = unsubFam = unsubPlan = null; }

function save(data, w = S.week){ setDoc(weekRef(w), data, { merge:true }).catch(fail("Modifica non salvata")); }

/* ---------- Organizza la settimana ---------- */
function planChoice(key, j){ save({ choices: { [key]: j === 0 ? deleteField() : j } }, S.planWeek); }
function planWeek(delta){
  S.planWeek = delta === 0 ? nextMonday() : addDays(S.planWeek, 7*delta);
  watchPlan(); render();
}
async function replacePlanChoices(choices){
  const ref = weekRef(S.planWeek);
  try { await updateDoc(ref, { choices }); }
  catch (e){ await setDoc(ref, { choices }, { merge:true }); }
}
async function planCopyPrevious(){
  if (Object.keys(S.planData.choices).length && !confirm("Le scelte già fatte per questa settimana verranno sostituite. Continuare?")) return;
  try {
    const snap = await getDoc(weekRef(addDays(S.planWeek, -7)));
    const choices = snap.exists() ? (snap.data().choices || {}) : {};
    await replacePlanChoices(choices);
    toast(Object.keys(choices).length ? "Scelte copiate dalla settimana prima" : "La settimana prima seguiva il piano previsto");
  } catch (e){ fail("Copia non riuscita")(e); }
}
async function planReset(){
  if (!confirm("Vuoi tornare al piano previsto dalla dieta per tutta la settimana?")) return;
  try { await replacePlanChoices({}); toast("Piano previsto ripristinato"); }
  catch (e){ fail("Ripristino non riuscito")(e); }
}
function planToShopping(){
  S.week = new Date(S.planWeek); S.day = isCurrentWeek() ? todayIdx() : 0;
  watchWeek(); S.tab = "spesa"; render(); scrollTo(0,0);
}
function setChoice(key, j){ save({ choices: { [key]: j === 0 ? deleteField() : j } }); }
function toggleBuy(name){ save({ toBuy: { [name]: S.data.toBuy[name] ? deleteField() : true } }); }
function addExtra(t){
  t = t.trim(); if (!t) return;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  save({ extras: { [id]: { t, buy:true } } });
}
function toggleExtra(id){ const x = S.data.extras[id]; if (x) save({ extras: { [id]: { t:x.t, buy:!isBuy(x) } } }); }
function deleteExtra(id){ save({ extras: { [id]: deleteField() } }); }
function allBought(){
  if (!confirm("Segnare tutto come comprato?")) return;
  const extras = {};
  for (const [id,x] of Object.entries(S.data.extras)) extras[id] = { t:x.t, buy:false };
  updateDoc(weekRef(), { toBuy: {}, extras }).catch(fail("Modifica non salvata"));
}
async function copyList(){
  const lines = S.shop.filter(it => S.data.toBuy[it.n]).map(it => `- ${it.n} (${grams(it.g)})`)
    .concat(Object.values(S.data.extras).filter(isBuy).map(x => `- ${x.t}`));
  try { await navigator.clipboard.writeText(lines.join("\n")); toast("Lista copiata"); }
  catch (e){ toast("Non riesco a copiare la lista"); }
}

function goWeek(delta){
  S.week = delta === 0 ? mondayOf(new Date()) : addDays(S.week, 7*delta);
  S.day = isCurrentWeek() ? todayIdx() : 0;
  watchWeek(); render();
}

/* ---------- Eventi ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-action]"); if (!b) return;
  const a = b.dataset.action;
  if (a === "login") login();
  else if (a === "logout") { detach(); signOut(auth); }
  else if (a === "create") createFamily();
  else if (a === "join") joinFamily(document.getElementById("join-code").value);
  else if (a === "leave") leaveFamily();
  else if (a === "share") shareCode();
  else if (a === "tab") { S.tab = b.dataset.tab; S.sheet = null; render(); scrollTo(0,0); }
  else if (a === "week") goWeek(+b.dataset.delta);
  else if (a === "day") { S.day = +b.dataset.i; render(); }
  else if (a === "swap") { S.sheet = { m:b.dataset.m, i:+b.dataset.i }; render(); }
  else if (a === "pick") { const { m, i } = S.sheet; setChoice(`${S.day}-${m}-${i}`, +b.dataset.j); S.sheet = null; render(); }
  else if (a === "close") { S.sheet = null; render(); }
  else if (a === "buy") { const it = S.shop[+b.dataset.idx]; if (it) toggleBuy(it.n); }
  else if (a === "all-bought") allBought();
  else if (a === "copy-list") copyList();
  else if (a === "extra-add") { const el = document.getElementById("extra-input"); addExtra(el.value); el.value = ""; }
  else if (a === "extra-toggle") toggleExtra(b.dataset.id);
  else if (a === "extra-del") deleteExtra(b.dataset.id);
  else if (a === "dismiss") { S.error = ""; render(); }
  else if (a === "plan-week") planWeek(+b.dataset.delta);
  else if (a === "plan-copy") planCopyPrevious();
  else if (a === "plan-reset") planReset();
  else if (a === "plan-shop") planToShopping();
});
document.addEventListener("change", e => {
  const sel = e.target.closest(".pl-sel"); if (!sel) return;
  planChoice(`${sel.dataset.d}-${sel.dataset.m}-${sel.dataset.i}`, +sel.value);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && S.sheet){ S.sheet = null; render(); }
  if (e.key === "Enter" && e.target.id === "extra-input"){ addExtra(e.target.value); e.target.value = ""; }
  if (e.key === "Enter" && e.target.id === "join-code"){ joinFamily(e.target.value); }
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
render();

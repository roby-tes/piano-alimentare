import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, deleteField, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { S, mondayOf, addDays, iso, todayIdx, isCurrentWeek } from "./stato.js";
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

let unsubWeek = null, unsubFam = null, toastTimer = null;
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
function weekRef(){ return doc(db, "families", S.familyId, "weeks", iso(S.week)); }
function attach(){
  if (unsubFam) unsubFam();
  unsubFam = onSnapshot(doc(db, "families", S.familyId),
    s => { S.members = s.exists() ? (s.data().members || []).length : 0; render(); },
    fail("Non riesco a leggere la famiglia"));
  watchWeek();
}
function watchWeek(){
  if (unsubWeek) unsubWeek();
  S.data = { choices:{}, checked:{}, extras:{} };
  unsubWeek = onSnapshot(weekRef(), s => {
    const d = s.data() || {};
    S.data = { choices: d.choices || {}, checked: d.checked || {}, extras: d.extras || {} };
    render();
  }, fail("Non riesco a leggere la settimana"));
}
function detach(){ if (unsubWeek) unsubWeek(); if (unsubFam) unsubFam(); unsubWeek = unsubFam = null; }

function save(data){ setDoc(weekRef(), data, { merge:true }).catch(fail("Modifica non salvata")); }
function setChoice(key, j){ save({ choices: { [key]: j === 0 ? deleteField() : j } }); }
function toggleChecked(name){ save({ checked: { [name]: S.data.checked[name] ? deleteField() : true } }); }
function addExtra(t){
  t = t.trim(); if (!t) return;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  save({ extras: { [id]: { t, done:false } } });
}
function toggleExtra(id){ const x = S.data.extras[id]; if (x) save({ extras: { [id]: { t:x.t, done:!x.done } } }); }
function deleteExtra(id){ save({ extras: { [id]: deleteField() } }); }
function clearChecks(){
  const extras = {};
  for (const [id,x] of Object.entries(S.data.extras)) extras[id] = { t:x.t, done:false };
  updateDoc(weekRef(), { checked: {}, extras }).catch(() => {});
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
  else if (a === "check") { const it = S.shop[+b.dataset.idx]; if (it) toggleChecked(it.n); }
  else if (a === "clear") clearChecks();
  else if (a === "extra-add") { const el = document.getElementById("extra-input"); addExtra(el.value); el.value = ""; }
  else if (a === "extra-toggle") toggleExtra(b.dataset.id);
  else if (a === "extra-del") deleteExtra(b.dataset.id);
  else if (a === "dismiss") { S.error = ""; render(); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && S.sheet){ S.sheet = null; render(); }
  if (e.key === "Enter" && e.target.id === "extra-input"){ addExtra(e.target.value); e.target.value = ""; }
  if (e.key === "Enter" && e.target.id === "join-code"){ joinFamily(e.target.value); }
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
render();

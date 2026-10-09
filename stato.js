/* ---------- Date ---------- */
export const MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
export function mondayOf(d){ const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay()+6)%7)); return x; }
export function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
export function iso(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
export function todayIdx(){ return (new Date().getDay()+6)%7; }
export function isCurrentWeek(){ return iso(S.week) === iso(mondayOf(new Date())); }
export function nextMonday(){ return addDays(mondayOf(new Date()), 7); }
export function rangeLabel(w = S.week){
  const a = w, b = addDays(w,6);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MESI[b.getMonth()]}`;
  return `${a.getDate()} ${MESI[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MESI[b.getMonth()].slice(0,3)}`;
}

/* ---------- Stato ---------- */
export const S = {
  user:null, authReady:false, profileLoaded:false, familyId:null, members:0,
  tab:"piano", week:mondayOf(new Date()), day:todayIdx(),
  data:{ choices:{}, checked:{}, extras:{} },
  planWeek:addDays(mondayOf(new Date()), 7), planData:{ choices:{}, checked:{}, extras:{} },
  sheet:null, error:"", busy:false, toast:"", shop:[]
};

export function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
export function grams(g){ if (g == null) return ""; return g >= 1000 ? `${String(Math.round(g/100)/10).replace(".",",")} kg` : `${g} g`; }

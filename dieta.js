/* ---------- Dieta (dal PDF della dietista) ----------
   Ogni pasto è una lista di alimenti; ogni alimento è una lista di opzioni [nome, grammi].
   La prima opzione è quella prevista, le altre sono le alternative indicate per quel pasto. */
const COLAZIONE = [
  [["Latte d'avena - Isola Bio",150]],
  [["Caffè in tazza",40]],
  [["Fette biscottate integrali",20]],
  [["Confettura extra di ciliegie rosse - Hero",20]],
  [["Cereali da colazione (media)",20],["Cornflakes",20],["Biscotti ai cereali - Misura",20]]
];
const KEFIR = [[["Kefir di latte biologico",100]]];
const OLIO = [[["Olio extravergine di oliva",30]]];

export const DAYS = [
  { name:"Lunedì", short:"Lun", meals:{
    colazione: COLAZIONE,
    pranzo: [
      [["Pasta di semola integrale",70],["Riso integrale",70],["Riso basmati (peso crudo)",70],["Couscous",70],["Patate",200]],
      [["Pesto alla genovese",40],["Pomodori da insalata",200],["Zucchine",200],["Melanzane",125],["Fagiolini freschi",200],["Bieta",200],["Mais dolce in scatola sgocciolato",50],["Funghi coltivati prataioli",150],["Spinaci",200],["Finocchi",250],["Carote",200],["Broccoletti di rapa",200],["Carciofi",150],["Cicoria da taglio",200],["Lattuga",160],["Agretti",150],["Rughetta o rucola",100]],
      [["Uova di gallina (intere)",120],["Mozzarella di bufala - Vallelata",50],["Mozzarella di vacca",80],["Fagioli in scatola",150],["Tonno sott'olio sgocciolato",80],["Salmone fresco",120],["Hamburger di pesce",150],["Piselli in scatola scolati",120],["Merluzzo o nasello",150],["Bastoncini surgelati",120],["Ceci in scatola scolati",120],["Lenticchie in scatola scolate",120],["Fiocchi di latte",80],["Formaggio spalmabile",80],["Merluzzo o nasello surgelato (filetti)",150],["Cuoricini di merluzzo - Pescanova",150],["Hamburger di salmone - Pescanova",150],["Petto di pollo",100],["Petto di tacchino",100],["Stracchino",100],["Caciottina fresca",80]]
    ],
    merenda: [
      [["Kefir di latte biologico",100],["Yogurt magro bianco",125],["Barretta ai cereali e frutta",20],["Crackers integrali",30],["Grissini integrali",25],["Cracker Magretti - Galbusera",30],["Granetti integrali - Mulino Bianco",50],["Fruyo vaniglia - Fage",100],["LC1 Multifruit - Nestlé",100],["Frutta & Fibre - Yoga",150],["Mandorle dolci secche",20],["Pistacchi secchi",40],["Noci secche",20]]
    ],
    cena: [
      [["Pane integrale",80],["Granetti integrali - Mulino Bianco",60],["Patate",200],["Pane comune",80],["Pasta di semola",70],["Riso",70],["Couscous",70],["Gnocchi",150]],
      [["Lenticchie in scatola scolate",150],["Hamburger di manzo o vitello",100],["Vegan burger - muscolo di grano",100],["Hamburger di ceci",100],["Burger di soia e verdure - Sojasun",150],["Burger surgelati - Valsoia",150],["Hamburger vegetale - Valsoia",150],["Hamburger di pesce",170],["Hamburger di salmone - Pescanova",200],["Cotoletta vegetale - Kioene",160],["Burger di ceci - Kioene",160],["Mini burger alle melanzane - Kioene",100],["Petto di pollo",150],["Ceci in scatola scolati",150],["Fesa di tacchino cotta al forno",70],["Formaggio spalmabile",100],["Uova di gallina (intere)",120]],
      [["Zucchine",200],["Bieta",200],["Melanzane",125],["Insalata",100],["Pomodori da insalata",200],["Peperoni",150],["Verdure grigliate - Bofrost",200],["Finocchi",250],["Fagiolini freschi",200]],
      [["Mela",100],["Fragole",200]]
    ],
    giornata: OLIO
  }},
  { name:"Martedì", short:"Mar", meals:{
    colazione: COLAZIONE,
    pranzo: [
      [["Fagioli in scatola",150]],
      [["Pomodori da insalata",200]],
      [["Tonno sott'olio sgocciolato",80]],
      [["Crackers integrali",30]]
    ],
    merenda: KEFIR,
    cena: [
      [["Insalata",100],["Bieta",200],["Melanzane",125]],
      [["Petto di pollo",150]],
      [["Pane integrale",80]]
    ],
    giornata: OLIO
  }},
  { name:"Mercoledì", short:"Mer", meals:{
    colazione: COLAZIONE,
    pranzo: [
      [["Riso integrale",70],["Pasta di semola integrale",70]],
      [["Pomodori da insalata",200]],
      [["Uova di gallina (intere)",120]]
    ],
    merenda: KEFIR,
    cena: [
      [["Hamburger di ceci",100],["Hamburger di manzo o vitello",100],["Vegan burger - muscolo di grano",100]],
      [["Patate",200]],
      [["Zucchine",200]]
    ],
    giornata: OLIO
  }},
  { name:"Giovedì", short:"Gio", meals:{
    colazione: COLAZIONE,
    pranzo: [
      [["Riso basmati (peso crudo)",70]],
      [["Zucchine",200]],
      [["Salmone fresco",120],["Hamburger di pesce",150]]
    ],
    merenda: KEFIR,
    cena: [
      [["Ceci in scatola scolati",150],["Hamburger di ceci",100]],
      [["Pane integrale",80]],
      [["Pomodori da insalata",200],["Bieta",200]]
    ],
    giornata: OLIO
  }},
  { name:"Venerdì", short:"Ven", meals:{
    colazione: COLAZIONE,
    pranzo: [
      [["Couscous",70]],
      [["Zucchine",200]],
      [["Melanzane",125]],
      [["Piselli in scatola scolati",120]]
    ],
    merenda: KEFIR,
    cena: [
      [["Piadina",100]],
      [["Peperoni",150]],
      [["Melanzane",125]],
      [["Zucchine",100]],
      [["Fesa di tacchino cotta al forno",70],["Formaggio spalmabile",100]]
    ],
    giornata: OLIO
  }},
  { name:"Sabato", short:"Sab", meals:{
    colazione: COLAZIONE,
    pranzo: [
      [["Patate",200]],
      [["Spigola",200],["Merluzzo o nasello",200]],
      [["Fagiolini freschi",200]]
    ],
    merenda: KEFIR,
    cena: [
      [["Pizza pomodoro e mozzarella",200],["Pasto libero",null]],
      [["Verdure grigliate - Bofrost",200]]
    ],
    giornata: OLIO
  }},
  { name:"Domenica", short:"Dom", meals:{
    colazione: COLAZIONE,
    pranzo: [
      [["Tortellini freschi",150]],
      [["Vitellone (tagli magri)",80]],
      [["Sugo di pomodoro",30]],
      [["Bieta",200]],
      [["Pomodori da insalata",200]]
    ],
    merenda: KEFIR,
    cena: [
      [["Pane integrale",80]],
      [["Uova di gallina (intere)",120]],
      [["Finocchi",250],["Fagiolini freschi",200]]
    ],
    giornata: OLIO
  }}
];

/* Le liste del lunedì valgono come tabella delle alternative per tutta la settimana:
   ogni alimento degli altri giorni riceve le alternative del gruppo del lunedì in cui compare (stesso pasto). */
const MONDAY = DAYS[0].meals;
for (const day of DAYS.slice(1)) {
  for (const m of ["pranzo","merenda","cena"]) {
    day.meals[m] = day.meals[m].map(opts => {
      const group = MONDAY[m].find(gr => gr.some(([n]) => n === opts[0][0]));
      if (!group) return opts;
      const have = new Set(opts.map(([n]) => n));
      return [...opts, ...group.filter(([n]) => !have.has(n))];
    });
  }
}

export const MEALS = [["colazione","Colazione"],["pranzo","Pranzo"],["merenda","Merenda"],["cena","Cena"],["giornata","Durante la giornata"]];

/* ---------- Categorie per la lista della spesa ---------- */
export const CAT_ORDER = ["Frutta e verdura","Pane, pasta e cereali","Carne e pesce","Legumi e proteine vegetali","Latticini e uova","Colazione e snack","Surgelati e pronti","Dispensa","Altro"];
export const NO_SHOP = new Set(["Caffè in tazza","Pasto libero"]);
export function category(n){
  if (/Bofrost|surgelat|Pescanova|Valsoia|Kioene|Sojasun|Bastoncini/i.test(n)) return "Surgelati e pronti";
  if (/^(Latte d'avena|Confettura|Cereali|Cornflakes|Biscotti|Barretta|Mandorle|Pistacchi|Noci|Frutta & Fibre|Fette biscottate)/.test(n)) return "Colazione e snack";
  if (/^(Fagioli in|Ceci|Lenticchie|Piselli|Hamburger di ceci|Vegan burger)/.test(n)) return "Legumi e proteine vegetali";
  if (/^(Pasta|Riso|Couscous|Pane|Piadina|Gnocchi|Tortellini|Crackers|Cracker|Grissini|Granetti|Pizza)/.test(n)) return "Pane, pasta e cereali";
  if (/^(Petto|Fesa|Hamburger di manzo|Hamburger di pesce|Vitellone|Salmone|Spigola|Merluzzo|Tonno)/.test(n)) return "Carne e pesce";
  if (/^(Uova|Mozzarella|Fiocchi|Formaggio|Stracchino|Caciottina|Kefir|Yogurt|Fruyo|LC1)/.test(n)) return "Latticini e uova";
  if (/^(Pomodori|Zucchine|Melanzane|Fagiolini|Bieta|Funghi|Spinaci|Finocchi|Carote|Broccoletti|Carciofi|Cicoria|Lattuga|Agretti|Rughetta|Insalata|Peperoni|Patate|Mela|Fragole)/.test(n)) return "Frutta e verdura";
  if (/^(Olio|Pesto|Sugo|Mais)/.test(n)) return "Dispensa";
  return "Altro";
}


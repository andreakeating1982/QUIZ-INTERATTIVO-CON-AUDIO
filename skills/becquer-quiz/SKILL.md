---
name: becquer-quiz
description: "Manutenzione completa e personalizzazione dell'app QUIZ INTERATTIVO CON AUDIO SORGENTE (nome storico: Bécquer Quiz, in /home/user/becquer-quiz; Vite + React + TypeScript + Tailwind + tRPC + Drizzle + SQLite). Usare per: modificare UI studente/docente, correggere logica di sessione, deploy preview/produzione, personalizzare report PDF, modificare contatore studenti, gestire re-entry studenti, ZIP e checkpoint. NON usare per clonare l'app in una nuova con domande diverse — usare la skill quiz-interattivo-con-audio-sorgente."
---

# Quiz Interattivo Con Audio Sorgente (Bécquer Quiz)

## Panoramica

Il **QUIZ INTERATTIVO CON AUDIO SORGENTE** (nome storico: **Bécquer Quiz**) è un'applicazione interattiva per quiz in classe con **segmenti audio e pause di lettura**, basata su Vite + React + TypeScript + Tailwind CSS v4 + tRPC + Drizzle + SQLite. È un fork/adattamento dell'app Shakespeare Quiz, progettata per quiz letterari su Gustavo Adolfo Bécquer.

**Cartella progetto:** `/home/user/becquer-quiz`
**Deploy produzione:** `https://becquer-quiz.easy-peasy.site`

**Questa app è il SORGENTE per la skill di clonazione `quiz-interattivo-con-audio-sorgente`**: quando l'utente vuole una nuova app identica con solo un set di domande diverso, usare QUELLA skill (non modificare le domande qui).

## Struttura del Progetto

```
becquer-quiz/
├── client/src/
│   ├── App.tsx                    # Router principale (wouter)
│   ├── const.ts                   # Costanti, domande del quiz
│   ├── index.css                  # Stili globali + PLUM THEME
│   ├── lib/
│   │   ├── reportPdf.ts           # Generazione PDF report (jsPDF)
│   │   └── trpc.ts                # Client tRPC
│   ├── pages/
│   │   ├── StudentQuiz.tsx        # Interfaccia studente
│   │   ├── TeacherPage.tsx        # Dashboard docente
│   │   └── LandingPage.tsx        # Pagina iniziale
│   ├── components/                # Componenti UI (shadcn)
│   └── public/audio/              # Segmenti audio .m4a
├── server/
│   ├── db.ts                      # DB queries (Drizzle ORM)
│   ├── routers.ts                 # Endpoint tRPC
│   ├── questions.ts               # Definizione domande
│   └── storage.ts                 # Storage backend
├── drizzle/                       # Migrazioni DB
├── deploy/                        # Dockerfile per produzione
└── shared/
    ├── const.ts                   # Costanti condivise
    └── types.ts                   # Tipi TypeScript
```

## Database (Drizzle ORM + SQLite/Postgres)

### Schema: `drizzle/schema.ts`

- **classi** — id, name, password, codice (codice classe), isActive, currentQuestion, startedAt, endedAt, phase, readingPauseStage, createdAt
- **studenti** — id, classId, name, score, completed, completedAt
- **risposte** — id, studentId, classId, questionNumber, selectedAnswer, isCorrect, submittedAt
- **classi_abilitate** — id, classId (tabella di lookup)

## Endpoint tRPC (`server/routers.ts`)

### Classi
- `classes.listAll` — elenca tutte le classi
- `classes.getById` — dettagli classe + codice
- `classes.create` — crea nuova classe (nome + password)
- `classes.enable` — abilita classe per accesso
- `classes.startSession` — avvia sessione (imposta phase="reading", readingPauseStage=1)
- `classes.nextQuestion` — passa alla domanda successiva
- `classes.startReadingPause` — avvia una pausa di lettura (incrementa readingPauseStage)
- `classes.revealAnswer` — mostra risposta corretta (setta currentQuestion come negativo)
- `classes.endSession` — termina sessione (setta endedAt)
- `classes.reset` — riavvia classe (elimina studenti + risposte)
- `classes.stats` — statistiche in tempo reale (studenti, risposte, punteggi)
- `classes.removeStudent` — rimuove studente dalla sessione

### Studenti
- `students.join` — registra studente (restituisce studentId)
- `students.getMyAnswers` — restituisce risposte già inviate dallo studente

### Risposte
- `answers.submit` — invia risposta (controlla se già risposta: errore se duplicata)
- `answers.submitAll` — invia tutte le risposte in blocco

### Domande (`questions`)
- `questions.list` — elenca le domande **SENZA `correctAnswer`** (per gli studenti; omette la risposta esatta da `BECQUER_QUESTIONS`)
- `questions.get` — singola domanda senza risposta esatta
- `questions.check` — verifica una risposta, restituisce `isCorrect` + `correctAnswer`
- `questions.listWithAnswers` — elenca TUTTE le domande **CON `correctAnswer`** (⚠️ usare QUESTO endpoint lato docente, es. per il dropdown di `AnswerDetails`; `questions.list` NON basta e mostrerebbe "—" al posto della risposta esatta)
- `questions.getCorrectAnswer` — risposta esatta di una singola domanda

## Pagine Client

### StudentQuiz.tsx (Interfaccia Studente)
1. **Schermata Join** — inserimento nome/cognome + codice classe. Bottone **HOME** con icona `House`.
2. **Schermata Attesa** — "In attesa che il docente avvii la sessione" se phase="reading"
3. **Schermata Quiz** — mostra **PREGUNTA {currentQNum}** (PREGUNTA 1, PREGUNTA 2, ...) al posto del testo della domanda, con opzioni A/B/C/D. Il testo reale della domanda NON è visibile allo studente. Al submit: feedback visivo (verde = corretto, rosso = errato). Pulsante "CONTINUA" marrone per proseguire.
4. **Re-entry** — se lo studente rientra, carica `getMyAnswers` e mostra le domande già risposte come bloccate ("Hai già risposto a questa domanda.")

### TeacherPage.tsx (Dashboard Docente)
1. **Seleziona/Riapri Classe** — scegli classe dalla lista o riapri con codice + password
2. **Pannello Controllo Sessione** — pulsanti: Avvia Sessione, Domanda Successiva, Rivela Risposta, Termina Sessione, Riavvia Classe
3. **Pausa Lettura** — schermata intermedia con titolo segmento, testo in case normale e giustificato, audio player, pulsante "CONTINUA"
4. **Studenti Attivi** — lista studenti con badge verde, punteggio in tempo reale, espansione risposte, pulsante rimozione
5. **Statistiche Classe** — grafici, medie percentuali, report PDF
6. **Report PDF** — genera PDF con dettagli studenti (1 pagina per alunno, tutte le opzioni con ✔/✘, risposta esatta in verde, NO riepilogo numerico finale) e **questionario in bianco** (1 pagina, opzioni indentate dopo i quadratini)

## Segmenti Audio e Mappatura Domande

### I 5 Segmenti Audio
I file audio sono in `client/public/audio/segment_1.m4a` ... `segment_5.m4a`.

| # | Segmento | Durata | Audio termina con |
|---|---|---|---|
| 🎵1 | El autor | 0-105s | "...reconocimiento" |
| 🎵2 | Quintaesencia | 105-164s | "...lúgubre" |
| 🎵3 | Rimas | 164-207s | "...Romanticismo español" |
| 🎵4 | Estructura | 207-279.5s | "...sueños" (NON include il titolo del segmento successivo) |
| 🎵5 | Lenguaje | 279.5-384s | inizia con "3.2, lenguaje y estilo..." |

### Mappatura Domande
Le domande Q1-Q10 sono distribuite dopo ogni pausa di lettura:

| Pausa | Dopo lettura | Domande successive |
|---|---|---|
| PAUSA 1 (El autor) | Q1, Q2 | Q3 |
| PAUSA 2 (Quintaesencia) | Q3, Q4 | Q5 |
| PAUSA 3 (Rimas) | Q5 | Q6 |
| PAUSA 4 (Estructura) | Q6, Q7 | Q8 |
| PAUSA 5 (Lenguaje) | Q8, Q9, Q10 | Fine quiz |

Nel trigger del DB si attiva `readingPauseStage`: dopo Q2 → stage 2, dopo Q4 → stage 3, dopo Q5 → stage 4, dopo Q7 → stage 5.

### Regolazione Tempi Audio
I tagli audio vanno fatti con ffmpeg. Comando base:
```bash
ffmpeg -i audio_becquer.m4a -ss 0 -t 105 -c copy segment_1.m4a
```
`-ss` = start time, `-t` = durata. Per i tagli intermedi, calcolare posizioni precise con lo strumento di ascolto.

## Pattern di UI Recenti (Sessioni Domande & Studenti Attivi)

### IN ATTESA DI INVIO (Per Domanda Corrente)

La scritta **IN ATTESA DI INVIO** appare nella riga di ogni studente che **non ha ancora risposto alla domanda corrente** (non più in base al totale delle risposte).

**Logica in TeacherPage.tsx:**
```tsx
// Nuova variabile: controlla la domanda corrente, non il totale
const hasAnsweredCurrent = classDetail?.currentQuestion
  ? studentAnswers.some((a: any) => a.questionNumber === classDetail.currentQuestion)
  : false;

// Condizione per mostrare IN ATTESA
{!hasAnsweredCurrent && classDetail?.currentQuestion ? (
  <span className="text-sm font-bold text-amber-500 whitespace-nowrap">IN ATTESA DI INVIO</span>
) : (
  <span>...punteggio...</span>
)}
```

**Stile:** `text-xs sm:text-sm font-bold text-amber-500 whitespace-nowrap` — arancione vivo, grassetto, **senza cornice/bordo**, più compatto su mobile (`text-xs`) per non spingere fuori i pallini. Conservare anche la variabile originale `hasAnswers` (per controllare visibilità chevron espansione e contenuto espandibile).

**⚠️ Overflessione su mobile (fix 2026-08-23):** quando appare IN ATTESA DI INVIO, la riga è troppo piena su schermi stretti (testo lungo + 5 pallini + X + chevron) e gli elementi uscivano dal bordo destro. La riga deve avere `flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1.5 sm:gap-x-3 sm:gap-y-2`, e **tutti gli elementi di stato/azioni (IN ATTESA/punteggio, pallini sezione, pulsante X, chevron) devono stare in un unico gruppo** `<div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 sm:gap-x-3 min-w-0 max-w-full">`: così il gruppo va a capo tutto insieme (su più righe dentro la card, che si allunga) invece di sforare i bordi. NON usare `shrink-0` sul gruppo (impedisce il restringimento → overflow di ~9px); usare `max-w-full`.

### Nome Studente (Una Riga + Ellissi, Tooltip col Nome Completo)

Il nome dello studente nella sezione STUDENTI ATTIVI sta **sempre su una sola riga** con `truncate` (white-space: nowrap + ellipsis) — fix mobile del 2026-08-23 per evitare che il nome vada a capo e si sovrapponga ai puntini colorati. Il nome completo si legge nel tooltip nero (vedi sotto):
```tsx
{/* ✅ Corretto — una riga, ellissi se serve; il tooltip nero mostra il nome completo */}
<span className="block font-bold text-sm text-foreground truncate">{student.name}</span>

{/* ❌ Sbagliato: niente truncate → il nome va a capo su mobile e copre punteggio/puntini */}
<span className="block font-bold text-sm text-foreground">{student.name}</span>
```
Il contenitore del nome è `<span className="group relative block w-full cursor-pointer">` con `data-tooltip-name` (vedi pattern tooltip sotto).

### AnswerDetails (Dropdown Studente): risposta data + risposta ESATTA se errata

Il menu espanso dello studente (componente `AnswerDetails` in `TeacherPage.tsx`) mostra, per ogni alunno, TUTTE le risposte raggruppate per sezione (`sectionTitle`): numero domanda, risposta data con icona, e — se errata — la **risposta esatta in verde** sotto. Implementazione (fix 2026-09-07, allineata all'app di riferimento PAROLE-CHIAVE-INTERATTIVE):

- **Le domande DEVONO venire da `questions.listWithAnswers`** (contengono `correctAnswer`); `questions.list` le omette e il menu mostrerebbe "—". In TeacherPage si usa un `useQuery` dedicato (es. `questions.listWithAnswers`) passato come `shakespeareQuestions` a `<AnswerDetails studentAnswers=... shakespeareQuestions=... />`.
- `AnswerDetails` raggruppa con `useMemo` per `sectionTitle` (in ordine di comparsa nelle domande), arricchisce ogni risposta con `correctAnswer` (fallback `'—'`) e ordina per `questionNumber`. Header di sezione colorato ciclico (`sectionHeaderColors`) con indice "1. {sezione}".
- **Layout di ogni risposta** (card `rounded-lg bg-white/50 px-2 py-2`): numero domanda a sinistra (`text-[10px] font-bold text-foreground/40 shrink-0 w-4`), poi icona e testo. Risposta **corretta**: una riga `✓` verde. Risposta **errata**: DUE righe — prima riga ✗ rossa con la risposta data, seconda riga indentata (`pl-5`) con freccia `→` e risposta esatta in verde.
- **⚠️ Niente testo tagliato su mobile (fix 2026-09-07):** ogni testo risposta usa `min-w-0 flex-1 leading-snug break-words` (NON stare su un'unica riga `flex items-center` senza wrap: su cellulare i testi spagnoli lunghi sforavano e venivano troncati dal contenitore). `break-words` + `min-w-0` fanno andare a capo il testo dentro lo spazio disponibile. NON serve `text-left`/`flex-wrap` sul singolo testo: le regole globali forzano `text-align: center !important` e il wrap resta centrato; la card è `px-2 py-2` e NON deve avere `overflow-hidden` che tagli. Icone vuote `CheckCircle2`/`XCircle` (non pallini pieni):
```tsx
<CheckCircle2 className="size-3.5 text-green-600 shrink-0" />  {/* corretto */}
<XCircle className="size-3.5 text-red-500 shrink-0" />          {/* errato */}
```

### Card LETTURA INIZIALE / PAUSA DI LETTURA (Colori Uniformati)

Le card di lettura **devono usare gli stessi colori del resto dell'app** (non stone/ambra):

| Proprietà | ❌ Vecchio | ✅ Nuovo |
|---|---|---|
| **Sfondo card** | `bg-stone-100` | `bg-muted/30` |
| **Bordo card** | `border-2 border-amber-300` | `border border-border/50` |
| **Icona Volume2** | `size-6 text-amber-700` | `size-5 text-plum` |
| **Titolo lettura** | `text-amber-800` | `text-foreground` |
| **Badge sezione** | `text-amber-700 bg-amber-200/80` | `text-plum/70 bg-plum/10` |
| **Card audio player** | `border-amber-200/60` | `border-border/40` |
| **Barra progresso** | `bg-amber-100` / `bg-amber-500` | `bg-muted` / `bg-plum` |
| **Pulsante Play/Pausa** | `border-amber-300 text-amber-700` | `border-border/60 text-plum` |
| **Hover riga studente** | `hover:bg-amber-50/40` | rimosso (solo `hover:bg-muted/60`) |

**Regola generale:** La palette dell'app è **plum** (viola caldo) + **grigio/muted**. Evitare toni stone/ambra/marrone che stonano con il resto dell'interfaccia.

### Schermata Studente: PREGUNTA X (niente testo domanda)

In `StudentQuiz.tsx` la schermata quiz **NON mostra più il testo della domanda** (es. "¿DÓNDE NACIÓ GUSTAVO ADOLFO BÉCQUER?"). Al suo posto viene mostrata l'etichetta **PREGUNTA {currentQNum}** (PREGUNTA 1, PREGUNTA 2, ... PREGUNTA 10).

```tsx
{/* ✅ Corretto — solo sezione + PREGUNTA X */}
<div className="text-center">
  {currentQ.sectionTitle && (
    <div className="text-xs font-bold text-plum/70 tracking-wider uppercase mb-2">{currentQ.sectionTitle}</div>
  )}
  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
    PREGUNTA {currentQNum}
  </h2>
</div>

{/* ❌ Vecchio — mostrava il testo della domanda + etichetta "DOMANDA X" ridondante */}
<p className="text-xs text-muted-foreground tracking-widest mb-2">DOMANDA {currentQNum}</p>
<h2 ...>{currentQ.question}</h2>
```

**Note:** il testo reale della domanda non è visibile allo studente (lo legge/pronuncia il docente). NON modificare la schermata docente (`TeacherPage.tsx`), che continua a mostrare il testo della domanda. `currentQNum` è il numero della domanda corrente nella sessione.

### PAUSA DI LETTURA (Schermata Studente): "Ascolta" non "Leggi"

Il testo di istruzione della pausa di lettura nella schermata studente è:

> **PAUSA DI LETTURA**
> *Ascolta tutto il prossimo paragrafo prima di procedere con le domande successive*

**Attenzione:** non ripristinare "Leggi" — il docente ha scelto "Ascolta" perché gli studenti ascoltano l'audio del paragrafo. Il testo si trova in `StudentQuiz.tsx` (vicino a `<h2>PAUSA DI LETTURA</h2>`); il titolo "PAUSA DI LETTURA" in `TeacherPage.tsx` è una card diversa e non va toccata.

### Tooltip Studente: sempre visibile (PC hover + mobile tap)

L'etichetta nera sul nome dello studente in STUDENTI ATTIVI deve comparire **sempre**: con l'hover del mouse su PC e col **tap del dito su mobile** (fix 2026-08-23). NON usare il componente shadcn `Tooltip` (Radix, solo hover → non funziona su touch). Usare il pattern custom in `TeacherPage.tsx` — attenzione a tre dettagli fondamentali:

1. Il listener di chiusura è NATIVO su `document` e riceve il click anche dopo `e.stopPropagation()` di React: deve **ignorare i click sul nome stesso** (`closest("[data-tooltip-name]")`), altrimenti il tooltip si chiude un istante dopo l'apertura e su mobile non si vede mai.
2. Il tooltip è posizionato **sopra** il nome (`bottom-full mb-2`), non sotto (`top-full`): sopra non viene coperto dagli elementi successivi.
3. Il contenitore della riga studente NON deve avere `overflow-hidden` (tagliava il tooltip): usare `rounded-xl` sul contenitore e `rounded-t-xl`/`rounded-b-xl` sui figli.

```tsx
// Stato (inserito vicino a expandedStudent)
const [tooltipStudent, setTooltipStudent] = useState<string | null>(null);

// Chiude il tooltip quando si tocca/clicca fuori dal nome.
// NB: listener NATIVO (document) → ignora i click che partono dal nome stesso.
useEffect(() => {
  if (!tooltipStudent) return;
  const close = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && t.closest && t.closest("[data-tooltip-name]")) return;
    setTooltipStudent(null);
  };
  document.addEventListener("click", close);
  return () => document.removeEventListener("click", close);
}, [tooltipStudent]);
```

```tsx
<span
  className="group relative block w-full cursor-pointer"
  title={student.name}
  data-tooltip-name
  onClick={(e) => {
    // Su dispositivi touch (niente hover): tap = mostra/nasconde il nome completo
    if (window.matchMedia('(hover: none)').matches) {
      e.stopPropagation();
      setTooltipStudent(tooltipStudent === student.id ? null : student.id);
    }
  }}
>
  <span className="block font-bold text-sm text-foreground truncate">{student.name}</span>
  <span className={`pointer-events-none absolute left-1/2 bottom-full z-[100] mb-2 -translate-x-1/2 max-w-[85vw] rounded-md bg-black px-2 py-1 text-xs text-white shadow-lg transition-opacity duration-150 ${tooltipStudent === student.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-active:opacity-100 group-focus:opacity-100"}`}>
    {student.name}
  </span>
</span>
```

Il tooltip funziona **anche quando compare IN ATTESA DI INVIO** (è legato al nome, non allo stato di risposta). NON importare `Tooltip/TooltipContent/TooltipTrigger` da `@/components/ui/tooltip`.

### Riga Studente: `<div role="button">` con `flex-wrap` (niente `<button>` annidato)

La riga cliccabile dello studente è un `<div role="button" tabIndex={0}>` con `onKeyDown` (Enter/Space), **NON** un `<button>`: dentro la riga c'è già un `<Button>` (Rimuovi studente) e un `<button>` non può contenere un altro `<button>` (HTML non valido → tap imprevedibili su mobile). Struttura: `w-full flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1.5 sm:gap-x-3 sm:gap-y-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-muted/30 hover:bg-muted/60 cursor-pointer rounded-xl` (+ `rounded-t-xl` se espanso). **`flex-wrap` è obbligatorio** (fix 2026-08-23): su mobile con IN ATTESA DI INVIO, senza wrap gli elementi uscivano dal bordo destro. Il nome ha `flex-1 min-w-0` (truncate); tutti gli elementi laterali (stato/punteggio, puntini sezione, pulsante X, chevron) stanno in un **unico gruppo** `<div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 sm:gap-x-3 min-w-0 max-w-full">` — il gruppo va a capo tutto insieme e NON deve avere `shrink-0` (impedisce il restringimento e causa overflow).

### Codice Classe: niente sovrapposizioni (flex-wrap)

La riga del codice classe in alto nella dashboard docente (`{/* Riga 2: codice + chiudi */}` in `TeacherPage.tsx`) deve usare `flex flex-wrap` sul contenitore e `shrink-0` sul badge del codice, così CHIUDI/ELIMINA CLASSE vanno a capo invece di sovrapporsi su schermi stretti:

```tsx
{/* ✅ Corretto */}
<div className="flex flex-wrap items-center justify-center gap-2">
  <div className="flex items-center gap-1.5 rounded-lg bg-card border border-border/50 px-3 py-1.5 shrink-0">
    <Hash className="size-4 sm:size-5 text-primary" />
    <span className="font-mono font-bold text-base sm:text-lg text-primary tracking-widest">{activeClassInfo.code}</span>
  </div>
  {/* pulsanti CHIUDI / ELIMINA CLASSE */}
</div>
```

### Campo Data Centrato (APRI UNA NUOVA CLASSE)

Il campo `type="date"` nella sezione APRI UNA NUOVA CLASSE ha due livelli di centratura, ENTRAMBI necessari:

**1) Classe sull'input** (in `TeacherPage.tsx`, riga ~451):

```tsx
<Input type="date" value={classDate} onChange={(e) => setClassDate(e.target.value)} className="h-9 text-sm !text-center" />
```

**2) Regola CSS in `client/src/index.css` (OBBlIGATORIA, sezione `@layer base`):**

Il solo `!text-center` NON basta su Chrome/Edge/Safari: il testo di un `<input type="date">` vive nello shadow DOM (`::-webkit-datetime-edit` → `::-webkit-datetime-edit-fields-wrapper` → `::-webkit-date-and-time-value`) e non eredita il `text-align` dell'input. In più il preflight di Tailwind imposta `display: inline-flex` sul contenitore, per cui serve `justify-content` oltre a `text-align`. Regola completa già applicata:

```css
/* Data centrata negli input date (Chrome/Edge/Safari): il testo
   del campo type="date" vive nello shadow DOM e NON eredita il
   text-align dell'input. Serve la combo display flex + justify
   center + width 100%. L'icona calendario a destra (~18px) toglie
   spazio al centraggio: si compensa con padding-inline-start pari
   a metà icona (9px) così il testo risulta centrato nel campo. */
input[type="date"]::-webkit-datetime-edit {
  display: flex !important;
  justify-content: center !important;
  width: 100% !important;
  text-align: center !important;
  padding-inline-start: 16px !important;
}
input[type="date"]::-webkit-datetime-edit-fields-wrapper {
  display: inline-flex !important;
  justify-content: center !important;
  width: 100% !important;
  text-align: center !important;
}
input[type="date"]::-webkit-date-and-time-value {
  text-align: center !important;
}
```

Nota: il `padding-inline-start` compensa l'icona calendario a destra (~18px): senza di esso il testo risulta ~9px spostato a sinistra del centro. Il valore 16px è stato tarato misurando i pixel reali (offset residuo −1px, praticamente perfetto). In Firefox il solo `text-align: center` sull'input basta, ma la regola WebKit non interferisce.

**NON rimuovere la regola CSS** pensando che `!text-center` sia sufficiente: su Chrome/Edge/Safari la data tornerebbe allineata a sinistra.

### Accessibilità UI (2026-09-06, portata da PAROLE-CHIAVE-INTERATTIVE)

Livello di inclusione COMPLETO (DSA/BES/ipovisione/screen reader) — file portati
nell'app e da NON rimuovere:

- **Font OpenDyslexic**: `client/public/fonts/` (TTF/OTF/WOFF2) + `@font-face` in `client/src/index.css`; applicato a tutta la UI (fallback Cambria/Georgia/serif) e incorporato nei PDF.
- **Barra accessibilità 5 moduli** (FONT A−/A+ · INTERLINEA · RIGHELLO · MODALITÀ · ASCOLTO): `client/src/components/AccessibilityToolbar.tsx` + `client/src/contexts/AccessibilityContext.tsx` (localStorage `sq_access`, variabili `--lf-scale`/`--lf-lh`, classi `lf-ruler`/`lf-hc` su `<html>`). Montata in `App.tsx` dentro `AccessibilityProvider` (visibile su TUTTE le rotte).
- **TTS italiano**: `client/src/hooks/useReadAloud.ts` (Web Speech, voce italiana migliore, date in forma naturale, opzioni dei `<button>` lette).
- **ARIA/focus/riduzione movimento/alto contrasto/righello**: in `AccessibilityToolbar.tsx` e nella sezione "Accessibilità" di `client/src/index.css` (focus-visible 3px, `::selection`, `prefers-reduced-motion`, banda `.lf-ruler-band`, `html.lf-hc`).
- **Embed**: `client/src/lib/heightSync.ts` inizializzato in `main.tsx` (in iframe → classe `html.lf-embedded` + messaggi `labvisivo:height`/ping, token `?cornice=`).
- **Cornice dinamica per Blogger**: cartella `cornice-dinamica/` (come in PAROLE-CHIAVE-INTERATTIVE) con `embed-becquer-quiz-dedicata.html` (⭐ v3 impermeabile + anti-loop, titolo/pulsanti stessa riga centrati, Schermo intero/Ricarica, stato online/errore con Riprova, timeout 15 s), `embed-becquer-quiz-lite.html` (riusabile `?app=`), `embed-becquer-quiz.html` (autosufficiente, font base64), `embed-universale.html` (template), `test-impermeabile.html`/`test-dedicata.html` (verifica), `fonts/` e `README.md`. URL fisso `https://becquer-quiz.easy-peasy.site/`; il font si carica da `/fonts/*` (CORS). Per aggiornare l'URL basta sostituire `https://becquer-quiz.easy-peasy.site` nei file.
- **CORS font**: middleware `/fonts` in `server/_core/index.ts` (header `Access-Control-Allow-Origin: *`).
- Documentazione: `ACCESSIBILITA.md` nella root del progetto.

### PDF Report & Questionario in bianco: punteggio su base 10 (10/10)

Dal 2026-08-24 i PDF riportano il punteggio **su base 10**, come nell'app di riferimento `Quiz-interattivo-senza-audio-sorgente` (richiesta esplicita del docente):

- **Report** (`generateReportPdf`): **UNA pagina A4 per ogni studente** con **font OpenDyslexic** (parte da 14 pt/titolo 15 pt, interlinea 1.5 e si adatta in meno SOLO se serve per stare in una pagina), domande con **tutte le opzioni** (una per riga, wrap sicuro) e la scelta marcata da **simboli vettoriali ✔ verde / ✘ rossa** subito dopo la lettera (opzione esatta sempre in verde, significato non solo colore), **legenda simboli** in fondo e box **PUNTEGGIO** su **UN'UNICA riga** (cornice blu, centrato, font adattivo) con testo "PUNTEGGIO: X/10 — ogni risposta corretta = 1 pt — massimo 10/10". `X = Math.round(student.grade)`; `grade` è già su base 10 in `server/db.ts` (`Math.round((correctCount/totalQuestions)*10*10)/10`). **⚠️ NIENTE riepilogo numerico RISPOSTE CORRETTE/INCORRETTE**: rimosso su richiesta del docente (2026-09-07) per recuperare spazio e impaginare meglio la pagina.
- **Questionario in bianco** (`generateBlankQuestionsPdf`): **UNA pagina A4** con stesso stile accessibile (OpenDyslexic, auto-adattivo): campi COGNOME/NOME/CLASSE/DATA, per ogni domanda una **casella quadrata blu** per la lettera-risposta e le opzioni A) B) C) D) (una per riga), box **PUNTEGGIO** su **UN'UNICA riga** (cornice blu) "PUNTEGGIO — ogni risposta corretta = 1 pt — massimo 10/10". **⚠️ Le opzioni devono essere indentate come il testo della domanda** (partire da `qX = M + boxSide + 3`, larghezza `qMaxW`, NON da `x=M`): partendo da M finirebbero sotto la colonna dei quadratini blu e si sovrapporrebbero con l'interlinea compressa (fix 2026-09-07).
- I valori `/10` e `10/10` sono **fissi** (NON `questions.length`): il voto è sempre in decimi anche se le domande non sono 10.
- NON rimuovere il box né tornare a `/Q_TOTAL` o `questions.length` — richiesto esplicitamente dal docente.

### Impaginazione PDF — UNA pagina per alunno (auto-fit font/interlinea)

`reportPdf.ts` (FUNZIONI ASYNC: `generateReportPdf`/`generateBlankQuestionsPdf` + `build*PdfDoc`):

- **Ogni alunno sta su UNA pagina A4** e il questionario in bianco su UNA pagina: `FONT_CANDIDATES` (14→8 pt) × `FACTOR_CANDIDATES` (1.5→1.0) provate in ordine di preferenza (font prima, poi interlinea) con `pickReportStyle`/`pickBlankStyle`; si sceglie la combinazione PIÙ GRANDE che entra (`endY <= BOTTOM-1.5`). Il corpo scende sotto 14 pt solo se serve (scelta docente 2026-09-07: pagine uniche più compatte).
- **Misura = paint**: `paintReportPage`/`paintBlankPage` con flag `paint=false` misurano senza disegnare (stessa engine), quindi l'altezza calcolata è sempre esatta.
- **Nessun testo fuori margine**: ogni opzione è composta su **righe proprie** con wrap a parole (`splitTextToSize` entro `CW`), niente segmenti inline che sforano a destra.
- **Legenda + box PUNTEGGIO sempre INSIEME** in fondo alla stessa pagina (mai separati); il riepilogo numerico è stato rimosso (2026-09-07).
- NON esiste più paginazione automatica/multi-pagina per studente né mini-intestazioni: se il contenuto non entra a 8 pt/1.0 resta comunque UNA pagina (caso limite non atteso con 10 domande).
- NON ripristinare il vecchio flusso inline con segmenti né le pagine multiple per studente.

## Tema Visivo (PLUM THEME)

### Palette Colori (`client/src/index.css`)
L'app usa un tema personalizzato "PLUM" (viola caldo + oro). Le variabili sono definite in `:root:root` (il doppio `:root` serve per aumentare la specificità e sovrascrivere i default generati da Tailwind v4):

```css
:root:root {
  --plum: oklch(55% .115 42);
  --gold: oklch(68% .1 72);
  --success: oklch(55% .12 145);
  --background: oklch(95.5% .015 85);    /* beige caldo */
  --foreground: oklch(26% .025 55);       /* marrone scuro */
  --primary: oklch(55% .115 42);          /* plum/viola */
  --accent: oklch(82% .055 42);           /* oro/ambra chiaro */
  --radius: 1.1rem;
  ...
}
```

**IMPORTANTE:** Usare sempre `:root:root` (doppio selettore) per le variabili CSS. Tailwind v4 genera il proprio `:root` inline con valori di default che sovrascriverebbero quelli custom.

### Regole Globali CSS
`client/src/index.css` applica queste regole con `!important` su TUTTI gli elementi:
```css
html, body, #root {
  text-align: center !important;
  text-transform: uppercase !important;
}
body *:not(input):not(textarea):not(select) {
  text-align: center !important;
  text-transform: uppercase !important;
}
```
**NON rimuovere queste regole globali** — sono intenzionali e danno coerenza visiva all'app.

### Override per le Pause di Lettura
Solo il testo delle pause di lettura deve essere giustificato e in case normale. Usare la classe dedicata:

```css
.reading-pause-text {
  text-align: justify !important;
  text-transform: none !important;
}
```
Applicata come `className="... reading-pause-text"` sul `<p>` della pausa lettura in TeacherPage.tsx. Non cambiare altri elementi.

## Pattern di Modifica Comuni

### Modificare le Domande / Clonare l'App
**NON modificare le domande a mano e NON cambiarle nel sorgente.** Per ottenere una nuova app con un set di domande diverso, usare la skill **quiz-interattivo-con-audio-sorgente** (script `clone_audio_quiz_app.py` + `change_quiz_theme.py` + template JSON): crea una copia identica in `/home/user/<nome>` con solo le domande (e opzionalmente titolo) diversi, audio e UI invariati. Le domande del sorgente vivono in `server/questions.ts` (array `BECQUER_QUESTIONS`, campo opzionale `sectionTitle`) e NON vanno toccate qui.

### Modificare la UI
- Tema visivo: palette marrone/plum (classi Tailwind `plum`, `plum/30`, `plum/40`)
- Componenti: shadcn/ui con Tailwind v4
- Icone: lucide-react
- Stili principali in `client/src/index.css` (Tailwind + CSS custom)
- **Non rimuovere le regole globali di uppercase/centrato** — aggiungere overrides mirati con classi dedicate

### Modificare i Testi delle Pause di Lettura
I testi sono in `TeacherPage.tsx` nell'array `READING_SECTIONS`. Ogni sezione ha:
```ts
{
  title: "1 · El autor",
  audio: "/audio/segment_1.m4a",
  text: "..."  // Testo in case normale (non uppercase)
}
```
Il testo deve essere in case normale (solo maiuscole dove necessario). Il box di lettura ha scorrimento (`max-h-48 overflow-y-auto`).

### Modificare il PDF Report (accessibile)
File: `client/src/lib/reportPdf.ts`
- Usa **OpenDyslexic** (incorporato da `/fonts` via `addFileToVFS`+`addFont`, fallback `times` se il fetch fallisce) — NON Helvetica.
- Funzioni **async**: `ensureFonts` prima di disegnare; `buildReportPdfDoc`/`buildBlankQuestionsPdfDoc` restituiscono il `jsPDF` (riusabili nei test).
- Titolo: costante `PDF_TITLE` (aggiornarla quando si clona con altro tema/lingua).
- Geometria: margini orizzontali 16 mm, top/bottom 12 mm; corpo **auto-adattivo** 14→8 pt (`FONT_CANDIDATES`), titolo `min(15, font+2)`, interlinea 1.5→1.0 (`FACTOR_CANDIDATES`).
- Simboli ✔/✘ VETTORIALI (OpenDyslexic non ha i glifi U+2714/U+2718) disegnati con `doc.lines`/`doc.line` (`drawSymbol`).
- Box PUNTEGGIO: `drawScoreBox` (font adattivo fino a 7 pt, larghezza `getTextWidth(scoreLine)` + 6, altezza minima 7 mm).
- Stile unico scelto con `pickReportStyle`/`pickBlankStyle` (prova candidati e misura con `paint=false`); opzioni disegnate da `paintOption` (una per riga, wrap sicuro entro `CW`).
- Filtrare studenti rimossi dal report (chiamate da TeacherPage: `await generateReportPdf(data)` e `generateBlankQuestionsPdf({...})`).

### Modificare la Logica degli Studenti
- **Re-entry**: server controlla in `answers.submit` se lo studente ha già risposto (query su tabella `risposte`). Client carica risposte via `getMyAnswers` al mount.
- **Rimozione**: `removeStudent` elimina record studente + tutte le sue risposte dal DB

### Modificare il Contatore Studenti
- Il polling stats è a `refetchInterval: 2000` (2 secondi)
- Invalidate esplicito: `utils.classes.stats.invalidate()` in ogni mutation (startSession, nextQuestion, revealAnswer, resetClass, endSession, removeStudent)

## Comandi

```bash
# Development
cd /home/user/becquer-quiz
pnpm dev                    # Avvia server di sviluppo

# TypeScript
pnpm check                  # Controllo tipi (usare PRIMA di deploy)

# Database
pnpm db:push                # Genera migrazioni e applica
pnpm db:reset               # Cancella DB e ricrea
pnpm db:studio              # Apre Drizzle Studio

# ZIP del progetto (escludere node_modules, .git, dist)
cd /home/user && zip -r becquer-quiz.zip becquer-quiz/ \
  -x "becquer-quiz/node_modules/*" \
  -x "becquer-quiz/.git/*" \
  -x "becquer-quiz/dist/*" \
  -x "becquer-quiz/dev-server.log"

# Salva checkpoint (SEMPRE prima di deploy produzione)
webdev_save_checkpoint(...)
```

## Deploy

### Preview
```bash
webdev_deploy(mode="preview")
```
URL temporaneo: `https://3000-{sandbox-id}.sandbox.easy-peasy.ai/`

### Produzione
```bash
webdev_save_checkpoint()    # Prima: salva checkpoint
webdev_deploy(mode="production")
```
URL permanente: `https://becquer-quiz.easy-peasy.site`

**Regola:** MAI deployare produzione nella stessa risposta in cui si è scritto codice. Sequenza: checkpoint → preview → chiedere conferma → produzione.

## Risorse

### scripts/
Per clonare l'app con nuove domande usare la skill **quiz-interattivo-con-audio-sorgente** (script `clone_audio_quiz_app.py` e `change_quiz_theme.py`, template `templates/questions_example.json`).

### references/
Vuoto. Documentazione su API tRPC e schema DB nella sezione "Database" e "Endpoint tRPC" sopra.

### templates/
Vuoto. Può contenere template JSON per domande o asset per il PDF.

## Campo Data Centrata (Overlay + showPicker) — fix 2026-08-23

Il campo data del form **APRI UNA NUOVA CLASSE** (sidebar docente) NON si centra con il solo `text-align: center` (né con i pseudo-elementi WebKit dello shadow DOM tipo `::-webkit-datetime-edit`): il testo del `type="date"` vive nello shadow DOM del browser e l'icona calendario occupa spazio a destra, quindi la data resta allineata a sinistra (soprattutto nell'iframe del blog).

**Soluzione robusta (stessa del repo Parole-chiave-interattive-sorgente): input nativo trasparente + overlay span centrato + showPicker()**

```tsx
<div className="relative cursor-pointer" onClick={(e)=>{ const inp = e.currentTarget.querySelector('input') as HTMLInputElement | null; if (inp && typeof (inp as any).showPicker === 'function') (inp as any).showPicker(); }}>
  <Input type="date" value={classDate} onChange={(e) => setClassDate(e.target.value)} className="h-9 text-sm text-transparent" />
  <span className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm ${classDate ? 'text-foreground' : 'text-muted-foreground'}`}>
    {classDate ? new Date(classDate+'T00:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}) : 'gg/mm/aaaa'}
  </span>
</div>
```

- `text-transparent` nasconde il testo nativo (formato locale del browser)
- l'overlay span mostra la data in formato italiano `gg/mm/aaaa` sempre centrata
- lo span è `pointer-events-none`: i click passano all'input sottostante che apre il picker nativo
- il wrapper `onClick` chiama `showPicker()` come fallback per i browser che non aprono il picker al click sul testo
- nel blocco `<style>` della pagina va nascosta l'icona calendario:
  ```css
  aside input[type="date"]::-webkit-calendar-picker-indicator {
    opacity: 0 !important;
  }
  ```

**Regola per gli altri input della sidebar:** usare la classe `!text-center` (NON `style={{textAlign:'center'}}`): la regola `aside input { text-align: left !important; }` presente nel `<style>` della pagina vince sullo stile inline, mentre `!text-center` (utility Tailwind in `@layer utilities` con !important) ha priorità maggiore per le cascade layers e vince. Applicare `!text-center` a: Nome classe, Password (APRI), Codice, Password (RIAPRI).

**Blog:** l'embed Blogger del quiz punta a `https://becquer-quiz.easy-peasy.site/` (URL di produzione) — un deploy in produzione aggiorna automaticamente il blog.

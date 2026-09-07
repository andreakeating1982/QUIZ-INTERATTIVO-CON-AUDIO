# 🧩 ADATTARE — Creare varianti dell'app con set di domande diversi (guida per IA)

Questo documento spiega come **modificare l'app per usare un set di domande diverso**, cambiando — anche in combinazione — questi aspetti:

1. **contenuto** delle domande (testi, opzioni, risposte esatte);
2. **audio** dei segmenti delle pause di lettura (`segment_1.m4a` … `segment_5.m4a`);
3. **numero** di domande (e conseguente mappa delle pause di lettura);
4. **tipologia** delle domande: **VERO/FALSO**, **risposta multipla a 3–4 opzioni**, **fill-in-the-blanks strutturato**, **abbinamento immagine-parola**, **riordino della parola**, **risposta breve di una parola**.

Il principio è **ripartire dalla stessa app** (vedi `REBUILD.md`) e cambiare **solo la parte "domande/audio"**, lasciando invariati: dashboard docente, codici classe a 4 cifre, sessioni, contatore studenti attivi, pause di lettura, report PDF accessibili e barra accessibilità.

---

## 0. Il modo più veloce: lo script di clonazione incluso

Il pacchetto include la skill **`quiz-interattivo-con-audio-sorgente`** (cartella `skills/`) con lo script `clone_audio_quiz_app.py`, che automatizza le **Varianti A e B** (contenuto e numero di domande, stesso formato a scelta multipla, audio invariati):

```bash
python skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name quiz-lorca \
  --questions /percorso/domande.json \
  --title "Lorca Quiz Interattivo" \
  --source https://github.com/<utente>/<nome-repo>   # opzionale: sorgente = repo GitHub
```

Funziona sia da cartella locale sia clonando una repository GitHub (`--source`). Lo script applica le domande, aggiorna i validatori `.max(N)`, verifica (audio presenti, nessun residuo "Bécquer", titolo aggiornato) ed esporta lo ZIP.

Per tutto ciò che lo script **non** copre (cambio **audio**, cambio **tipologia**, riorganizzazione delle **pause**) segui le sezioni seguenti: sono istruzioni manuali pensate per un agente IA.

---

## 1. Come funziona OGGI la domanda

Le domande vivono in `server/questions.ts` nell'array `BECQUER_QUESTIONS`. Ogni elemento ha:

```ts
export type BecquerQuestion = {
  number: number;              // 1..10 (progressivo)
  sectionTitle?: string;       // intestazione sezione mostrata sopra "PREGUNTA X"
  question: string;            // testo della domanda (spagnolo, MAIUSCOLO nella UI)
  options: string[];           // opzioni (attualmente 4)
  correctAnswer: string;       // risposta esatta = una delle options (confronto ESATTO)
};
```

**Non esiste un campo `type`**: il tipo è *implicito* — **risposta multipla a scelta singola** (`options` + `correctAnswer` stringa). Il confronto è **esatto**: `q.correctAnswer === input.selectedAnswer` (`server/routers.ts` → `questions.check`/`answers.submit`). La risposta dello studente viaggia come stringa (`selectedAnswer`). **Non esiste una copia mirror delle domande alla radice**: il file canonico è solo `server/questions.ts`.

- **Grading** → `server/routers.ts` (procedure `questions.check`, `answers.submit`, `answers.submitAll`) + `server/db.ts` (riepilogo: `grade = Math.round((correctCount / totalQuestions) * 10 * 10) / 10` → **voto sempre su base 10**).
- **Validatori** → `server/routers.ts`: più punti con `.max(10)` sul numero domanda (vanno aggiornati quando cambia il numero di domande — v. Variante B).
- **Rendering studente** → `client/src/pages/StudentQuiz.tsx`: mappa `currentQ.options` in bottoni.
- **Rendering docente (dropdown risposte)** → `client/src/pages/TeacherPage.tsx` (`AnswerDetails`): mostra `selectedAnswer` e, se errata, `correctAnswer` (via `questions.listWithAnswers`).
- **PDF** → `client/src/lib/reportPdf.ts`: stampa le opzioni con simboli vettoriali ✔/✘ e la risposta esatta in verde.
- **Audio/pause** → `READING_SECTIONS` in `client/src/pages/TeacherPage.tsx` (5 sezioni con `stage`, `title`, `audio`) e trigger `READING_PAUSE_TRIGGERS` in `server/db.ts` (`{ 2: 2, 4: 3, 5: 4, 7: 5 }`).

---

## 2. Variante A — Cambiare solo il CONTENUTO (stessa struttura: 10 domande, 4 opzioni)

Il caso più semplice: stesse domande numerate da 1 a 10, stesse 5 sezioni, stesso audio. Preparare un file JSON (modello: `skills/quiz-interattivo-con-audio-sorgente/templates/questions_example.json`) e usare lo script della sezione 0, oppure a mano:

1. Sostituire l'array in `server/questions.ts` (mantenere `number` 1–10 progressivo; `sectionTitle` opzionale ma consigliato per coerenza con le 5 sezioni audio; `correctAnswer` deve essere **identica a una delle `options`**, confronto esatto case-sensitive).
2. Non serve toccare nulla d'altro: validatori, UI, PDF e audio restano validi.

```json
{
  "title": "CUESTIONARIO SOBRE FEDERICO GARCÍA LORCA",
  "report_pdf_filename": "Report_Lorca",
  "blank_pdf_filename": "Cuestionario_Lorca",
  "questions": [
    {
      "number": 1,
      "sectionTitle": "1 · EL AUTOR",
      "question": "¿Dónde nació Federico García Lorca?",
      "options": ["En Fuente Vaqueros", "En Granada", "En Madrid", "En Sevilla"],
      "correctAnswer": "En Fuente Vaqueros"
    }
  ]
}
```

**Verifica:** `pnpm check` senza errori; in UI le opzioni sono 4 per domanda e i PDF mostrano tutto.

---

## 3. Variante B — Cambiare anche il NUMERO di domande (e le pause)

Il numero di domande è libero (il voto resta su base 10), ma nell'app ci sono **riferimenti fissi a 10** da aggiornare:

1. `server/questions.ts` → nuovo array con `number` da 1 a N.
2. `server/routers.ts` → aggiornare **tutti** i validatori sul numero domanda da `.max(10)` a `.max(N)` (cerchiali con `grep -n "max(10)" server/routers.ts`). ⚠️ NON toccare lo `.max(10)` dello **score** nel `complete`/riepilogo: il voto è **fisso su base 10** anche con N≠10 domande.
3. **Pause di lettura**: oggi scattano dopo le domande 2, 4, 5 e 7 (mappa `READING_PAUSE_TRIGGERS` in `server/db.ts`). Se N cambia o vuoi pause diverse, aggiorna questa mappa (`{ numeroDomandaDopoCuiFermarsi: stageDaMostrare }`) in modo che `stage` punti a una sezione esistente di `READING_SECTIONS`.
4. **Sezioni audio**: se cambi il numero di sezioni/pause devi allineare `READING_SECTIONS` in `client/src/pages/TeacherPage.tsx` (aggiungere/rimuovere `{ stage, title, audio }`) e i file audio (v. Variante D).
5. **Riferimenti `/N` nella UI**: l'interfaccia mostra "PREGUNTA X" senza totale; se in una futura UI compare "X/N" o una barra di avanzamento su N, aggiornarla (grep per `/10`, `of 10`, `totalQuestions`, `questions.length` in `client/src/pages/`).

**Verifica:** con 8 domande, le pause dovrebbero cadere dopo i numeri della nuova mappa; con 12 domande, l'ultima sezione audio copre più domande; il voto resta X/10.

---

## 4. Variante C — Cambiare la TIPOLOGIA delle domande

L'app oggi gestisce solo la **scelta multipla singola**. Le altre tipologie si ottengono estendendo il modello con un campo `type`. Ecco il **contratto di dati consigliato** e i file da modificare. La regola d'oro: mantieni il contratto esistente lato studente (`selectedAnswer` come stringa, o estendilo in modo controllato) così dashboard, contatore, riepilogo e PDF continuano a funzionare.

### 4.1 Aggiungi il campo `type` al tipo e ai dati

In `server/questions.ts`:

```ts
export type BecquerQuestion = {
  number: number;
  sectionTitle?: string;
  question: string;
  type?: "multiple" | "truefalse" | "fillblank" | "match" | "reorder" | "shortanswer"; // default "multiple"
  options?: string[];      // per multiple / truefalse
  correctAnswer: string;   // confronto esatto (o normalizzato per reorder/shortanswer)
  // campi opzionali per i tipi speciali (vedi sotto)
};
```

**VERO/FALSO** (`truefalse`) — non richiede quasi codice: basta `options: ["Vero", "Falso"]` con `type: "truefalse"` (o anche senza `type`, resta una multipla a 2 opzioni):

```ts
{ number: 1, type: "truefalse", question: "Bécquer nació en Sevilla", options: ["Vero", "Falso"], correctAnswer: "Vero" }
```

**Risposta multipla** (`multiple`) — invariata (3 o 4 opzioni, come oggi). Multi-risposta (più esatte) opzionale: `correctAnswer` = `"opt1||opt2"` (separatore `||` già gestito dal PDF) — in tal caso adatta il grading perché accetti sottoinsiemi/insiemi.

**Fill-in-the-blanks strutturato** (`fillblank`) — una frase con segnaposto `___`; le risposte nell'ordine dei segnaposto:

```ts
{ number: 2, type: "fillblank", question: "Bécquer escribió ___ y ___", blanks: 2, correctAnswer: ["Rimas", "Leyendas"] }
```

**Abbinamento immagine-parola** (`match`) — coppie (immagine → parola) da abbinare (le immagini vanno in `client/public/img/`):

```ts
{ number: 3, type: "match", question: "Abbina ogni immagine alla parola", pairs: [
  { image: "/img/rimas.png", word: "rimas" },
  { image: "/img/leyendas.png", word: "leyendas" },
] }
```

**Riordino della parola** (`reorder`) — lettere (o parole) mescolate da riordinare:

```ts
{ number: 4, type: "reorder", question: "Riordina le lettere", scrambled: "arims", correctAnswer: "rimas" }
```

**Risposta breve di una parola** (`shortanswer`) — input di testo, risposta breve:

```ts
{ number: 5, type: "shortanswer", question: "¿Cómo se llama la obra principal?", correctAnswer: "Rimas" }
```

### 4.2 Aggiorna il GRADING (server)

In `server/routers.ts` fai sì che la verifica gestisca ogni tipo:

- `multiple` (singola) e `truefalse` → confronto **esatto** di stringa;
- `multiple` multi-risposta (`||`) / `fillblank` / `match` → confronto di **insieme** (per `match` l'ordine non conta; per `fillblank` l'ordine dei segnaposto sì);
- `reorder` / `shortanswer` → confronto **normalizzato** (`.trim().toLowerCase()`, ignorando maiuscole/spazi/articoli opzionali).

Estendi il payload di submit solo se serve (es. array per `match`), mantenendo il salvataggio su `risposte.selectedAnswer` come stringa serializzata (es. `JSON.stringify` o `||`) così il riepilogo e il PDF restano invariati.

### 4.3 Aggiorna il RENDERING (client)

In `client/src/pages/StudentQuiz.tsx` oggi esiste solo il ramo `multiple` (bottoni da `currentQ.options`). Aggiungi un ramo per ogni `type`:

- `truefalse` → due bottoni «Vero» / «Falso» (oppure riusa il ramo multipla con 2 opzioni);
- `fillblank` → tanti campi di input quanti sono i `blanks`;
- `match` → coppie cliccabili (o menu a tendina) immagine↔parola;
- `reorder` → blocchi/lettere trascinabili (o un campo di testo);
- `shortanswer` → un campo di testo.

Lato docente (`TeacherPage.tsx`, `AnswerDetails`) il dropdown mostra già `selectedAnswer` vs `correctAnswer` in forma testuale: assicurati che le risposte serializzate vengano stampate in modo leggibile (sostituisci `||` con ", ").

### 4.4 Aggiorna il PDF

In `client/src/lib/reportPdf.ts` la stampa attuale assume `options` + `correctAnswer` (scelta multipla). Per i nuovi tipi stampa **in forma testuale** la risposta data vs quella esatta, mantenendo i simboli vettoriali ✔/✘ e la legenda (v. `ACCESSIBILITA.md`): il significato non deve mai dipendere solo dal colore. Per `match`/`fillblank`/`reorder`/`shortanswer` puoi stampare «Risposta: … / Esatta: …» su righe separate.

### 4.5 Verifica e deploy

```bash
pnpm check     # nessun errore TypeScript
pnpm build     # build di produzione
```

Poi deploy di **preview** e test di **ogni tipologia** (crea classe, entra come studente, controlla opzioni/input, PDF, dropdown docente), infine deploy di **produzione** (solo dopo conferma esplicita dell'utente).

---

## 5. Variante D — Cambiare l'AUDIO (segmenti delle pause di lettura)

I 5 file audio sono in `client/public/audio/segment_1.m4a` … `segment_5.m4a` e sono referenziati da `READING_SECTIONS` in `client/src/pages/TeacherPage.tsx`:

```ts
const READING_SECTIONS = [
  { stage: 1, title: "1 · El autor",            audio: "/audio/segment_1.m4a" },
  { stage: 2, title: "2 · La quintaesencia…",   audio: "/audio/segment_2.m4a" },
  // …
];
```

Per cambiare l'audio:

1. **Sostituisci i file** `client/public/audio/segment_N.m4a` con i nuovi (stessi nomi = nessuna modifica al codice). Formato consigliato: M4A/AAC 128 kbps mono/stereo; i tagli si fanno con ffmpeg (vedi `README.md` → sezione "Regolazione Tempi Audio").
2. Se cambiano i **titoli** delle sezioni o il numero di sezioni, aggiorna `READING_SECTIONS` e la mappa `READING_PAUSE_TRIGGERS` in `server/db.ts` (v. Variante B).
3. **Se il contenuto audio è nuovo ma la struttura resta identica** (5 sezioni, stesse pause dopo Q2/Q4/Q5/Q7), basta il punto 1: lo script di clonazione copia già i file audio dal sorgente, quindi sostituiscili dopo la clonazione (o prima, nel sorgente).

> 💡 Se il nuovo tema non ha "paragrafi da ascoltare", si può disattivare la pausa svuotando `READING_PAUSE_TRIGGERS` (`{}`): il quiz scorre senza fermate e gli audio non vengono usati.

---

## 6. Riepilogo dei file da toccare

| Cosa cambi | File |
|---|---|
| Dati domande (+ campo `type` per nuove tipologie) | `server/questions.ts` |
| Grading / verifica per tipologia | `server/routers.ts` |
| Voto su base 10 / totali | `server/db.ts` (solo se necessario) |
| Mappa pause di lettura | `server/db.ts` → `READING_PAUSE_TRIGGERS` |
| Segmenti audio | `client/public/audio/segment_N.m4a` |
| Titoli/testi pause | `client/src/pages/TeacherPage.tsx` → `READING_SECTIONS` |
| Rendering studente per tipologia | `client/src/pages/StudentQuiz.tsx` |
| Dropdown docente (AnswerDetails) | `client/src/pages/TeacherPage.tsx` |
| PDF per tipologia | `client/src/lib/reportPdf.ts` |
| Titolo UI / titolo PDF | `client/index.html`, pagine in `client/src/pages/`, `reportPdf.ts` |

**Regola d'oro**: l'app NON ha copie mirror delle domande: `server/questions.ts` è l'unico file canonico. Modifica i file *dentro* `server/` e `client/`, poi esegui `pnpm check`. L'accessibilità (font OpenDyslexic, barra 5 moduli, TTS, alto contrasto, righello, ARIA) è parte **obbligatoria** dell'app: non rimuoverla quando adatti le domande.

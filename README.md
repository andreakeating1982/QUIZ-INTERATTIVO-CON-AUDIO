# 📚 QUIZ INTERATTIVO CON AUDIO SORGENTE

> **Nome storico:** Bécquer Quiz Interattivo

App full-stack per quiz in classe con **segmenti audio e pause di lettura**: gli studenti si uniscono con un codice a 4 cifre, ascoltano i paragrafi audio, rispondono alle domande a scelta multipla in tempo reale e il docente vede i punteggi in diretta, con report PDF scaricabili. Originariamente creata come **"Bécquer Quiz Interattivo"** (quiz su Gustavo Adolfo Bécquer), questa app è ora il **QUIZ INTERATTIVO CON AUDIO SORGENTE**: la base da cui si generano nuove app identiche con un set di domande diverso.

- **Stack:** Vite + React + TypeScript + Tailwind v4 + tRPC + Drizzle + SQLite + jsPDF
- **Accessibilità completa** (v. `ACCESSIBILITA.md`): font **OpenDyslexic** in UI e PDF, **barra accessibilità** a 5 moduli (FONT / INTERLINEA / RIGHELLO / MODALITÀ / ASCOLTO), **TTS** italiano, **alto contrasto**, **righello di lettura**, screen reader ARIA, `prefers-reduced-motion`.
- **Deploy:** Docker / Render / Railway / hosting proprio
- **🌐 App Live:** [https://becquer-quiz.easy-peasy.site](https://becquer-quiz.easy-peasy.site)
- **👨‍🏫 Area Docente:** [https://becquer-quiz.easy-peasy.site/docente](https://becquer-quiz.easy-peasy.site/docente)
- **Questo pacchetto include le skill di clonazione** (cartella `skills/`): chi le usa (Marky) può ricostruire l'app identica cambiando solo le domande, anche a partire da questa repository GitHub.
- **📄 Guide per IA e umani** (in questa repo): [`REBUILD.md`](REBUILD.md) (ricostruzione identica) · [`ADATTARE.md`](ADATTARE.md) (varianti: contenuto, audio, numero e tipologia di domande) · [`RENDER.md`](RENDER.md) (trasferimento Easy-Peasy → GitHub → Render) · [`AGENTS.md`](AGENTS.md) (regole per agenti IA) · [`ACCESSIBILITA.md`](ACCESSIBILITA.md) (misure riusabili).

---

## 🎯 Creare una NUOVA app con un set di domande diverso

Il modo più rapido è usare la skill **`quiz-interattivo-con-audio-sorgente`** inclusa in `skills/`. Lo script `clone_audio_quiz_app.py` fa tutto da solo: copia il progetto, rinomina `package.json` e `<title>`, inizializza git, applica il nuovo set di domande (domande, validatori, riferimenti `/N` in UI, titoli e nomi file PDF), e lancia `pnpm install` + `pnpm check`.

### 1. Prepara il file JSON delle domande

Modello: `skills/quiz-interattivo-con-audio-sorgente/templates/questions_example.json`

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

- `title` (obbligatorio): intestazione stampata sui PDF.
- `questions` (obbligatorio): numero di domande **qualsiasi**, opzioni **da 2 in su**. Il voto finale resta sempre su base 10.
- `sectionTitle` (opzionale per domanda): intestazione sezione mostrata sopra "PREGUNTA X".
- `report_pdf_filename` / `blank_pdf_filename` (opzionali): prefissi dei file PDF.

### 2. Lancia la clonazione

**Sorgente locale:**

```bash
python skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name quiz-lorca \
  --questions /percorso/domande.json \
  --title "Lorca Quiz Interattivo"
```

**Sorgente GitHub (repository già caricata):**

```bash
python skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name quiz-lorca \
  --questions /percorso/domande.json \
  --title "Lorca Quiz Interattivo" \
  --source https://github.com/<utente>/<nome-repo>
```

Lo script clona la repository da solo in `/home/user/_repo_<nome>` e ci lavora sopra (nessuna modifica alla tua repo).

**Come usarla con Marky:** carica questo pacchetto su GitHub (repo pubblica), poi chiedi a Marky un'app simile indicando il link, es. *"crea un quiz su Cervantes usando come sorgente la mia repo https://github.com/<utente>/<nome-repo>"* — lo script clonerà da lì. La repo è **autosufficiente**: contiene `skills/quiz-interattivo-con-audio-sorgente/` (SKILL.md + script + template) e questo README, quindi Marky può clonare anche leggendo le skill direttamente dalla repository, senza altri file.

> ⚠️ **Importante:** prima di caricare su GitHub, assicurati di usare **questa versione aggiornata del pacchetto** (ZIP qui sotto). La repo attualmente online (`gustavoadolfobecquer-quizinterattivo`, aggiornata 2026-08-04) NON contiene i fix del 2026-08-23 (data centrata, flex-wrap riga studente, tooltip touch), **né i fix PDF del 2026-08-24** (punteggio su base 10 e box PUNTEGGIO su un'unica facciata), **né i fix del 2026-09-07** (report PDF a UNA pagina per alunno con font/interlinea auto-adattivi e SENZA riepilogo RISPOSTE CORRETTE/INCORRETTE; questionario in bianco a UNA pagina con opzioni indentate dopo i quadratini; dropdown docente con risposta ESATTA in verde e testo che va a capo su mobile). Le app clonate da quella versione sarebbero prive di questi miglioramenti. Dopo la clonazione da GitHub, verifica sempre che la repo sia aggiornata:
>
> ```bash
> grep -c "datetime-edit" client/src/index.css                    # >= 3 (fix 2026-08-23)
> grep -c "showPicker" client/src/pages/TeacherPage.tsx           # >= 1 (fix 2026-08-23)
> grep -c "massimo 10/10" client/src/lib/reportPdf.ts            # >= 2 (fix PDF 2026-08-24 + fix 2026-09-07)
> grep -c "RISPOSTE CORRETTE" client/src/lib/reportPdf.ts        # >= 2 SOLO come commenti "rimosso" (nessun riepilogo disegnato)
> grep -c "listWithAnswers" client/src/pages/TeacherPage.tsx     # >= 1 (dropdown docente con risposta esatta, 2026-09-07)
> ```
>
> Se mancano, ricaricare il pacchetto aggiornato prima di caricarlo.

> 💡 **Lo script fa 7 passi e verifica da solo:** copia progetto → rinomina `package.json`/`<title>` → git init → applica domande → `pnpm install` + `pnpm check` → **verifica automatica** (audio presenti, validatori `.max(N)`, titolo aggiornato, nessun residuo "Bécquer") → **export ZIP** pronto per GitHub.

> 📦 **Le skill viaggiano con il pacchetto:** la cartella `skills/` è inclusa in questo ZIP e quindi anche nella repository GitHub che ne deriva. Quando chiedi una nuova app con un set di domande diverso, Marky può leggere direttamente `skills/quiz-interattivo-con-audio-sorgente/SKILL.md` dalla repository e clonare con `--source <URL-GitHub>`: la repo è autosufficiente, nessun altro file necessario.

### 3. Verifica e deploy

1. `pnpm check` nella nuova cartella (fatto dallo script)
2. Deploy **PREVIEW** e test visivo (apri classe docente, entra come studente, verifica domande/opzioni/PDF/audio)
3. **Checkpoint** e **conferma esplicita** dell'utente
4. Deploy **PRODUZIONE**

---

## 📦 Cosa cambia vs cosa resta identico

**Cambia:** array domande in `server/questions.ts`, validatori `.max(N)` in `server/routers.ts`, riferimenti `/N` in UI ("DOMANDA X/N", progress bar), titoli e nomi file PDF in `reportPdf.ts`, `package.json` name, `<title>` browser.

**Resta identico:** header "QUIZ INTERATTIVO", layout docente/studente, **segmenti audio `client/public/audio/*.m4a` e testi `READING_SECTIONS`** (pause di lettura), codici classe e password, logica sessioni e contatore studenti, PDF **accessibili** (font OpenDyslexic incorporato, **UNA pagina per alunno** con font/interlinea auto-adattivi 14→8 pt e 1.5→1.0, opzioni con ✔/✘ + legenda, **niente riepilogo numerico RISPOSTE CORRETTE/INCORRETTE**, box PUNTEGGIO su UN'UNICA riga con cornice blu, voto su base 10 fisso) e **accessibilità UI completa** (barra FONT/INTERLINEA/RIGHELLO/MODALITÀ/ASCOLTO, TTS italiano, alto contrasto, righello — v. ACCESSIBILITA.md), stili CSS (centratura data, tooltip touch, nome studente una riga + ellissi, riga studente `div role=button`, `flex-wrap` codice, "PREGUNTA X", "Ascolta"), dropdown docente con risposta ESATTA in verde (testo a capo su mobile), script iframe per embed Blogger.

---

## 🗂️ Le skill incluse (cartella `skills/`)

| Skill | Scopo |
|-------|-------|
| **`quiz-interattivo-con-audio-sorgente`** | **Clonazione**: crea una copia identica dell'app con un set di domande diverso (script `clone_audio_quiz_app.py` + `change_quiz_theme.py` + template). Supporta sorgente locale O GitHub. |
| **`becquer-quiz`** | **Manutenzione** del sorgente: modifiche UI, logica sessioni, deploy, PDF, contatore studenti, checkpoint. NON per cambiare le domande del sorgente. |
| **`quiz-adapter`** | **Cambio domande su progetto esistente** (script `change_quiz_theme.py` con `--project`). Usato automaticamente dal cloner. |

---

## 📱 Come si usa

### Per l'insegnante
1. Apri l'app, clicca **"Crea Classe"**
2. Scegli un nome (es. "5D"), una data e un codice a 4 cifre
3. Clicca **"Avvia Sessione"** — compare il codice di accesso
4. Gli studenti si collegano da qualsiasi dispositivo
5. Clicca **"Avanti"** per avanzare tra le domande
6. **Pause di lettura:** dopo le domande 2, 4, 5 e 7 appare una schermata di pausa con il testo:
   > *"Ascolta tutto il prossimo paragrafo prima di procedere con le domande successive"*
   - Clicca **CONTINUA** per procedere (solo l'insegnante può farlo)
7. Premi **"Mostra Risposta Esatta"** per rivelare la risposta
8. A fine sessione, scarica il **Report PDF** o il **Questionario PDF**

### Per lo studente
1. Apri l'app sul telefono
2. Inserisci il nome e il codice della classe
3. Rispondi alle domande
4. Durante le pause di lettura, attendi che l'insegnante prosegua
5. Vedi il punteggio in tempo reale

---

## 📋 Domande e Sezioni Tematiche (sorgente Bécquer)

Le 10 domande del sorgente sono suddivise in 5 sezioni tematiche, corrispondenti alla struttura del questionario originale in spagnolo:

| Sezione | Domande | Argomento |
|---------|:-------:|-----------|
| **EL AUTOR** | Q1, Q2 | Biografia di Bécquer |
| **LA QUINTAESENCIA DEL ESCRITOR ROMANTICO** | Q3, Q4 | Il Romanticismo e le opere principali |
| **RIMAS (DESDE 1858)** | Q5 | Storia del manoscritto delle Rimas |
| **3.1. ESTRUCTURA** | Q6, Q7 | Struttura delle Rimas |
| **3.2. LENGUAJE Y ESTILO** | Q8, Q9, Q10 | Stile e linguaggio poetico |

Ogni domanda mostra il titolo della sezione come badge sopra il numero della domanda, sia per l'insegnante che per lo studente.

### I 5 Segmenti Audio

I file audio sono in `client/public/audio/segment_1.m4a` ... `segment_5.m4a`.

| # | Segmento | Audio termina con |
|---|---|---|
| 🎵1 | El autor | "...reconocimiento" |
| 🎵2 | Quintaesencia | "...lúgubre" |
| 🎵3 | Rimas | "...Romanticismo español" |
| 🎵4 | Estructura | "...sueños" |
| 🎵5 | Lenguaje | inizia con "3.2, lenguaje y estilo..." |

---

## 🚀 Deploy su Render (gratuito, 10 minuti)

Render ti offre **hosting Docker + database PostgreSQL gratis**, senza bisogno di carta di credito.

### 1️⃣ Prepara il repository su GitHub

1. Crea un account su [GitHub](https://github.com) (se non ce l'hai)
2. Clicca su **"+"** → **"New repository"**
3. Dagli un nome (es. `becquer-quiz`)
4. **Importante:** lascialo su **"Public"** (per il free tier di Render)
5. Clicca **"Create repository"**
6. Ora hai due modi per caricare i file:
   - **Opzione A (facile):** scarica il pacchetto ZIP qui sotto, estrailo e carica i file tramite l'interfaccia web di GitHub (trascina e rilascia)
   - **Opzione B (se usi Git):** `git clone`, copia i file, `git push`

### 2️⃣ Collega Render al repository

1. Vai su [Render Dashboard](https://dashboard.render.com)
2. Clicca **"New +"** → **"Blueprint"** (non "Web Service"!)
3. Connetti il tuo account GitHub
4. Scegli il repository
5. Render leggerà il file `render.yaml` e ti mostrerà un riepilogo
6. Clicca **"Apply"**

### 3️⃣ Aspetta il deploy

Render ci mette **3-5 minuti** per la prima build. Quando vedi `✓ Service is live 🎉`, clicca sul link.

### 4️⃣ Collega al tuo blog Blogger

**🔗 Opzione A — Link nel menu (consigliata)**
Vai su Blogger → **"Layout"** → **"Aggiungi un Gadget"** → **"Link List"**.

**🖼️ Opzione B — Cornice dinamica (il quiz appare dentro il blog, consigliata)**
1. Vai su Blogger → **"Pagine"** → **"Nuova pagina"** → modalità **"HTML"**.
2. Incolla l'**INTERO contenuto** del file
   `cornice-dinamica/embed-becquer-quiz-dedicata.html`
   (⭐ versione dedicata v3: titolo + pulsanti sulla stessa riga centrati,
   Schermo intero/Ricarica, spinner, stato online/errore con Riprova, altezza
   automatica `labvisivo:height` + ping, impermeabile e anti-loop).
   In alternativa: `cornice-dinamica/embed-becquer-quiz-lite.html` (minima,
   riutilizzabile con `?app=`) oppure
   `cornice-dinamica/embed-becquer-quiz.html` (autosufficiente, font in base64).
3. La cornice punta già all'URL di produzione `https://becquer-quiz.easy-peasy.site/`
   e si adatta da sola all'altezza del contenuto (desktop/tablet/mobile).

> 📦 La cartella `cornice-dinamica/` include anche `README.md` (istruzioni
> complete), `test-impermeabile.html` (pagina di verifica con 2 cornici +
> intruso) e i font OpenDyslexic. Niente più iframe fisso: l'altezza è sempre
> quella reale dell'app (nessun contenuto tagliato, nessun vuoto enorme).

---

## ⚙️ Deploy manuale (senza Render Blueprint)

### Con Render (manuale)
1. **"New +"** → **"Web Service"** → Connetti il tuo GitHub → **Runtime:** Docker → **Plan:** Free
2. **"Advanced"** → **"Add Environment Variable"**:
   - `NODE_ENV` → `production`
   - `BETTER_AUTH_SECRET` → `openssl rand -base64 32`
3. Crea **PostgreSQL** (Free) e aggiungi `DATABASE_URL` al Web Service

### Con Railway
1. **"New Project"** → **"Deploy from GitHub repo"**
2. Railway rileva il Dockerfile automaticamente
3. Aggiungi `NODE_ENV` e `BETTER_AUTH_SECRET`
4. Aggiungi PostgreSQL: **"New"** → **"Database"** → **"Add PostgreSQL"** (imposta `DATABASE_URL`)

### Con Docker Compose (server proprio)
```bash
docker compose -f deploy/docker-compose.yml up -d
```
L'app sarà su `http://localhost:3000`.

---

## 🏗️ Struttura del progetto

```
├── client/                    # Frontend React + Vite + Tailwind
│   └── src/
│       ├── pages/
│       │   ├── TeacherPage.tsx     # Pannello insegnante (include READING_SECTIONS)
│       │   ├── StudentQuiz.tsx     # Interfaccia studente (PREGUNTA X)
│       │   ├── Home.tsx            # Pagina principale
│       │   └── NotFound.tsx        # 404
│       ├── lib/reportPdf.ts        # Report PDF (jsPDF)
│       ├── index.css               # Stili globali + PLUM THEME + data centrata
│       └── public/audio/           # Segmenti audio .m4a
├── server/                    # Backend Express + tRPC
│   ├── questions.ts           # DOMANDE (array BECQUER_QUESTIONS, sectionTitle)
│   ├── routers.ts             # API endpoints tRPC (validatori .max(N))
│   ├── db.ts                  # Database client e query
│   └── _core/                 # Scaffold (auth, trpc, env)
├── deploy/                    # Deploy (docker-compose, docker-entrypoint.sh; Dockerfile = copia del root)
├── Dockerfile                 # Build multi-stage (usato da render.yaml e docker-compose)
├── .dockerignore
├── REBUILD.md                 # Ricostruzione identica (guida IA/umani)
├── ADATTARE.md                # Varianti: contenuto, audio, numero e tipologia domande
├── RENDER.md                  # Trasferimento Easy-Peasy → GitHub → Render
├── AGENTS.md                  # Regole per agenti IA
├── skills/
│   ├── quiz-interattivo-con-audio-sorgente/   # CLONAZIONE (script + template)
│   ├── becquer-quiz/                           # Manutenzione sorgente
│   └── quiz-adapter/                           # Cambio domande su progetto esistente
├── drizzle/                   # Schema database + migrazioni
├── render.yaml                # Config Render Blueprint
├── MIGRAZIONE_DETTAGLIATA.md  # Report completo della migrazione
└── README.md                  # Questo file
```

---

## 💡 Funzionalità Esclusive del Sorgente

| Funzionalità | Descrizione |
|---|---|
| ✅ **Segmenti audio + pause di lettura** | Schermate obbligatorie dopo Q2, Q4, Q5, Q7 con audio player e testo didattico |
| ✅ **Titoli di sezione** | Badge sopra ogni domanda (EL AUTOR, RIMAS, ecc.) |
| ✅ **Controllo sincrono** | Insegnante e studente vedono la pausa contemporaneamente |
| ✅ **Report PDF** | Report studenti e questionario in bianco stampabile |
| ✅ **Codice classe a 4 cifre** | Accesso rapido per gli studenti |
| ✅ **Contatore studenti** | Polling 2s con badge verde "studenti attivi" |
| ✅ **Re-entry studenti** | Risposte già inviate bloccate ("Hai già risposto a questa domanda.") |
| ✅ **Responsive** | Funziona su telefono, tablet e desktop (pattern flex-wrap, tooltip touch, data centrata) |
| ✅ **Integrazione Blogger** | iframe embed-ready con altezza dinamica |

---

## 📦 Pacchetto ZIP per GitHub

Questo pacchetto (cartella `skills/` inclusa) è pronto per essere caricato su GitHub. Per rigenerarlo:

```bash
cd /home/user && zip -r quiz-interattivo-con-audio-sorgente-completo.zip becquer-quiz/ \
  -x "becquer-quiz/node_modules/*" \
  -x "becquer-quiz/.git/*" \
  -x "becquer-quiz/dist/*" \
  -x "becquer-quiz/.env" \
  -x "becquer-quiz/.quiz-backups/*" \
  -x "becquer-quiz/dev-server.log" \
  -x "becquer-quiz/.DS_Store" \
  -x "*.zip"
```

> 📦 Il pacchetto include: sorgenti completi, `cornice-dinamica/` (embed Blogger),
> `skills/` (skill di clonazione/manutenzione), `REBUILD.md`, `ADATTARE.md`,
> `RENDER.md`, `AGENTS.md`, `ACCESSIBILITA.md`, `render.yaml`, `Dockerfile`,
> `deploy/` e `.env.example` (NON il `.env`).

Per rigenerare il pacchetto aggiornato dopo nuove modifiche:

```bash
cd /home/user && rm -f quiz-interattivo-con-audio-sorgente-completo.zip && \
zip -r quiz-interattivo-con-audio-sorgente-completo.zip becquer-quiz/ \
  -x "becquer-quiz/node_modules/*" -x "becquer-quiz/.git/*" -x "becquer-quiz/dist/*" \
  -x "becquer-quiz/.env" -x "becquer-quiz/.quiz-backups/*" -x "becquer-quiz/dev-server.log" \
  -x "becquer-quiz/.DS_Store" -x "*.zip"
```

> 🔒 **Sicurezza:** il file `.env` (chiavi API e segreti) **NON è incluso** — resta solo `.env.example`. Dopo un clone da GitHub (che non contiene `.env`), ricreare `.env` da `.env.example` + variabili della sandbox (la piattaforma inietta `EASY_PEASY_API_KEY`).

---

## 📄 Licenza

MIT — libero di usare, modificare e condividere.

---
name: quiz-interattivo-con-audio-sorgente
description: "Clona istantaneamente l'app QUIZ INTERATTIVO CON AUDIO SORGENTE (in /home/user/becquer-quiz) in una NUOVA app identica con un set di domande diverso. Usare quando l'utente chiede una nuova app simile/uguale al quiz sorgente con audio (stesse pause di lettura, stessi segmenti audio, stesso aspetto, codici classe, sessioni, contatore studenti, report PDF, voto su 10) cambiando SOLO le domande. Copre: costruzione del JSON domande (anche da testo libero dell'utente), clonazione da cartella locale o repo GitHub (--source), verifica automatica, deploy preview/produzione, export ZIP per GitHub. NON usare per modificare le domande dell'app sorgente né per manutenerla (usare la skill becquer-quiz)."
---

# Quiz Interattivo Con Audio Sorgente — Skill di Clonazione

## Quando usare

Usare QUESTA skill ogni volta che l'utente chiede **una nuova app uguale al QUIZ INTERATTIVO CON AUDIO SORGENTE** (l'app Bécquer Quiz) cambiando **solo il set di domande** — es. "crea un quiz simile su García Márquez", "clona l'app con queste domande", "una nuova versione con un altro autore". NON usarla per modificare le domande o la UI dell'app sorgente stessa (usare la skill `becquer-quiz`).

## Cosa produce

Una copia **identica** del sorgente in `/home/user/<nome>` (Vite + React + TypeScript + Tailwind v4 + tRPC + Drizzle + SQLite + jsPDF), pronta per deploy, con:
- **solo le domande diverse** (e opzionalmente il titolo della scheda browser),
- tutto il resto identico: header "QUIZ INTERATTIVO", UI docente/studente, **segmenti audio `client/public/audio/segment_1..5.m4a` e testi delle pause di lettura (`READING_SECTIONS`)**, codici classe e password, logica sessioni, contatore studenti, report PDF **accessibili** (font OpenDyslexic incorporato 14 pt, opzioni con simboli ✔/✘ + legenda, box PUNTEGGIO su UN'UNICA riga con cornice blu e margini stretti, voto su base 10: "PUNTEGGIO: X/10 — ogni risposta corretta = 1 pt — massimo 10/10", paginazione automatica senza domande spezzate), **accessibilità UI completa** (barra FONT/INTERLINEA/RIGHELLO/MODALITÀ/ASCOLTO, TTS italiano, alto contrasto, righello, font OpenDyslexic in tutta la UI), stili (data centrata, tooltip touch, flex-wrap riga studente).

**NOME CANONICO:** l'app sorgente si chiama **QUIZ INTERATTIVO CON AUDIO SORGENTE** (nome storico: Bécquer Quiz). Nei file di codice il nome storico può restare (è solo un simbolo interno, es. `BECQUER_QUESTIONS`), ma nella comunicazione con l'utente e nei titoli usare sempre il nome canonico.

## Ricetta rapida (ricostruire subito un'app identica)

1. Costruisci il JSON delle domande (dal testo libero dell'utente o dal template) in `/home/user/<nome>-questions.json`.
2. Lancia la clonazione (un solo comando — copia, rinomina, domande, install, check, verifica, ZIP):
   ```bash
   python /home/user/skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
     --name <nome> --questions <domande.json> [--title "Titolo"] [--source <link-repo-GitHub>] [--force]
   ```
   Se l'utente fornisce il link GitHub della sua repository del sorgente, aggiungere `--source <link>` (vedi sezione "Flusso con la repository GitHub dell'utente").
3. Leggi l'output: tutti i passi `✔` e verifica automatica senza `❌`.
4. Deploy preview su `/home/user/<nome>` → test visivo → checkpoint → conferma esplicita utente → produzione.
5. Consegna: URL produzione + `/home/user/<nome>.zip` per GitHub + istruzioni embed Blogger.

Tutto il resto (audio, pause di lettura, UI, sessioni, PDF, stili) resta **IDENTICO al sorgente per costruzione**: non serve modificare altro.

## Flusso con la repository GitHub dell'utente

Quando l'utente carica su GitHub il pacchetto del sorgente (o una nuova app clonata) e ne fornisce il link, usare QUELLA repository come sorgente di riferimento per le clonazioni successive:

1. **Confermare il link** della repo (es. `https://github.com/<utente>/<nome-repo>`) — se l'utente dice "la mia repo su GitHub" senza link, chiederlo (o cercarla nell'account GitHub dell'utente).
2. **Clonare con `--source <link-repo>`**: lo script clona la repo in `/home/user/_repo_<nome>` e ci lavora sopra **senza modificarla**. Il default resta `/home/user/becquer-quiz` (sorgente locale sempre aggiornato) se non viene fornito alcun link.
3. **La repo è autosufficiente**: il pacchetto caricato include `skills/quiz-interattivo-con-audio-sorgente/` (SKILL.md + script + template) e `README.md` con tutte le istruzioni — Marky può quindi clonare anche leggendo le skill direttamente dalla repo. Se la repo non li contiene, usare le skill locali `/home/user/skills/...` e consigliare all'utente di ricaricare la versione aggiornata del pacchetto.
4. **Verificare SEMPRE che la repo sia aggiornata** dopo il clone (se mancano i fix, NON clonare e chiedere di ricaricare, oppure usare il sorgente locale):
   ```bash
   grep -c "datetime-edit" client/src/index.css                       # >= 3 (fix data 2026-08-23)
   grep -c "showPicker" client/src/pages/TeacherPage.tsx              # >= 1 (fix data 2026-08-23)
   grep -c "massimo 10/10" client/src/lib/reportPdf.ts              # = 2 (fix PDF 2026-08-24)
   ```
5. **Repo di riferimento per l'aspetto dei PDF** (in particolare il box PUNTEGGIO su un'unica riga): `https://github.com/andreakeating1982/Quizinterattivo-senzaaudio-sorgente`.

## Architettura (NESSUN file mirror)

A differenza dell'app Shakespeare Quiz, **questa app NON ha file mirror**: ogni file esiste in UNA sola copia. Modificare solo il file corretto.

| Ruolo | Percorso unico |
|-------|----------------|
| Domande | `server/questions.ts` (array `BECQUER_QUESTIONS`, campo opzionale `sectionTitle`) |
| Validatori | `server/routers.ts` (`.min(1).max(N)` in 4 endpoint) |
| UI docente | `client/src/pages/TeacherPage.tsx` (include `READING_SECTIONS`) |
| UI studente | `client/src/pages/StudentQuiz.tsx` |
| Report PDF | `client/src/lib/reportPdf.ts` |
| Audio | `client/public/audio/segment_1.m4a` … `segment_5.m4a` |
| Titolo browser | `client/index.html` (`<title>`) |

Le domande hanno campo opzionale `sectionTitle` (es. "1 · EL AUTOR"), mostrato sopra "PREGUNTA X" nella UI studente. Se assente, la domanda non mostra la sezione.

## Flusso di clonazione (4 passi)

### Passo 1 — Prepara il JSON delle domande

**Se l'utente dà le domande in chat (testo libero, anche in italiano):** costruisci TU il JSON seguendo il template, scrivendolo in `/home/user/<nome>-questions.json` (poi passa quel percorso allo script). Regole:

- `title` (obbligatorio): intestazione stampata sui PDF (es. "CUESTIONARIO SOBRE GABRIEL GARCÍA MÁRQUEZ").
- `questions` (obbligatorio): array con `number` (univoci, partono da 1), `question`, `options` (almeno 2), `correctAnswer` (**deve essere una delle options**, verificato dallo script), `sectionTitle` (opzionale).
- `report_pdf_filename` / `blank_pdf_filename` (opzionali): prefissi dei PDF (default `Report_Becquer` / `Cuestionario_Becquer`).
- Numero di domande: **qualsiasi** (1..N). Il voto finale resta **sempre su base 10**: `grade = Math.round((corrette/totali)*100)/10` (in `server/db.ts`) e i PDF mostrano valori **FISSI** `X/10` e `massimo 10/10` (NON `questions.length`).
- Il box PUNTEGGIO (UN'UNICA riga centrata, cornice blu, margini interni stretti) e i testi "Ogni risposta corretta = 1 pt" / "massimo 10/10" restano **identici al sorgente** anche se N≠10 (scelta del docente — NON adattarli al numero di domande).

Modello da copiare: `/home/user/skills/quiz-interattivo-con-audio-sorgente/templates/questions_example.json`

```json
{
  "title": "CUESTIONARIO SOBRE GABRIEL GARCÍA MÁRQUEZ",
  "report_pdf_filename": "Report_GarciaMarquez",
  "blank_pdf_filename": "Cuestionario_GarciaMarquez",
  "questions": [
    {
      "number": 1,
      "sectionTitle": "1 · EL AUTOR",
      "question": "¿Dónde nació Gabriel García Márquez?",
      "options": ["En Aracataca", "En Bogotá", "En Cartagena", "En Medellín"],
      "correctAnswer": "En Aracataca"
    }
  ]
}
```

**Attenzione audio:** i segmenti audio e i testi `READING_SECTIONS` restano quelli del sorgente (lettura su Bécquer). Se il nuovo quiz è su un argomento diverso e l'utente vuole anche nuovi audio/testi di lettura, va gestito a parte (generare audio narrato e sostituire `segment_*.m4a` + `READING_SECTIONS`) — chiedere conferma all'utente prima di clonare, non dare per scontato.

### Passo 2 — Lancia lo script di clonazione

```bash
python /home/user/skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name quiz-marquez \
  --questions /home/user/quiz-marquez-questions.json \
  --title "García Márquez Quiz Interattivo"
```

Lo script (7 passi):
1. Copia il progetto in `/home/user/quiz-marquez` (esclude `node_modules`, `.git`, `dist`, `.quiz-backups`, zip, log).
2. Rinomina `package.json` (name) e il `<title>` di `client/index.html`.
3. Inizializza git e crea il primo commit (necessario per i checkpoint webdev).
4. Lancia `change_quiz_theme.py` sulla **copia** (mai sul sorgente): domande (con `sectionTitle`), validatori `.min(1).max(N)`, riferimenti `/N` in TeacherPage/StudentQuiz, titoli e nomi file PDF.
5. Esegue `pnpm install` e `pnpm check`.
6. **Verifica automatica**: segmenti audio copiati (≥5), `questions.ts` aggiornato, `.max(N)` nei validatori, `package.json` e `<title>` rinominati, nessun residuo "Bécquer" nei file chiave.
7. **Export ZIP** in `/home/user/<nome>.zip` (esclusi node_modules/.git/dist) pronto per GitHub.

Flag utili: `--force` (sovrascrivi), `--no-install` (salta install/check ma fa comunque verifica + ZIP), `--adapter` (percorso alternativo di `change_quiz_theme.py`).

**Sorgente da repository GitHub** — se l'utente ha caricato il pacchetto su GitHub, passare l'URL: lo script clona in `/home/user/_repo_<nome>` e ci lavora sopra:

```bash
python /home/user/skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name quiz-marquez \
  --questions /percorso/domande.json \
  --title "García Márquez Quiz Interattivo" \
  --source https://github.com/<utente>/<repo>
```

⚠️ **Repo aggiornata?** Prima di usare una repo GitHub come sorgente verificare che contenga la **versione aggiornata** (fix del 2026-08-23: data centrata WebKit in index.css, flex-wrap riga studente, tooltip touch, "Ascolta" nelle pause, overlay data con showPicker in TeacherPage — e fix PDF del 2026-08-24: punteggio su base 10 e box PUNTEGGIO su un'unica facciata in `client/src/lib/reportPdf.ts`). Se la repo è datata, la copia NON avrà quei fix: chiedere all'utente di ricaricare la versione aggiornata, oppure usare il sorgente locale `--source /home/user/becquer-quiz` (sempre aggiornato). Verifica rapida post-clone: `grep -c "datetime-edit" client/src/index.css` deve dare >= 3, in TeacherPage.tsx deve esserci `showPicker`, e `grep -c "massimo 10/10" client/src/lib/reportPdf.ts` deve dare 2. La versione aggiornata (2026-09-06) include l'**accessibilità completa** (font OpenDyslexic in UI e PDF, barra 5 moduli, TTS, alto contrasto, righello): verifica anche `grep -c "OpenDyslexic" client/src/lib/reportPdf.ts` (>= 2) e l'esistenza di `client/src/components/AccessibilityToolbar.tsx` + `client/public/fonts/OpenDyslexic-Regular.ttf`.

### Passo 3 — Verifica

1. Leggi l'output dello script: tutti i passi ✔, nessun ❌ nella verifica automatica.
2. Se `pnpm check` fallisce o la verifica segnala ❌, correggi PRIMA di proseguire (backup in `.quiz-backups/`).
3. Checklist manuale rapida nella nuova cartella:
   ```bash
   cd /home/user/<nome>
   grep -n "Bécquer\|Becquer" client/index.html server/questions.ts client/src/lib/reportPdf.ts  # deve restare solo il simbolo BECQUER_QUESTIONS (accettato)
   ls client/public/audio/          # 5 segmenti
   grep -n "max(" server/routers.ts # .max(N) con N = numero domande
   grep -n "OpenDyslexic\|massimo 10/10" client/src/lib/reportPdf.ts  # font accessibile + box su base 10 (2+ occorrenze)
   ```

### Passo 4 — Deploy e consegna

1. **Deploy PREVIEW** (`webdev_deploy` mode=preview, project_dir = nuova cartella) e **test visivo**: apri una classe come docente, entra con uno studente, verifica che domande/opzioni/PDF mostrino il nuovo tema, che i segmenti audio riproducano le pause di lettura e che il resto sia identico al sorgente.
2. **Checkpoint** (`webdev_save_checkpoint`) e chiedi **conferma esplicita** all'utente.
3. **Deploy PRODUZIONE** (`webdev_deploy` mode=production) solo dopo la conferma (mai nella stessa risposta in cui hai scritto codice/creato la preview).
4. Consegna all'utente: URL di produzione + percorso ZIP (`/home/user/<nome>.zip`) per il caricamento su GitHub + istruzioni per l'embed Blogger (iframe con `postMessage` labvisivo:height, vedi embed già usati negli altri quiz).

## Cosa cambia vs cosa resta identico

**Cambia:** array domande in `server/questions.ts`, validatori `.max(N)` in `server/routers.ts`, riferimenti `/N` in UI ("DOMANDA X/N", progress bar), titoli e nomi file PDF in `reportPdf.ts`, `package.json` name, `<title>` del browser, `README`/guide se presenti nella copia.

**Resta identico:** header "QUIZ INTERATTIVO", layout docente/studente, **segmenti audio `client/public/audio/*.m4a` e testi `READING_SECTIONS`** (pause di lettura), codici classe e password, logica sessioni e contatore studenti, report PDF **accessibili** (OpenDyslexic 14 pt, ✔/✘ + legenda, box PUNTEGGIO su UN'UNICA riga, base 10: X/10 e massimo 10/10, paginazione automatica) e **accessibilità UI** (barra 5 moduli, TTS, alto contrasto, righello, font OpenDyslexic), stili CSS (centratura data, tooltip touch, nome studente una riga + ellissi, riga studente `div role=button`, `flex-wrap` codice, "PREGUNTA X", "Ascolta"), script iframe per embed Blogger.

## Pattern di UI da preservare (sorgente)

I pattern sotto sono già nel sorgente e NON vanno alterati durante la clonazione (per i dettagli completi leggere la skill `becquer-quiz`):

- **PREGUNTA X**: la schermata quiz studente mostra `PREGUNTA {currentQNum}` (più `sectionTitle` se presente), NON il testo della domanda (lo vede solo il docente).
- **PAUSA DI LETTURA**: istruzione studente "Ascolta tutto il prossimo paragrafo…" (non "Leggi").
- **Data centrata**: il campo `type="date"` usa l'**overlay** (input trasparente + span centrato `gg/mm/aaaa` + `showPicker()` al click, icona calendario nascosta) — vedi becquer-quiz skill "Campo Data Centrata (Overlay + showPicker)". La regola CSS WebKit in `index.css` viene copiata automaticamente: NON rimuoverla.
- **Riga studente**: `<div role="button">` con `flex flex-wrap` (NON `<button>` annidato); nome con `truncate` + tooltip nero (hover PC + tap mobile via `matchMedia('(hover: none)')`); gruppo stato/pallini/X/chevron in un unico `div` con `flex-wrap min-w-0 max-w-full` (niente `shrink-0`).
- **Codice classe**: riga con `flex flex-wrap` + `shrink-0` sul badge.
- **PDF accessibili (2026-09-06)**: OpenDyslexic incorporato (14 pt), simboli vettoriali ✔/✘ dopo la lettera + legenda, multi-risposta "opt1||opt2" per-opzione, casella blu nel questionario in bianco.
- **PDF punteggio su base 10**: `Voto: X/10` nel report e box PUNTEGGIO su **UN'UNICA riga** (cornice blu, testo centrato sia in orizzontale sia in verticale, larghezza calcolata sul testo con `getTextWidth`, margini interni molto stretti, font adattivo) in report e questionario in bianco: "PUNTEGGIO: X/10 — ogni risposta corretta = 1 pt — massimo 10/10" (report) e "PUNTEGGIO — ogni risposta corretta = 1 pt — massimo 10/10" (bianco) — valori `/10` e `10/10` FISSI (non `questions.length`), come l'app [Quizinterattivo-senzaaudio-sorgente](https://github.com/andreakeating1982/Quizinterattivo-senzaaudio-sorgente) (riferimento per l'aspetto dei PDF). `X = Math.round(student.grade)`, con `grade` già normalizzato su base 10 in `server/db.ts`.
- **PDF impaginazione (accessibile)**: a 14 pt i contenuti lunghi vanno su più pagine in AUTOMATICO — interlinea 1.5 mai compressa; mai una domanda spezzata; riepilogo+legenda+box sempre insieme; pagine di continuazione con mini-intestazione studente.
- **Palette**: tema plum (viola caldo) + grigio/muted, nessun tono stone/ambra nelle card di lettura.

## Backup e rollback

`change_quiz_theme.py` salva i backup in `<progetto>/.quiz-backups/` prima di ogni modifica. Per ripristinare: copia il `.bak.<timestamp>` sul file originale e rilancia `pnpm check`. La clonazione NON tocca mai il sorgente (`/home/user/becquer-quiz`).

## Pitfall noti

- **Niente mirror**: non cercare copie radice di TeacherPage/StudentQuiz/questions/reportPdf — in questa app non esistono.
- **`--name`**: solo minuscole/numeri/trattini (es. `quiz-marquez`). Il nome diventa la cartella in `/home/user/` e il nome del pacchetto.
- **Stringhe sostituite testualmente**: se il codice del sorgente cambia formato (es. "DOMANDA X/10"), lo script avvisa con ⚠️ ma non abortisce: controlla sempre l'output e `pnpm check`.
- **Deploy**: mai in produzione nella stessa risposta in cui hai scritto codice o creato la preview — prima checkpoint, poi conferma esplicita dell'utente.
- **Non clonare dentro il sorgente**: la destinazione è sempre `/home/user/<nome>`.
- **Audio**: i segmenti audio NON vengono rigenerati. Se l'utente vuole anche nuovi audio/testi di lettura, va fatto a parte (vedi skill video-claymation-didattico per audio narrato, o sostituire manualmente i file `.m4a` e `READING_SECTIONS`).
- **ZIP**: se `zip` non è installato l'export fallisce — installare con `sudo apt-get install -y zip` prima di lanciare lo script.
- **`.env`**: l'export ZIP esclude `.env` (segreti/API key) — nel pacchetto resta solo `.env.example`. Se cloni da una repo GitHub (senza `.env`), ricrea `.env` da `.env.example` + variabili della sandbox (`EASY_PEASY_API_KEY`) prima di avviare il dev server.

## Comandi rapidi

```bash
# Clonazione completa (con verifica + ZIP)
python /home/user/skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name <nuova-app> --questions <domande.json> [--title "Titolo"] [--source <path|url>] [--force]

# Solo cambio domande su un progetto già clonato (es. dopo modifiche manuali)
python /home/user/skills/quiz-interattivo-con-audio-sorgente/scripts/change_quiz_theme.py \
  <domande.json> --project /home/user/<nuova-app>

# Verifica
cd /home/user/<nuova-app> && pnpm check
```

## Manutenzione della skill

La skill esiste in DUE copie che vanno tenute **sincronizzate**:
1. `/home/user/skills/quiz-interattivo-con-audio-sorgente/` (copia attiva usata dall'assistente)
2. `/home/user/becquer-quiz/skills/quiz-interattivo-con-audio-sorgente/` (copia nel progetto sorgente)

Dopo OGNI modifica a SKILL.md, script o template: ricopiare i file aggiornati nella copia del progetto, es.:

```bash
cp -r /home/user/skills/quiz-interattivo-con-audio-sorgente/* /home/user/becquer-quiz/skills/quiz-interattivo-con-audio-sorgente/
```

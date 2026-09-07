---
name: quiz-adapter
description: Adatta l'app QUIZ INTERATTIVO CON AUDIO SORGENTE (Bécquer Quiz, /home/user/becquer-quiz) a nuovi set di domande. Usare quando l'utente richiede di cambiare le domande, il numero di domande, i titoli/PDF, o il tema del quiz su un progetto ESISTENTE. Per clonare l'intera app in una nuova cartella con domande diverse usare la skill quiz-interattivo-con-audio-sorgente (clone_audio_quiz_app.py). Comprende uno script Python che modifica automaticamente tutti i file coinvolti.
---

# Quiz Adapter Skill — QUIZ INTERATTIVO CON AUDIO SORGENTE (Bécquer Quiz)

## Overview

L'app **QUIZ INTERATTIVO CON AUDIO SORGENTE** (nome storico: Bécquer Quiz, `/home/user/becquer-quiz`) ha domande, titoli PDF e riferimenti a `/10` hardcodati in 5 file. Questa skill fornisce uno script che **automatizza tutte le sostituzioni** a partire da un file JSON.

> **Nota:** Questo skill è una versione adattata per il Bécquer Quiz a partire dall'originale per lo Shakespeare Quiz. Le differenze principali sono:
> - Il progetto si trova in `/home/user/becquer-quiz/` invece di `/home/user/shakespeare-quiz/`
> - Le domande usano `BECQUER_QUESTIONS` invece di `SHAKESPEARE_QUESTIONS`
> - Supporta il campo `sectionTitle` nelle domande
> - Supporta le reading pause (pause di lettura) dopo domande specifiche
> - **NON ci sono file mirror**: ogni file esiste in UNA sola copia

## Flusso consigliato: clonare (non modificare il sorgente)

**Per creare una NUOVA app con un set di domande diverso NON modificare il sorgente**: usare la skill **`quiz-interattivo-con-audio-sorgente`** (in `skills/quiz-interattivo-con-audio-sorgente/`), che clona l'intera app in `/home/user/<nome>` con lo script `clone_audio_quiz_app.py`:

```bash
python skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name quiz-lorca \
  --questions /percorso/domande.json \
  --title "Lorca Quiz Interattivo"
```

**Sorgente GitHub**: se il progetto è su GitHub, passare l'URL come sorgente (lo script clona la repo da solo in `/home/user/_repo_<nome>` e ci lavora sopra):

```bash
python skills/quiz-interattivo-con-audio-sorgente/scripts/clone_audio_quiz_app.py \
  --name quiz-lorca \
  --questions /percorso/domande.json \
  --title "Lorca Quiz Interattivo" \
  --source https://github.com/<utente>/<repo>
```

Lo script `change_quiz_theme.py` in questa cartella è usato automaticamente dal cloner (flag `--adapter` per indicarlo) oppure può essere lanciato manualmente su un progetto esistente.

## Utilizzo manuale (cambio domande su progetto esistente)

### 1. Prepara un file JSON

Usa `skills/quiz-adapter/templates/questions_example.json` come modello.

Campi obbligatori:
- `title` — intestazione stampata sui PDF (es. "CUESTIONARIO SOBRE FEDERICO GARCÍA LORCA")
- `questions` — array di oggetti con `number`, `question`, `options`, `correctAnswer`

Campi opzionali:
- `sectionTitle` — titolo di sezione (stringa, mostrato sopra la domanda, es. "1 · EL AUTOR")
- `report_pdf_filename` — prefisso per il report studenti (default `Report_Becquer`)
- `blank_pdf_filename` — prefisso per il questionario bianco (default `Cuestionario_Becquer`)

### 2. Esegui lo script

```bash
python skills/quiz-adapter/scripts/change_quiz_theme.py /percorso/del/tuo/questions.json [--project /percorso/progetto]
```

- `--project` di default è `/home/user/becquer-quiz` (il SORGENTE).
- Lo script crea backup automatici in `<progetto>/.quiz-backups/`
- Sostituisce le domande, aggiorna i validatori `.max(N)`, corregge `/N` in UI (TeacherPage, StudentQuiz), titoli e nomi file PDF
- Trasforma la griglia 2×2 delle opzioni nei PDF in un layout dinamico (supporta qualsiasi numero di opzioni)
- Preserva il campo `sectionTitle` se presente
- **Non tocca** i segmenti audio (`client/public/audio/*.m4a`), i testi `READING_SECTIONS` (pause di lettura), le regole CSS (data centrata), i pattern UI (tooltip, flex-wrap)

### 3. Verifica e deploy

```bash
cd /home/user/becquer-quiz
pnpm check    # controllo errori TypeScript
pnpm build    # build produzione
```

Poi deploy su produzione (checkpoint → preview → conferma → produzione).

## Cosa NON tocca lo script

- `client/src/lib/reportPdf.ts` righe che mostrano `student.score + '/N'` — il voto è sempre calcolato su base 10 indipendentemente dal numero di domande.
- `server/db.ts` — la funzione `getReportData` usa `questions.length` dinamicamente.
- Le reading pause — sono configurate nel server e non dipendono dal numero di domande.
- Audio, CSS, pattern UI — copiati dalla clonazione, NON modificati.

## Rollback

I backup sono salvati in `.quiz-backups/`. Per ripristinare:

```bash
cp /home/user/becquer-quiz/.quiz-backups/<file>.bak.<timestamp> /home/user/becquer-quiz/server/questions.ts
```

Ripeti per ogni file modificato, poi esegui `pnpm check` e `pnpm build`.

## Limitazioni note

- Lo script usa `re.sub` per sostituire `.min(1).max(N)` — funziona solo se la sintassi esatta è invariata.
- Le sostituzioni sono testuali; se il codice cambiasse formato, lo script avvisa con ⚠️ ma non abortisce: controllare sempre l'output e `pnpm check`.
- Le reading pause (dopo Q2, Q4, Q5, Q7) sono hardcodate nel server — se cambi il numero di domande, il flusso pause resta invariato (le pause sono legate ai segmenti audio, non al numero di domande).

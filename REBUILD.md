# 🔧 REBUILD — Ricostruzione identica dell'app (guida per IA e umani)

Questo documento spiega come **ricostruire esattamente la stessa app** partendo da una repository GitHub. È scritto per un agente IA che può eseguire i comandi, ma è leggibile anche da un umano.

---

## Cos'è questa app

**QUIZ INTERATTIVO CON AUDIO SORGENTE** (nome storico: **Bécquer Quiz Interattivo**) è un'app full-stack per quiz in classe con **segmenti audio e pause di lettura**: il docente crea una classe, gli studenti si uniscono con un codice a 4 cifre, ascoltano i paragrafi audio e rispondono in tempo reale a domande a scelta multipla; il docente vede punteggi in diretta e scarica report PDF.

- **Frontend** — Vite + React + TypeScript + Tailwind CSS v4 (cartella `client/`)
- **Backend** — Express + tRPC + Drizzle ORM (cartella `server/`)
- **Database** — PostgreSQL (schema in `drizzle/schema.ts`; client in `server/db.ts`)
- **Domande** — `server/questions.ts` (array `BECQUER_QUESTIONS`); **NON esiste una copia mirror alla radice**: il file canonico è uno solo
- **PDF** — generati lato client con `jspdf` (`client/src/lib/reportPdf.ts`)
- **Cornice dinamica** per embed su Blogger — cartella `cornice-dinamica/`
- **Accessibilità** completa (DSA/BES/ipovisione) — v. `ACCESSIBILITA.md`

Il server Express serve anche il client compilato (`dist/public/`) e i font (`/fonts/*`) → **deploy single-process: una sola porta**.

---

## Requisiti

- **Node.js 20+** (consigliato 22)
- **pnpm 10** (package manager; abilita con `corepack enable pnpm`)
- **PostgreSQL** raggiungibile via `DATABASE_URL` (Render PostgreSQL, Neon, Supabase, oppure il `docker compose` incluso in `deploy/`)

> ⚠️ L'app **richiede un database PostgreSQL**: senza `DATABASE_URL` il server parte ma le query classe/studente/risposte falliscono (`Database not available`).

---

## Passi di ricostruzione

### 1. Clona la repository

```bash
git clone https://github.com/TUO-UTENTE/TUA-REPO.git
cd TUA-REPO
```

### 2. Installa le dipendenze

```bash
pnpm install
```

### 3. Configura le variabili d'ambiente

Crea un file `.env` alla radice (vedi `.env.example`):

```
DATABASE_URL=postgres://...                   # OBBLIGATORIO — connection string PostgreSQL
BETTER_AUTH_SECRET=...                        # OBBLIGATORIO — genera con: openssl rand -base64 32
NODE_ENV=production                           # impostato anche dallo start command
PORT=3000                                     # opzionale (default 3000)
```

Variabili **opzionali**: `BETTER_AUTH_URL` (solo se usi OAuth; in produzione è il dominio pubblico dell'app).

> 🔒 Il file `.env` **non è incluso** nel pacchetto/repo (resta solo `.env.example`). Crearlo sempre dopo un clone.

### 4. Crea le tabelle del database

Con un PostgreSQL raggiungibile da dove esegui il comando:

```bash
pnpm db:push
```

(equivale a `drizzle-kit generate && drizzle-kit migrate`; richiede `DATABASE_URL` nel `.env` o nell'ambiente.)

In alternativa, per un ambiente di solo test locale con Postgres in Docker:

```bash
docker compose -f deploy/docker-compose.yml up -d db   # avvia solo PostgreSQL (porta 5432)
```

### 5. Verifica la compilazione TypeScript

```bash
pnpm check
```

### 6. Build di produzione

```bash
pnpm build
```

Produce:
- `dist/public/` → client compilato (Vite, include `fonts/` e `audio/` da `client/public/`)
- `dist/index.js` → server compilato (esbuild di `server/_core/index.ts`)

### 7. Avvio

```bash
pnpm start
```

(equivale a `NODE_ENV=production node dist/index.js`). L'app è servita su `http://localhost:3000` (o sulla porta in `PORT`).

---

## Struttura dei file chiave

| Ruolo | Percorso |
|---|---|
| Domande del quiz | `server/questions.ts` |
| Logica server (grading, sessioni, classi, pause lettura) | `server/routers.ts` + `server/db.ts` |
| Segmenti audio delle pause | `client/public/audio/segment_1.m4a` … `segment_5.m4a` |
| Testi/titoli pause di lettura | `client/src/pages/TeacherPage.tsx` → `READING_SECTIONS` |
| Trigger pause (`{2:2, 4:3, 5:4, 7:5}`) | `server/db.ts` → `READING_PAUSE_TRIGGERS` |
| UI docente | `client/src/pages/TeacherPage.tsx` |
| UI studente | `client/src/pages/StudentQuiz.tsx` |
| Report PDF + questionario in bianco | `client/src/lib/reportPdf.ts` |
| Barra accessibilità (5 moduli) | `client/src/components/AccessibilityToolbar.tsx` + `client/src/contexts/AccessibilityContext.tsx` |
| Lettura ad alta voce (TTS) | `client/src/hooks/useReadAloud.ts` |
| Embed altezza dinamica (iframe) | `client/src/lib/heightSync.ts` |
| Font OpenDyslexic (TTF + WOFF2) | `client/public/fonts/` |
| Cornice dinamica (embed Blogger) | `cornice-dinamica/` |
| Documento accessibilità | `ACCESSIBILITA.md` |

---

## Verifica che l'app sia identica

- `pnpm check` termina **senza errori**.
- `pnpm build` termina **senza errori**.
- Avviando `pnpm start`, la Home mostra «QUIZ INTERATTIVO»; il docente può creare una classe, lo studente entra con il codice, le pause di lettura compaiono dopo le domande 2, 4, 5 e 7, e i PDF (report per studente + questionario in bianco) si generano a **una pagina per alunno** con font OpenDyslexic.

Per **cambiare le domande** (contenuto, audio, numero o tipologia) → vedi **ADATTARE.md**.
Per **pubblicare su Render** → vedi **RENDER.md**.
Per le **misure di accessibilità riusabili** → vedi **ACCESSIBILITA.md**.

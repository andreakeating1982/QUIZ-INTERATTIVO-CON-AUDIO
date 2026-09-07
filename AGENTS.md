# AGENTS — Guida per agenti IA

Questa repository contiene **QUIZ INTERATTIVO CON AUDIO SORGENTE** (nome storico: Bécquer Quiz Interattivo), un'app full-stack per quiz in classe con segmenti audio, pause di lettura e report PDF accessibili.

## Da dove partire (leggi i file giusti per il tuo compito)

| Compito | File da leggere |
|---|---|
| Ricostruire l'app identica da zero | `REBUILD.md` |
| Cambiare le domande (contenuto / audio / numero / tipologia) | `ADATTARE.md` |
| Pubblicare su Render | `RENDER.md` (+ `render.yaml`, `Dockerfile`) |
| Misure di accessibilità riusabili | `ACCESSIBILITA.md` |
| Embed su Blogger (cornice dinamica) | `cornice-dinamica/README.md` |
| Clonare l'app in una nuova con set di domande diverso | `skills/quiz-interattivo-con-audio-sorgente/SKILL.md` |
| Manutenzione del sorgente | `skills/becquer-quiz/SKILL.md` |

## Fatti essenziali

- **Package manager**: `pnpm` (non npm/yarn).
- **Stack**: Vite + React + TypeScript + Tailwind CSS v4 + tRPC + Drizzle ORM (PostgreSQL) + jsPDF.
- **Comandi**: `pnpm check` (tipi), `pnpm build` (produzione), `pnpm start` (avvio), `pnpm db:push` (tabelle DB).
- **Domande**: `server/questions.ts` (array `BECQUER_QUESTIONS`). **È l'UNICO file canonico — NON esistono copie mirror.** Non serve sincronizzare nulla: modificare solo `server/questions.ts`.
- **Audio delle pause**: `client/public/audio/segment_1.m4a` … `segment_5.m4a` + `READING_SECTIONS` in `client/src/pages/TeacherPage.tsx`.
- **Trigger pause**: `READING_PAUSE_TRIGGERS` in `server/db.ts` (`{ 2: 2, 4: 3, 5: 4, 7: 5 }`).
- **Variabili obbligatorie**: `DATABASE_URL`, `BETTER_AUTH_SECRET` (v. `.env.example`). Il `.env` non è mai incluso nel pacchetto.
- **Deploy**: Render via `render.yaml` Blueprint (Docker multi-stage) oppure Docker/Railway. In Easy-Peasy: prima preview, poi produzione su conferma esplicita.

## Regole

1. Modifica sempre i file **canonici** (`server/`, `client/`); non creare né aggiornare copie mirror delle domande.
2. Esegui `pnpm check` prima di concludere qualsiasi modifica.
3. Non fare deploy in produzione nella stessa risposta in cui hai scritto codice: prima preview, poi conferma esplicita dell'utente.
4. L'accessibilità (font OpenDyslexic, barra 5 moduli, TTS, alto contrasto, righello, ARIA, CORS font, PDF accessibili) è una parte **obbligatoria** dell'app: non rimuoverla quando adatti le domande (v. `ACCESSIBILITA.md`).
5. Le skill in `skills/` sono le copie che viaggiano con la repo: quando aggiorni `/home/user/skills/<nome>`, risincronizza anche la copia in `skills/<nome>` (e viceversa).
6. I PDF (report e questionario in bianco) devono restare a **una pagina per alunno**, senza riepilogo numerico RISPOSTE CORRETTE/INCORRETTE, con voto su base 10 fissa — requisiti espliciti del docente (2026-09-07). Non ripristinare la paginazione multi-pagina né il riepilogo.

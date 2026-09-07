# 🚀 RENDER — Trasferire l'app da Easy-Peasy AI a Render (via GitHub)

Questa guida spiega come pubblicare l'app su **Render** usando una repository **GitHub**. Il pacchetto include già un file `render.yaml` (Blueprint) e un `Dockerfile` multi-stage che automatizzano quasi tutto.

---

## Prerequisiti

1. Una **repository GitHub** con il contenuto di questo pacchetto (tutta la cartella, non solo i file sorgente: servono `render.yaml`, `Dockerfile`, `deploy/docker-entrypoint.sh`, `drizzle/`, `client/public/`).
2. Un account **Render** (render.com) collegato a GitHub.
3. Nessun database da creare a mano se usi il Blueprint: Render crea da solo il **PostgreSQL gratuito** e collega `DATABASE_URL`.

> 🔒 Prima di caricare su GitHub: il file `.env` **non va caricato** (è escluso anche dallo ZIP). Sulla repo resta solo `.env.example`.

---

## Metodo A — Blueprint (consigliato, automatico)

1. Carica il contenuto del pacchetto su GitHub e fai `git push`.
2. Su Render: **New → Blueprint**.
3. Seleziona la repository. Render legge `render.yaml` e crea da solo:
   - un **database PostgreSQL gratuito** (`becquer-quiz-db`, regione Frankfurt);
   - un **Web Service Docker** (`becquer-quiz`) che builda con il `Dockerfile` in root;
   - collega `DATABASE_URL` e genera `BETTER_AUTH_SECRET` automaticamente.
4. Clicca **Apply** e attendi il primo deploy (3–6 minuti: il Dockerfile compila client+server).

Il `render.yaml` incluso imposta:
- `env: docker` + `dockerfilePath: ./Dockerfile` (multi-stage: `pnpm install` → `pnpm build` → runtime con `pnpm install --prod` + `drizzle-kit`);
- `healthCheckPath: /`;
- `NODE_ENV=production`, `BETTER_AUTH_SECRET` (auto-generato), `DATABASE_URL` (dal database creato);
- entrypoint che esegue **automaticamente le migrazioni del database** a ogni avvio (`drizzle-kit push`) prima di lanciare `node dist/index.js`.

---

## Metodo B — Web Service manuale (senza Blueprint)

1. Crea prima un database: Render → **New → PostgreSQL** (free). Copia la **Internal Database URL**.
2. Render → **New → Web Service** → collega la repo.
3. Imposta:
   - **Runtime / Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
4. Aggiungi le variabili d'ambiente (sotto).
5. Crea e distribuisci. Le migrazioni partono da sole all'avvio del container.

---

## Variabili d'ambiente (obbligatorie)

| Variabile | Valore | Note |
|---|---|---|
| `DATABASE_URL` | `postgres://...` | connection string del database PostgreSQL (nel Blueprint è collegata in automatico) |
| `BETTER_AUTH_SECRET` | stringa casuale | nel Blueprint è auto-generata; a mano usa `openssl rand -base64 32` |
| `NODE_ENV` | `production` | impostato automaticamente da `render.yaml`/Dockerfile |

Variabili **opzionali**: `BETTER_AUTH_URL` (dominio pubblico, es. `https://becquer-quiz.onrender.com`) e `PORT` (Render imposta la propria porta; il Dockerfile espone la 8080 e l'app ascolta su `process.env.PORT`).

---

## Verifica post-deploy

1. Apri l'URL del servizio (`https://<nome>.onrender.com`): deve comparire la Home del quiz.
2. Vai su `/docente`, crea una classe con password e verifica che compaia il codice a 4 cifre (significa che il database funziona e le tabelle sono state create).
3. Entra come studente con il codice, rispondi a una domanda e controlla il punteggio in tempo reale.
4. Scarica il **Report PDF** e il **Questionario in bianco** (una pagina per alunno, font OpenDyslexic).

---

## Collegare il blog Blogger (cornice dinamica)

Dopo il deploy, aggiorna l'URL dell'app nella cornice dinamica e incollala su Blogger (istruzioni complete in `cornice-dinamica/README.md`):

- Versione consigliata: `cornice-dinamica/embed-becquer-quiz-dedicata.html` (⭐ v3 impermeabile + anti-loop);
- alternativa leggera: `embed-becquer-quiz-lite.html` (cambiare la riga `APP_URL` col tuo dominio `.onrender.com`).

---

## Troubleshooting

| Problema | Causa probabile | Soluzione |
|---|---|---|
| Build fallisce su `pnpm install` | lockfile/patch non allineati | il Dockerfile usa `--no-frozen-lockfile`; assicurarsi che `patches/` sia nel repo |
| L'app risponde ma le classi non si creano | tabelle DB mancanti | l'entrypoint fa `drizzle-kit push` all'avvio: controllare nei log che sia passato; verificare `DATABASE_URL` |
| `BETTER_AUTH_SECRET` mancante | variabile non impostata | generarla con `openssl rand -base64 32` e aggiungerla in **Environment** |
| Font non caricati nella cornice Blogger | CORS | il middleware `/fonts` di `server/_core/index.ts` aggiunge `Access-Control-Allow-Origin: *`; verificare che l'app sia raggiungibile |

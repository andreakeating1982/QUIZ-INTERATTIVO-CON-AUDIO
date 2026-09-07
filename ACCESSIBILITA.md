# ♿ ACCESSIBILITÀ — QUIZ INTERATTIVO CON AUDIO SORGENTE

Misure di accessibilità e inclusività (DSA / BES / ipovisione / screen reader)
portate dall'app di riferimento **PAROLE-CHIAVE-INTERATTIVE**
(github.com/andreakeating1982/PAROLE-CHIAVE-INTERATTIVE) e adattate alla
palette plum/gold dell'app QUIZ INTERATTIVO CON AUDIO SORGENTE (Bécquer).

---

## 0. Sintesi

| Misura | File chiave |
|---|---|
| Font **OpenDyslexic** (UI + PDF) | `client/public/fonts/` + `@font-face` in `client/src/index.css` |
| **Barra accessibilità** 5 moduli (FONT / INTERLINEA / RIGHELLO / MODALITÀ / ASCOLTO) | `client/src/components/AccessibilityToolbar.tsx` + `client/src/contexts/AccessibilityContext.tsx` |
| **Lettura ad alta voce (TTS)** italiano | `client/src/hooks/useReadAloud.ts` |
| **Screen reader** (ARIA) | `AccessibilityToolbar.tsx` (aria-label, role, sr-only, live region) |
| **Focus visibile** | classi `focus-visible` |
| **`prefers-reduced-motion`** | `client/src/index.css` |
| **Alto contrasto** | classe `lf-hc` su `<html>` + CSS |
| **Banda di lettura (righello)** | classe `lf-ruler` + `AccessibilityContext` |
| **Altezza dinamica embed** | `client/src/lib/heightSync.ts` + classi `lf-embedded` |
| **CORS font** | middleware `/fonts` in `server/_core/index.ts` |
| **PDF accessibili** (report + questionario in bianco) | `client/src/lib/reportPdf.ts` |

---

## 1. Font OpenDyslexic

- File auto-ospitati in `client/public/fonts/`: TTF/OTF per la UI + WOFF2
  (`OpenDyslexic-Regular-v2.woff2`, `OpenDyslexic-Bold-v2.woff2`) per la
  cornice dinamica Blogger, tutti serviti da `/fonts/*`.
- `@font-face` in `client/src/index.css`; `font-display: swap`.
- Applicato a tutta la UI con fallback su `Cambria, Georgia, "Times New Roman", serif`.
- **Incorporato anche nei PDF** via `jsPDF.addFont` (base64) in `reportPdf.ts`,
  con fallback automatico su `times` se il fetch del font fallisce.

## 2. Barra di accessibilità (5 moduli)

Fissa su tutte le pagine (`App.tsx` → `AccessibilityProvider` + `AccessibilityToolbar`):

- **FONT** — A− / A+ (scala 80%–160%, variabile `--lf-scale`).
- **INTERLINEA** — cicla 1,5 → 1,65 → 1,9 → 2,2 → 2,6 (variabile `--lf-lh`).
- **RIGHELLO** — banda di lettura che segue il puntatore (`lf-ruler`).
- **MODALITÀ** — Normale / Alto contrasto (`lf-hc`).
- **ASCOLTO** — avvia/interrompe la lettura ad alta voce.

Impostazioni salvate in `localStorage` (chiave `sq_access`) e riapplicate all'avvio.

## 3. Lettura ad alta voce (TTS)

`useReadAloud.ts` usa l'API Web Speech (`speechSynthesis`):

- seleziona la migliore voce italiana disponibile;
- legge tutta la pagina (incluse le opzioni di risposta dei `<button>`);
- converte le parole MAIUSCOLE in minuscolo (lettura naturale);
- legge le date in forma naturale («01/09/2026» → «primo settembre duemilaventisei»);
- esclude toolbar, canvas, svg e script.

## 4. Screen reader (ARIA)

Nella barra di accessibilità:

- icone `aria-hidden="true"` (decorative);
- capsule `role="group"` con `aria-label` descrittivo;
- pulsante ASCOLTO con nome accessibile «Ascolto» + `aria-pressed`;
- descrizione introduttiva `sr-only`;
- live region `role="status"` all'avvio.

## 5. Focus, movimento, contrasto

- `:focus-visible` con outline 3px ad alto contrasto.
- `prefers-reduced-motion: reduce` disattiva animazioni e transizioni.
- `::selection` ad alto contrasto.
- `html.lf-hc` attiva il filtro alto contrasto + fondo bianco.
- `html.lf-ruler` mostra la banda di lettura.

## 6. Embed (altezza dinamica) + CORS font

- `heightSync.ts` inizializzato in `main.tsx`: quando l'app è in iframe invia
  `labvisivo:height` (protocollo cornice dinamica), risponde al ping
  `labvisivo:ping` (rispecchiando il token `?cornice=`) e abilita `html.lf-embedded`.
- `html.lf-embedded` disattiva i `min-h-screen`/`100vh` (evita il loop di crescita).
- Middleware `/fonts` in `server/_core/index.ts` aggiunge
  `Access-Control-Allow-Origin: *` per il caricamento cross-origin del font.
- **Cornice dinamica per Blogger**: cartella `cornice-dinamica/` con
  `embed-becquer-quiz-dedicata.html` (⭐ consigliata: v3 impermeabile +
  anti-loop, Schermo intero/Ricarica, stato online/errore con Riprova),
  versione `-lite`, versione autosufficiente e `test-impermeabile.html`;
  vedi `cornice-dinamica/README.md` per le istruzioni complete.

## 7. PDF accessibili

`reportPdf.ts` (report per studente + questionario in bianco) — **stato 2026-09-07**:

- **UNA pagina A4 per alunno** (report) e **UNA pagina A4** per il questionario
  in bianco: niente più paginazione automatica multi-pagina né mini-intestazioni
  di continuazione. Se il contenuto non entra, si riducono **font e interlinea**
  (`FONT_CANDIDATES` 14→8 pt × `FACTOR_CANDIDATES` 1.5→1.0, provati in ordine
  con `pickReportStyle`/`pickBlankStyle`, misura = paint con flag `paint=false`).
- **Font OpenDyslexic** incorporato via `jsPDF.addFont` (base64, fallback `times`).
- **Nessun testo fuori margine**: ogni opzione composta su **righe proprie** con
  wrap a parole (`splitTextToSize`); nel questionario in bianco le opzioni sono
  **indentate dopo la casella** (`qX = M + boxSide + 3`, larghezza `qMaxW`) così
  non si sovrappongono mai ai quadratini blu della risposta.
- **Simboli vettoriali ✔ (verde) / ✘ (rossa)** disegnati con `doc.lines`/`doc.line`
  subito dopo la lettera dell'opzione scelta, opzione esatta in verde → il
  significato NON dipende dal solo colore; **legenda** in fondo.
- **Nessun riepilogo numerico RISPOSTE CORRETTE / INCORRETTE**: rimosso su
  richiesta del docente (2026-09-07) per recuperare spazio verticale.
- **Legenda + box PUNTEGGIO sempre INSIEME** in fondo alla stessa pagina.
- **Box PUNTEGGIO** su un'unica linea centrata, cornice **blu** con margini
  stretti (`PUNTEGGIO: X/10 — ogni risposta corretta = 1 pt — massimo 10/10`),
  mai spezzato; dimensione del font adattiva per restare su una riga.
- **Voto su BASE 10 FISSA**: `X/10`, `massimo 10/10` (NON `questions.length`).

---

## 8. Riusare queste misure su un'altra app (via repository GitHub)

Tutte le misure descritte sopra sono **riusabili**: si possono copiare su un'altra
app simile (es. un clone generato con `ADATTARE.md` o un'app nuova con lo stesso
stack Vite + React + Tailwind) semplicemente portando questi file e adattando
tema/colori:

| Misura | File da copiare | Da adattare dopo la copia |
|---|---|---|
| Font OpenDyslexic (UI + PDF) | `client/public/fonts/`, blocco `@font-face` da `client/src/index.css` | nessuno (file già auto-ospitati) |
| Barra accessibilità 5 moduli | `client/src/components/AccessibilityToolbar.tsx` + `client/src/contexts/AccessibilityContext.tsx` | chiave `localStorage` (`sq_access`), variabili CSS (`--lf-scale`/`--lf-lh`), classi `lf-ruler`/`lf-hc` |
| TTS italiano | `client/src/hooks/useReadAloud.ts` | — |
| Altezza dinamica embed | `client/src/lib/heightSync.ts` + init in `main.tsx` + classi `lf-embedded` in CSS | token `?cornice=` |
| CORS font | middleware `/fonts` in `server/_core/index.ts` | — |
| Cornice dinamica Blogger | cartella `cornice-dinamica/` | URL dell'app (`APP_URL`) |
| PDF accessibili | `client/src/lib/reportPdf.ts` (funzioni `build*PdfDoc` riusabili nei test) | palette, titoli, nomi file |

**Regola:** l'accessibilità è parte **obbligatoria** dell'app: quando si clona o
si adatta il set di domande (v. `ADATTARE.md`) non rimuovere mai questi file né
le regole globali in `client/src/index.css`.

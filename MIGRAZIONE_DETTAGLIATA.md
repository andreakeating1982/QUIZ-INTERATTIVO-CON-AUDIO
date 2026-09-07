# 📋 Migrazione da Shakespeare Quiz a Bécquer Quiz — Resoconto Dettagliato

## 1. Panoramica Generale

Questo documento descrive il processo completo di migrazione dall'applicazione **Shakespeare Quiz Interattivo** (quiz su William Shakespeare) all'applicazione **Bécquer Quiz Interattivo** (quiz su Gustavo Adolfo Bécquer, poeta romantico spagnolo). La migrazione è stata eseguita da un agente AI autonomo (MARKY di Easy-Peasy.AI) su richiesta dell'utente, attraverso una serie di conversazioni e iterazioni.

Il progetto di partenza era il repository GitHub [williamshakespeare-quizinterattivo](https://github.com/andreakeating1982/williamshakespeare-quizinterattivo), un'applicazione web full-stack che permette a un insegnante di gestire un quiz interattivo in classe, con gli studenti che rispondono in tempo reale dai loro dispositivi. L'applicazione finale (Bécquer Quiz) mantiene la stessa architettura ma con contenuti, funzionalità e design specifici per lo studio del poeta spagnolo.

**URL di produzione:** [https://becquer-quiz.easy-peasy.site](https://becquer-quiz.easy-peasy.site)
**URL insegnante:** [https://becquer-quiz.easy-peasy.site/docente](https://becquer-quiz.easy-peasy.site/docente)
**Codice embed per Blogger:** Iframe con `src="https://becquer-quiz.easy-peasy.site"` e altezza dinamica via `postMessage`.

---

## 2. Tecnologia e Stack

L'applicazione utilizza il seguente stack tecnologico:

| Componente | Tecnologia |
|---|---|
| **Frontend** | React 19 + TypeScript + Tailwind CSS 4 + Vite |
| **Backend** | Express 4 + tRPC 11 |
| **Database** | PostgreSQL (via Drizzle ORM) |
| **Autenticazione** | Better Auth |
| **Pacchettizzazione** | pnpm |
| **Deploy** | Docker + Render (o Railway, Docker Compose) |
| **Librerie aggiuntive** | jsPDF (report PDF), Lucide React (icone), Framer Motion (animazioni) |

L'architettura è di tipo **monorepo** con due aree principali:
- `client/` — App React con pagine per insegnante e studente
- `server/` — Backend Express con procedure tRPC, database e logica di business
- `drizzle/` — Schema del database e migrazioni
- `shared/` — Tipi e costanti condivise

---

## 3. Fasi della Migrazione

### Fase 1: Inizializzazione del Progetto

| Azione | Dettaglio |
|--------|-----------|
| Scaffold iniziale | `web-db-user` (Vite + React + TypeScript + TailwindCSS + Drizzle + tRPC) |
| Nome progetto | `becquer-quiz` |
| Cartella | `/home/user/becquer-quiz/` |
| Repository di riferimento | [williamshakespeare-quizinterattivo](https://github.com/andreakeating1982/williamshakespeare-quizinterattivo) |

Lo scaffold `web-db-user` fornisce già:
- Server Express con tRPC configurato
- Database PostgreSQL con Drizzle ORM
- Autenticazione Better Auth
- Frontend React con routing, componenti shadcn/ui e Tailwind CSS

### Fase 2: Sostituzione delle Domande (Da Shakespeare a Bécquer)

Il cuore della migrazione è stato la sostituzione delle domande. Il file `server/questions.ts` è stato completamente riscritto.

**Prima (Shakespeare):** 10 domande in inglese su William Shakespeare (nascita, opere, Romeo e Giulietta, ecc.)

**Dopo (Bécquer):** 10 domande in spagnolo su Gustavo Adolfo Bécquer, suddivise in 5 sezioni tematiche:

| N. | Sezione | Domanda |
|:--:|---------|---------|
| 1 | **EL AUTOR** | ¿Dónde nació Gustavo Adolfo Bécquer? |
| 2 | **EL AUTOR** | ¿Qué empleo obtuvo Bécquer en 1866? |
| 3 | **LA QUINTAESENCIA DEL ESCRITOR ROMANTICO** | ¿Por qué se considera a Bécquer un romántico tardío? |
| 4 | **LA QUINTAESENCIA DEL ESCRITOR ROMANTICO** | ¿Cuáles son las dos producciones más destacadas de Bécquer? |
| 5 | **RIMAS (DESDE 1858)** | ¿Qué ocurrió con el manuscrito original de las RIMAS? |
| 6 | **3.1. ESTRUCTURA** | ¿En cuántos bloques temáticos se dividen las 79 poesías de las Rimas? |
| 7 | **3.1. ESTRUCTURA** | ¿Cuál es el tema central del primer bloque (Rimas I-XI)? |
| 8 | **3.2. LENGUAJE Y ESTILO** | ¿Cuál es el metro preferido de Bécquer en sus RIMAS? |
| 9 | **3.2. LENGUAJE Y ESTILO** | ¿En qué tradición poética se inspiró Bécquer? |
| 10 | **3.2. LENGUAJE Y ESTILO** | ¿Cómo describió Dámaso Alonso el verso becqueriano? |

**Modifiche al tipo `BecquerQuestion`:**
```typescript
export type BecquerQuestion = {
  number: number;
  sectionTitle?: string;  // NUOVO: titolo di sezione
  question: string;
  options: string[];
  correctAnswer: string;
};
```

Il campo `sectionTitle` è stato aggiunto per mostrare i titoli delle sezioni tematiche sopra le domande corrispondenti (visibili sia per l'insegnante che per lo studente).

### Fase 3: Titoli di Sezione sopra le Domande

Su richiesta dell'utente (con riferimento al PDF `CuestionarioBecquer_con_soluciones.pdf`), sono stati aggiunti i titoli di sezione sopra le domande corrispondenti.

**File modificati:**
- `server/questions.ts` — Aggiunto campo `sectionTitle` a ogni domanda
- `server/routers.ts` — Aggiornata procedura `questions.list` per includere `sectionTitle` nella risposta
- `client/src/pages/TeacherPage.tsx` — Mostra il badge del titolo di sezione sopra la domanda
- `client/src/pages/StudentQuiz.tsx` — Mostra il badge del titolo di sezione sopra la domanda
- `client/src/pages/StudentQuiz.tsx` — Aggiunto campo `sectionTitle?: string` al tipo `Question` locale

**Design dei titoli:** Badge viola chiaro (`text-plum/70 tracking-wider uppercase`) sopra il numero della domanda, in stile "tag" coerente con l'estetica dell'app.

### Fase 4: Aggiunta delle Reading Pause (Pause di Lettura)

Una funzionalità completamente nuova introdotta su richiesta dell'utente: schermate di pausa obbligatorie dopo domande specifiche, dove insegnante e studente vedono un messaggio di lettura.

**Trigger:** Dopo le domande 2, 4, 5 e 7.

**Comportamento:**
1. Quando l'insegnante clicca "Avanti" dopo la domanda 2 (4, 5, 7), invece di andare alla domanda successiva, si attiva una pausa di lettura
2. Sia l'insegnante che lo studente vedono la stessa schermata con il testo:
   > *"Leggi tutto il prossimo paragrafo prima di procedere con le domande successive"*
3. Solo l'insegnante ha il pulsante "CONTINUA" per procedere
4. Quando l'insegnante clicca CONTINUA, la pausa si conclude e tutti avanzano alla domanda successiva

**File modificati:**
- `drizzle/schema.ts` — Aggiunto campo `readingPauseStage` (integer) nella tabella `classes`
- `drizzle/0002_grey_black_bolt.sql` — Nuova migrazione per il campo `readingPauseStage`
- `server/db.ts` — Aggiunte funzioni `nextQuestion`, `prevQuestion`, `advanceFromReading` con logica delle pause
- `server/routers.ts` — Aggiunte procedure tRPC `nextQuestion`, `prevQuestion`, `advanceFromReading`
- `client/src/pages/TeacherPage.tsx` — Schermata di pausa lettura con pulsante CONTINUA
- `client/src/pages/StudentQuiz.tsx` — Schermata di pausa lettura (solo visualizzazione)

**Logica delle pause nel server (`db.ts`):**
```typescript
// Dopo aver avanzato alla domanda successiva, controlla se serve una pausa
const pauseStages = [2, 4, 5, 7];
if (pauseStages.includes(newQuestion) && readingPauseStage === 0) {
  // Attiva la pausa: imposta readingPauseStage = newQuestion
  await db.update(classes).set({ readingPauseStage: newQuestion }).where(eq(classes.id, classId));
} else {
  // La pausa è già stata superata o non serve
}
```

**Risoluzione bug:** Durante l'implementazione, è stato necessario installare `jspdf` come dipendenza esplicita (`pnpm add jspdf`) per risolvere un errore 500. Inoltre, il tipo `Question` lato client è stato aggiornato per supportare `optional chaining`.

### Fase 5: UI e Design — Correzione del Pulsante CONTINUA

**Problema:** Il pulsante CONTINUA arancione appariva due volte nella schermata di pausa lettura lato insegnante: una nel pulsante di navigazione destra (che diventava CONTINUA invece della freccia) e una nella card della pausa.

**Soluzione:** Il pulsante di navigazione destra è stato riportato a una semplice freccia `<ChevronRight />`, mentre l'unico pulsante CONTINUA è rimasto all'interno della card della pausa di lettura.

**Ulteriore richiesta:** L'utente ha chiesto che il pulsante CONTINUA usasse lo stesso colore marrone/primary del resto dell'app, non l'arancione `amber-600`. Modifica:
```tsx
// PRIMA: bg-amber-600 hover:bg-amber-700 text-white
// DOPO: bg-primary hover:bg-primary/90 text-primary-foreground
```

### Fase 6: Route e Navigazione

Le route dell'applicazione sono state configurate in `client/src/App.tsx`:

| Route | Pagina | Descrizione |
|---|---|---|
| `/` | `Home.tsx` | Pagina principale con login per docente e studente |
| `/docente` | `TeacherPage.tsx` | Pannello insegnante (creazione classi, gestione quiz) |
| `/studente` | `StudentQuiz.tsx` | Interfaccia studente (risposta alle domande) |
| `*` | `NotFound.tsx` | Pagina 404 |

### Fase 7: Database e Schema

**Tabella `classes`:**
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | varchar (PK) | Identificativo univoco |
| `name` | varchar | Nome della classe |
| `year` | varchar | Anno scolastico |
| `date` | varchar | Data del quiz |
| `studentCount` | int | Numero studenti |
| `password` | varchar | Password per riapertura |
| `code` | varchar(4) | Codice di accesso |
| `sessionStarted` | boolean | Flag sessione avviata |
| `currentQuestion` | int | Domanda corrente (1-10) |
| `sessionClosed` | boolean | Flag sessione chiusa |
| `readingPauseStage` | int | Fase di pausa lettura (0 = nessuna) |
| `createdAt` | timestamp | Data creazione |

**Tabella `students`:**
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | varchar (PK) | Identificativo univoco |
| `classId` | varchar (FK) | Riferimento alla classe |
| `name` | varchar | Nome studente |
| `score` | int | Punteggio |
| `answers` | jsonb | Risposte (array di oggetti) |
| `joinedAt` | timestamp | Data iscrizione |

### Fase 8: Report PDF

La funzionalità di generazione report PDF è stata mantenuta dall'app Shakespeare, utilizzando `jsPDF` con layout dinamico per le opzioni (non più limitato a una griglia 2×2). I report includono:
- **Report dello studente** — Riepilogo con risposte corrette/errate e punteggio
- **Questionario in bianco** — Versione stampabile del quiz senza risposte

### Fase 9: Deploy

L'applicazione è stata deployata in due ambienti:

1. **Preview (sandbox):** `https://3000-i45721uxjlea0pkvdrmda.sandbox.easy-peasy.ai/` — Per test e verifica
2. **Produzione (permanente):** `https://becquer-quiz.easy-peasy.site` — URL pubblico definitivo

Il deploy è stato effettuato su Google Cloud Run tramite il sistema Easy-Peasy.AI, che corrisponde a un'app Dockerizzata con PostgreSQL.

### Fase 10: Integrazione Blogger

Per incorporare il quiz in un blog Blogger, è stato fornito un codice iframe con altezza dinamica:

```html
<iframe src="https://becquer-quiz.easy-peasy.site" 
        style="width:1px;min-width:100%;height:700px;border:none;border-radius:12px;"
        id="becquer-quiz-iframe"
        onload="this.style.height=(this.contentWindow.document.documentElement.scrollHeight+200)+'px'">
</iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'resize') {
    var iframe = document.getElementById('becquer-quiz-iframe');
    if (iframe) iframe.style.height = (e.data.height + 200) + 'px';
  }
});
</script>
```

---

## 4. Differenze Chiave tra Shakespeare Quiz e Bécquer Quiz

| Caratteristica | Shakespeare Quiz | Bécquer Quiz |
|---|---|---|
| **Lingua** | Inglese | Spagnolo |
| **Tema** | William Shakespeare | Gustavo Adolfo Bécquer |
| **Numero domande** | 10 | 10 |
| **Sezioni tematiche** | ❌ No | ✅ Sì (5 sezioni con titoli) |
| **Pause di lettura** | ❌ No | ✅ Sì (dopo Q2, Q4, Q5, Q7) |
| **Layout opzioni PDF** | 2×2 fisso | Dinamico (qualsiasi numero) |
| **Colore pulsante** | Vari | Marrone/primary uniforme |
| **Badge sezioni** | ❌ No | ✅ Sopra ogni domanda |
| **Codice classe** | 4 cifre | 4 cifre |
| **Report PDF** | ✅ Sì | ✅ Sì |

---

## 5. File Modificati (Riepilogo Completo)

### File Server (`server/`)
| File | Modifiche |
|------|-----------|
| `questions.ts` | Sostituito array con 10 domande su Bécquer + campo `sectionTitle` |
| `routers.ts` | Aggiornata procedura `questions.list` per includere `sectionTitle`; aggiunte procedure `nextQuestion`, `prevQuestion`, `advanceFromReading` |
| `db.ts` | Aggiunte funzioni `nextQuestion`, `prevQuestion`, `advanceFromReading` con logica reading pause |

### File Client (`client/src/pages/`)
| File | Modifiche |
|------|-----------|
| `TeacherPage.tsx` | Schermata pausa lettura, badge sezione, pulsante CONTINUA unico, navigazione con frecce |
| `StudentQuiz.tsx` | Schermata pausa lettura, badge sezione, tipo `Question` aggiornato |

### File Database (`drizzle/`)
| File | Modifiche |
|------|-----------|
| `schema.ts` | Aggiunto campo `readingPauseStage` |
| `0002_grey_black_bolt.sql` | Nuova migrazione per reading pause |

### File Configurazione
| File | Modifiche |
|------|-----------|
| `package.json` | Aggiunta dipendenza `jspdf` |
| `.env.example` | Creato per Bécquer Quiz |
| `setup.sh` | Creato per setup ambiente |
| `render.yaml` | Creato per deploy Render |
| `MIGRAZIONE_DETTAGLIATA.md` | Questo file |

---

## 6. Skill quiz-adapter

Il pacchetto include la **skill quiz-adapter** che permette di cambiare le domande del quiz senza modificare manualmente il codice. Lo script Python `skills/quiz-adapter/scripts/change_quiz_theme.py` automatizza:

1. Sostituzione dell'array domande in `server/questions.ts`
2. Aggiornamento dei validatori `.max(N)` in `server/routers.ts`
3. Correzione dei riferimenti `/10` e `>=10` nella UI
4. Trasformazione della griglia 2×2 delle opzioni nei PDF in layout dinamico

Per usare la skill: preparare un file JSON seguendo il modello in `skills/quiz-adapter/templates/questions_example.json`, poi eseguire:

```bash
python skills/quiz-adapter/scripts/change_quiz_theme.py il_tuo_file.json
```

I backup automatici vengono salvati in `.quiz-backups/`.

---

## 7. Licenza

MIT — libero di usare, modificare e condividere.

---

*Documento generato il 19 luglio 2026 da MARKY (Easy-Peasy.AI)*

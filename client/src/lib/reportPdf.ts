/**
 * client/src/lib/reportPdf.ts — PDF ACCESSIBILI (DSA/BES/ipovisione)
 *
 * QUIZ INTERATTIVO CON AUDIO SORGENTE — impaginazione a UNA facciata
 * per alunno (richiesta docente 2026-09-07):
 *   • REPORT: ogni alunno su UNA pagina A4 con TUTTE le opzioni A-D
 *     marcate (✔ verde scuro = corretta / ✘ rossa = errata subito dopo la
 *     lettera dell'opzione scelta; opzione esatta sempre in verde) +
 *     legenda + riquadro PUNTEGGIO (cornice blu). Il riepilogo numerico
 *     RISPOSTE CORRETTE/INCORRETTE è stato RIMOSSO (richiesta docente
 *     2026-09-07) per recuperare spazio e impaginare meglio.
 *   • QUESTIONARIO IN BIANCO: UNA pagina A4 (titolo, campi, 10 domande,
 *     box PUNTEGGIO); le opzioni sono indentate come il testo della domanda
 *     (dopo la casella blu) per non sovrapporsi ai quadratini.
 *   • FONT/INTERLINEA AUTO-ADATTIVI: si parte da 14 pt e fattore 1.5 e, se
 *     il contenuto non entra in una facciata, si scende progressivamente
 *     (fino a 8 pt / fattore 1.0) scegliendo la combinazione PIÙ GRANDE che
 *     entra. La misura avviene SENZA disegnare (stessa engine del paint),
 *     quindi è esatta e veloce.
 *   • NESSUN TESTO FUORI MARGINE: ogni opzione è composta su righe proprie
 *     con wrap a parole (splitTextToSize) entro CW; niente segmenti che
 *     sforano il margine destro.
 *   • Font OpenDyslexic (Regular + Bold) incorporato da /fonts
 *     (client/public/fonts), con fallback automatico su "times".
 *   • Multi-risposta (correctAnswer "risp1||risp2") gestita per-opzione.
 *   • Voto su BASE 10 FISSA: `X/10` e `massimo 10/10` (NON questions.length).
 */
import { jsPDF } from "jspdf";

// ── Titolo del questionario (aggiornare quando si clona l'app con altro tema) ──
const PDF_TITLE = "CUESTIONARIO SOBRE GUSTAVO ADOLFO BÉCQUER";

// ── Geometria A4 ────────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const M = 16;              // margine orizzontale (mm)
const CW = PAGE_W - 2 * M; // 178 mm
const M_TOP = 12;          // margine superiore visivo (mm)
const M_BOT = 12;          // margine inferiore (mm)
const BOTTOM = PAGE_H - M_BOT;
const MM_PER_PT = 0.352778;

// Combinazioni provate in ordine di preferenza (font prima, poi interlinea).
const FONT_CANDIDATES = [14, 13.5, 13, 12.5, 12, 11.5, 11, 10.5, 10, 9.5, 9, 8.5, 8];
const FACTOR_CANDIDATES = [1.5, 1.4, 1.3, 1.2, 1.1, 1.0];

// ── Colori (palette app: testo scuro + cornice BLU approvata) ────────────────
const INK: [number, number, number] = [26, 24, 22];        // testo
const BLUE: [number, number, number] = [0, 70, 160];       // cornice + accenti
const GREEN: [number, number, number] = [0, 120, 60];      // risposta esatta (testo)
const GREEN_DARK: [number, number, number] = [0, 92, 36];  // spunta ✔
const RED: [number, number, number] = [190, 40, 40];       // ✘ errata
const GREY: [number, number, number] = [120, 110, 100];    // separatori

// ── Simboli vettoriali ✔ / ✘ (OpenDyslexic NON ha i glifi U+2714/U+2718) ────
const SYMBOL_W = 4.8;
const MARK_GAP_AFTER_LETTER = 1.7;
const MARK_GAP_BEFORE_TEXT = 1.7;
const PLAIN_GAP_AFTER_LETTER = 1.3; // spazio tra "A)" e testo (opzione non scelta)

// ── Font helpers (OpenDyslexic con fallback times) ──────────────────────────
interface FontState {
  name: string;
  fallback: boolean;
}
let fontState: FontState = { name: "OpenDyslexic", fallback: false };

const fontCache: Record<string, string> = {};

function mmLineHeight(sizePt: number, factor: number): number {
  return sizePt * factor * MM_PER_PT;
}

async function fileToBase64(buf: ArrayBuffer): Promise<string> {
  if (typeof Buffer !== "undefined") return Buffer.from(buf).toString("base64");
  return new Promise<string>((resolve, reject) => {
    const blob = new Blob([buf]);
    const fr = new FileReader();
    fr.onload = () => {
      const s = String(fr.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function loadFontBase64(fileName: string, fontsBase: string): Promise<string> {
  if (fontCache[fileName]) return fontCache[fileName];
  const url = (fontsBase || "") + "/fonts/" + fileName;
  const res = await fetch(url);
  if (!res.ok) throw new Error("font " + fileName + " non disponibile");
  const ab = await res.arrayBuffer();
  fontCache[fileName] = await fileToBase64(ab);
  return fontCache[fileName];
}

async function ensureFonts(doc: jsPDF, fontsBase: string): Promise<void> {
  if (fontState.fallback) return;
  try {
    const reg = await loadFontBase64("OpenDyslexic-Regular.ttf", fontsBase);
    const bold = await loadFontBase64("OpenDyslexic-Bold.ttf", fontsBase);
    doc.addFileToVFS("OpenDyslexic-Regular.ttf", reg);
    doc.addFileToVFS("OpenDyslexic-Bold.ttf", bold);
    doc.addFont("OpenDyslexic-Regular.ttf", "OpenDyslexic", "normal");
    doc.addFont("OpenDyslexic-Bold.ttf", "OpenDyslexic", "bold");
    doc.setFont("OpenDyslexic", "normal");
    fontState = { name: "OpenDyslexic", fallback: false };
  } catch {
    fontState = { name: "times", fallback: true };
    doc.setFont("times", "normal");
  }
}

function setFontNormal(doc: jsPDF): void {
  doc.setFont(fontState.name, "normal");
}
function setFontBold(doc: jsPDF): void {
  doc.setFont(fontState.name, "bold");
}

// ── Tipi ────────────────────────────────────────────────────────────────────
interface Question {
  number: number;
  question: string;
  options: string[];
  correctAnswer: string;    // per domande multiple: "risp1||risp2"
}

interface StudentAnswer {
  questionNumber: number;
  selectedAnswer: string | null;
  isCorrect: boolean;
}

interface ReportStudent {
  name: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  grade: number;
  answers: StudentAnswer[];
}

interface ReportData {
  className: string;
  schoolYear?: string;
  classDate?: string;
  classCode: string;
  questions: Question[];
  students: ReportStudent[];
}

interface BlankQuestion {
  number: number;
  question: string;
  options: string[];
}

interface BlankQuestionsData {
  className: string;
  classDate?: string;
  questions: BlankQuestion[];
}

type RGB = [number, number, number];

interface Style {
  font: number;   // corpo del testo (pt)
  factor: number; // interlinea (moltiplicatore)
}

interface OptView {
  letter: string;
  symbol: "check" | "cross" | null;
  symbolColor: RGB;
  color: RGB;
  bold: boolean;
  text: string;
}

// ── Utility testo ───────────────────────────────────────────────────────────

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function lhOf(st: Style): number {
  return mmLineHeight(st.font, st.factor);
}

/** Imposta corpo/bold correnti sul doc (usato da misura e paint). */
function applyTextStyle(doc: jsPDF, sizePt: number, bold: boolean): void {
  doc.setFontSize(sizePt);
  if (bold) setFontBold(doc);
  else setFontNormal(doc);
}

/** Ritorna le righe (wrap a parole) di un testo, con lo stile indicato. */
function wrapText(doc: jsPDF, text: string, maxW: number, sizePt: number, bold: boolean): string[] {
  applyTextStyle(doc, sizePt, bold);
  return doc.splitTextToSize(text, Math.max(10, maxW));
}

/** Disegna righe già calcolate; ritorna la nuova y. paint=false = sola misura. */
function paintLines(doc: jsPDF, lines: string[], x: number, y: number, lh: number, paint: boolean): number {
  for (const ln of lines) {
    if (paint) doc.text(ln, x, y);
    y += lh;
  }
  return y;
}

/** Disegna il simbolo ✔/✘ vettoriale. */
function drawSymbol(
  doc: jsPDF,
  kind: "check" | "cross",
  color: [number, number, number],
  x: number,
  y: number
): void {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(1.0);
  try {
    if (kind === "check") doc.setLineJoin("miter");
    else doc.setLineJoin("round");
    doc.setLineCap("round");
  } catch {
    /* API non disponibile */
  }
  if (kind === "check") {
    doc.lines(
      [
        [1.0, 3.3],
        [2.7, -2.9],
      ],
      x + 0.35,
      y - 3.85,
      [1, 1],
      "S",
      false
    );
  } else {
    doc.line(x + 0.55, y - 0.7, x + 4.15, y - 3.7);
    doc.line(x + 0.55, y - 3.7, x + 4.15, y - 0.7);
  }
  try {
    doc.setLineCap("butt");
    doc.setLineJoin("miter");
  } catch {
    /* ignora */
  }
}

// =============================================================================
// Opzioni — ogni opzione su righe proprie con wrap sicuro nei margini
// =============================================================================

/** Prepara le "viste" delle opzioni di una domanda (report: con marcature). */
function buildReportOptionViews(q: Question, selected: string | null): OptView[] {
  const correctList = q.correctAnswer.includes("||")
    ? q.correctAnswer.split("||").map((s) => s.trim()).filter(Boolean)
    : [q.correctAnswer.trim()];
  const correctIdxSet = new Set(correctList.map((c) => q.options.indexOf(c)).filter((i) => i >= 0));
  const selList = selected ? selected.split("||").map((s) => s.trim()).filter(Boolean) : [];
  const chosenIdxSet = new Set(selList.map((s) => q.options.indexOf(s)).filter((i) => i >= 0));

  return q.options.map((opt, i) => {
    const isChosen = chosenIdxSet.has(i);
    const isCorrectOpt = correctIdxSet.has(i);
    const isRight = isChosen && isCorrectOpt;
    let color: RGB = INK;
    let bold = false;
    let symbol: "check" | "cross" | null = null;
    let symbolColor: RGB = GREEN_DARK;
    if (isChosen) {
      color = isRight ? GREEN : RED;
      bold = true;
      symbol = isRight ? "check" : "cross";
      symbolColor = isRight ? GREEN_DARK : RED;
    } else if (isCorrectOpt) {
      color = GREEN; // opzione esatta sempre in verde
      bold = true;
    }
    return {
      letter: String.fromCharCode(65 + i),
      symbol,
      symbolColor,
      color,
      bold,
      text: opt,
    };
  });
}

/** Prepara le "viste" delle opzioni del questionario in bianco. */
function buildBlankOptionViews(q: BlankQuestion): OptView[] {
  return q.options.map((opt, i) => ({
    letter: String.fromCharCode(65 + i),
    symbol: null,
    symbolColor: GREEN_DARK,
    color: INK,
    bold: false,
    text: opt,
  }));
}

/** Misura la larghezza del prefisso (lettera + eventuale simbolo) dell'opzione. */
function optionPrefixWidth(doc: jsPDF, v: OptView, sizePt: number): number {
  applyTextStyle(doc, sizePt, v.bold);
  const letterW = doc.getTextWidth(`${v.letter})`);
  if (v.symbol) {
    return letterW + MARK_GAP_AFTER_LETTER + SYMBOL_W + MARK_GAP_BEFORE_TEXT;
  }
  return letterW + PLAIN_GAP_AFTER_LETTER;
}

/** Compone un'opzione su una o più righe (wrap a parole entro maxW).
 *  Ritorna la y dopo l'opzione. paint=false = sola misura (nessun testo emesso). */
function paintOption(
  doc: jsPDF,
  v: OptView,
  x0: number,
  y0: number,
  maxW: number,
  st: Style,
  paint: boolean
): number {
  const lh = lhOf(st);
  const size = st.font;
  const prefixW = optionPrefixWidth(doc, v, size);
  const wrapW = maxW - prefixW;
  const lines = wrapText(doc, v.text, wrapW, size, v.bold);

  // Colore di testo per l'opzione
  applyTextStyle(doc, size, v.bold);
  doc.setTextColor(v.color[0], v.color[1], v.color[2]);

  const textX = x0 + prefixW;
  if (paint) {
    // Lettera (es. "A)") con lo stile dell'opzione
    doc.text(`${v.letter})`, x0, y0);
    if (v.symbol) {
      const sx = x0 + doc.getTextWidth(`${v.letter})`) + MARK_GAP_AFTER_LETTER;
      drawSymbol(doc, v.symbol, v.symbolColor, sx, y0);
    }
    // Testo: prima riga dopo il prefisso, poi eventuali righe indentate uguali
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, y0 + i * lh);
    }
  }
  doc.setTextColor(INK[0], INK[1], INK[2]);
  return y0 + lines.length * lh;
}

// =============================================================================
// Intestazioni
// =============================================================================

/** Intestazione di inizio pagina per il REPORT (titolo + studente + info). */
function paintReportHead(
  doc: jsPDF,
  data: ReportData,
  student: ReportStudent,
  y: number,
  st: Style,
  paint: boolean
): number {
  const lh = lhOf(st);
  const titleSize = Math.min(15, st.font + 2);
  const titleLh = mmLineHeight(titleSize, st.factor);

  // Titolo centrato
  const titleLines = wrapText(doc, PDF_TITLE, CW, titleSize, true);
  if (paint) {
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(titleLines, PAGE_W / 2, y, { align: "center" });
  }
  y += titleLines.length * titleLh + 1.8;

  // Studente centrato
  const nameLines = wrapText(doc, `Studente: ${student.name}`, CW, st.font, true);
  if (paint) {
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(nameLines, PAGE_W / 2, y, { align: "center" });
  }
  y += nameLines.length * lh + 1.2;

  // Classe · Data · Voto (base 10 fissa)
  const info = `Classe: ${data.className}   ·   Data: ${fmtDate(data.classDate)}   ·   Voto: ${Math.round(student.grade)}/10`;
  const infoLines = wrapText(doc, info, CW, st.font, false);
  if (paint) {
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(infoLines, PAGE_W / 2, y, { align: "center" });
  }
  y += infoLines.length * lh + 2;

  // Filetto
  if (paint) {
    doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
    doc.setLineWidth(0.35);
    doc.line(M, y - 0.6, PAGE_W - M, y - 0.6);
  }
  return y + 2.6;
}

/** Intestazione del QUESTIONARIO IN BIANCO (titolo + campi). */
function paintBlankHead(
  doc: jsPDF,
  data: BlankQuestionsData,
  y: number,
  st: Style,
  paint: boolean
): number {
  const titleSize = Math.min(15, st.font + 2);
  const titleLh = mmLineHeight(titleSize, st.factor);

  // Titolo centrato
  const titleLines = wrapText(doc, PDF_TITLE, CW, titleSize, true);
  if (paint) {
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(titleLines, PAGE_W / 2, y, { align: "center" });
  }
  y += titleLines.length * titleLh + 2.2;

  // Campi: COGNOME / NOME / CLASSE / DATA (una riga)
  const fieldSize = Math.min(14, st.font + 1);
  const fieldLh = mmLineHeight(fieldSize, st.factor);
  const fields = ["COGNOME", "NOME", "CLASSE", "DATA"];
  const colW = CW / 4;
  applyTextStyle(doc, fieldSize, true);
  if (paint) doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  fields.forEach((label, i) => {
    const x = M + i * colW;
    const lw = doc.getTextWidth(label + ":");
    if (paint) {
      doc.text(label + ":", x, y);
      const lineX = x + lw + 2;
      const lineEnd = x + colW - 2;
      doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
      doc.setLineWidth(0.3);
      doc.line(lineX, y + 1.1, lineEnd, y + 1.1);
    }
  });
  y += fieldLh + 1.6;

  // Filetto
  if (paint) {
    doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
    doc.setLineWidth(0.35);
    doc.line(M, y - 0.6, PAGE_W - M, y - 0.6);
  }
  return y + 3.2;
}

// =============================================================================
// Riquadro PUNTEGGIO (una riga, cornice blu, font adattivo)
// =============================================================================

function drawScoreBox(
  doc: jsPDF,
  scoreLine: string,
  y: number,
  st: Style,
  paint: boolean
): number {
  let boxFont = Math.min(14, st.font);
  applyTextStyle(doc, boxFont, true);
  let textW = doc.getTextWidth(scoreLine);
  while (textW > CW - 6 && boxFont > 7) {
    boxFont -= 0.5;
    applyTextStyle(doc, boxFont, true);
    textW = doc.getTextWidth(scoreLine);
  }
  const boxH = Math.max(7, boxFont * MM_PER_PT + 4.2);
  const boxW = textW + 6;
  const boxX = (PAGE_W - boxW) / 2;

  if (paint) {
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.4);
    doc.rect(boxX, y, boxW, boxH);
    applyTextStyle(doc, boxFont, true);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text(scoreLine, PAGE_W / 2, y + boxH / 2 + boxFont * MM_PER_PT * 0.3, { align: "center" });
    doc.setTextColor(INK[0], INK[1], INK[2]);
  }
  setFontNormal(doc);
  return boxH;
}

// =============================================================================
// Legenda (centrata, una riga)
// =============================================================================

function paintLegend(doc: jsPDF, x: number, y: number, st: Style, paint: boolean): number {
  const lh = lhOf(st);
  const size = st.font;
  applyTextStyle(doc, size, false);

  const parts: Array<{ type: "symbol"; symbol: "check" | "cross"; color: RGB; gap: number } | { type: "text"; text: string; gap: number }> = [
    { type: "symbol", symbol: "check", color: GREEN_DARK, gap: 1.2 },
    { type: "text", text: "risposta corretta   ·   ", gap: 1.2 },
    { type: "symbol", symbol: "cross", color: RED, gap: 1.2 },
    { type: "text", text: "risposta errata   ·   verde = risposta esatta", gap: 0 },
  ];

  // Larghezza totale (per centrare)
  let totalW = 0;
  for (const p of parts) {
    if (p.type === "symbol") totalW += SYMBOL_W + p.gap;
    else totalW += doc.getTextWidth(p.text) + p.gap;
  }
  let cx = (PAGE_W - totalW) / 2;
  if (paint) {
    doc.setTextColor(INK[0], INK[1], INK[2]);
    for (const p of parts) {
      if (p.type === "symbol") {
        drawSymbol(doc, p.symbol, p.color, cx, y);
        cx += SYMBOL_W + p.gap;
      } else {
        doc.text(p.text, cx, y);
        cx += doc.getTextWidth(p.text) + p.gap;
      }
    }
  }
  return y + lh;
}

// =============================================================================
// REPORT — UNA pagina per alunno
// =============================================================================

/** Compone una pagina di report per lo studente; ritorna la y finale. */
function paintReportPage(
  doc: jsPDF,
  data: ReportData,
  student: ReportStudent,
  st: Style,
  paint: boolean
): number {
  const lh = lhOf(st);
  let y = M_TOP + lh * 0.72;
  y = paintReportHead(doc, data, student, y, st, paint);

  const gapQ = Math.max(0.9, st.font * 0.1);   // spazio tra domande
  const gapOpt = Math.max(0.6, st.font * 0.07); // spazio tra opzioni

  // Domande (mai spezzate: pagina unica garantita dall'auto-fit)
  for (const q of data.questions) {
    const ans = student.answers.find((a) => a.questionNumber === q.number);
    const sel = ans?.selectedAnswer ?? null;

    // Testo domanda
    applyTextStyle(doc, st.font, true);
    if (paint) doc.setTextColor(INK[0], INK[1], INK[2]);
    const qLines = wrapText(doc, `${q.number}. ${q.question}`, CW - 2, st.font, true);
    y = paintLines(doc, qLines, M, y, lh, paint) + gapOpt * 0.4;

    // Opzioni (una sotto l'altra, wrap sicuro)
    const views = buildReportOptionViews(q, sel);
    for (const v of views) {
      y = paintOption(doc, v, M, y, CW, st, paint);
      y += gapOpt;
    }
    y += gapQ;
  }

  // ── Coda: legenda + box PUNTEGGIO (sempre insieme, senza riepilogo
  // numerico RISPOSTE CORRETTE/INCORRETTE — rimosso su richiesta docente
  // per recuperare spazio e impaginare meglio la pagina)
  y += Math.max(1.6, st.font * 0.18);

  // Legenda
  y = paintLegend(doc, 0, y, st, paint) + Math.max(1.6, st.font * 0.18);

  // Box PUNTEGGIO (una linea, cornice blu, mai spezzato)
  const scoreLine = `PUNTEGGIO: ${Math.round(student.grade)}/10 — ogni risposta corretta = 1 pt — massimo 10/10`;
  const boxH = drawScoreBox(doc, scoreLine, y, st, paint);
  return y + boxH;
}

/** Altezza totale della pagina di report (misura senza disegnare). */
function reportPageHeight(doc: jsPDF, data: ReportData, student: ReportStudent, st: Style): number {
  return paintReportPage(doc, data, student, st, false);
}

/** Trova lo stile (font+interlinea) più grande che fa stare OGNI alunno in UNA pagina. */
function pickReportStyle(doc: jsPDF, data: ReportData): Style {
  for (const font of FONT_CANDIDATES) {
    for (const factor of FACTOR_CANDIDATES) {
      const st: Style = { font, factor };
      const fitsAll = data.students.every((s) => reportPageHeight(doc, data, s, st) <= BOTTOM - 1.5);
      if (fitsAll) return st;
    }
  }
  return { font: FONT_CANDIDATES[FONT_CANDIDATES.length - 1], factor: FACTOR_CANDIDATES[FACTOR_CANDIDATES.length - 1] };
}

export async function buildReportPdfDoc(data: ReportData, fontsBase = ""): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await ensureFonts(doc, fontsBase);

  // Sceglie uno stile unico che entra per TUTTI gli studenti
  const style = pickReportStyle(doc, data);

  data.students.forEach((student, si) => {
    if (si > 0) doc.addPage();
    paintReportPage(doc, data, student, style, true);
  });

  return doc;
}

export async function generateReportPdf(data: ReportData): Promise<void> {
  const doc = await buildReportPdfDoc(data);
  const safeName = data.className.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Report_Becquer_${safeName}_${data.classCode}.pdf`);
}

// =============================================================================
// BLANK QUESTIONNAIRE PDF — una pagina A4
// =============================================================================

/** Compone la pagina del questionario in bianco; ritorna la y finale. */
function paintBlankPage(
  doc: jsPDF,
  data: BlankQuestionsData,
  st: Style,
  paint: boolean
): number {
  const lh = lhOf(st);
  let y = M_TOP + lh * 0.72;
  y = paintBlankHead(doc, data, y, st, paint);

  const gapQ = Math.max(1.0, st.font * 0.12);    // spazio tra domande
  const gapOpt = Math.max(0.6, st.font * 0.07);  // spazio tra opzioni
  const boxSide = Math.max(4.6, Math.min(7, st.font * 0.5));
  const qX = M + boxSide + 3;                    // testo domanda dopo la casella
  const qMaxW = CW - boxSide - 3;

  for (const q of data.questions) {
    // Casella blu (per la lettera-risposta) accanto al numero
    if (paint) {
      const boxY = y - lh * 0.78;
      doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.setLineWidth(0.35);
      doc.rect(M, boxY, boxSide, boxSide);
    }

    applyTextStyle(doc, st.font, true);
    if (paint) doc.setTextColor(INK[0], INK[1], INK[2]);
    const qLines = wrapText(doc, `${q.number}. ${q.question}`, qMaxW, st.font, true);
    y = paintLines(doc, qLines, qX, y, lh, paint) + gapOpt * 0.4;

    // Opzioni indentate come il testo della domanda (dopo la casella blu):
    // partendo da x=M finirebbero sotto i quadratini e si sovrapporrebbero
    // con l'interlinea compressa dell'auto-fit.
    const views = buildBlankOptionViews(q);
    for (const v of views) {
      y = paintOption(doc, v, qX, y, qMaxW, st, paint);
      y += gapOpt;
    }
    y += gapQ;
  }

  // Box PUNTEGGIO
  y += Math.max(1.2, st.font * 0.14);
  const scoreLine = `PUNTEGGIO — ogni risposta corretta = 1 pt — massimo 10/10`;
  const boxH = drawScoreBox(doc, scoreLine, y, st, paint);
  return y + boxH;
}

/** Altezza totale del questionario in bianco (misura senza disegnare). */
function blankPageHeight(doc: jsPDF, data: BlankQuestionsData, st: Style): number {
  return paintBlankPage(doc, data, st, false);
}

/** Trova lo stile più grande che fa stare il questionario in UNA pagina. */
function pickBlankStyle(doc: jsPDF, data: BlankQuestionsData): Style {
  for (const font of FONT_CANDIDATES) {
    for (const factor of FACTOR_CANDIDATES) {
      const st: Style = { font, factor };
      if (blankPageHeight(doc, data, st) <= BOTTOM - 1.5) return st;
    }
  }
  return { font: FONT_CANDIDATES[FONT_CANDIDATES.length - 1], factor: FACTOR_CANDIDATES[FACTOR_CANDIDATES.length - 1] };
}

export async function buildBlankQuestionsPdfDoc(
  data: BlankQuestionsData,
  fontsBase = ""
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await ensureFonts(doc, fontsBase);

  const style = pickBlankStyle(doc, data);
  paintBlankPage(doc, data, style, true);

  return doc;
}

export async function generateBlankQuestionsPdf(data: BlankQuestionsData): Promise<void> {
  const doc = await buildBlankQuestionsPdfDoc(data);
  const safeName = data.className.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Cuestionario_Becquer_${safeName}.pdf`);
}

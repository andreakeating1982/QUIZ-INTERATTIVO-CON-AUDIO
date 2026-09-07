#!/usr/bin/env python3
"""
change_quiz_theme.py — Sostituisce il set di domande (e i riferimenti al numero
di domande) in un'app clonata del tipo QUIZ INTERATTIVO CON AUDIO SORGENTE
(architettura Bécquer Quiz: NIENTE file mirror, domande con sectionTitle).

Usage:
    python change_quiz_theme.py questions.json [--project /percorso/progetto]

- `--project` di default è /home/user/becquer-quiz (il SORGENTE).
- La nuova app NON ha file mirror: ogni file esiste in una sola copia
  (server/questions.ts, client/src/pages/*.tsx, client/src/lib/reportPdf.ts).

Input JSON format (questions.json):
{
  "title": "CUESTIONARIO SOBRE FEDERICO GARCÍA LORCA",
  "report_pdf_filename": "Report_Lorca",        // opzionale
  "blank_pdf_filename": "Cuestionario_Lorca",   // opzionale
  "questions": [
    {
      "number": 1,
      "sectionTitle": "1 · EL AUTOR",            // opzionale
      "question": "¿Dónde nació Federico García Lorca?",
      "options": ["En Fuente Vaqueros", "En Granada", "En Madrid", "En Sevilla"],
      "correctAnswer": "En Fuente Vaqueros"
    }
  ]
}

Note: numero di domande qualsiasi (1..N), opzioni >= 2. Il voto resta su
base 10 (db.ts usa questions.length dinamicamente, Q_TOTAL è dinamico).
"""

import json
import sys
import os
import shutil
import re
from pathlib import Path

DEFAULT_PROJECT = Path("/home/user/becquer-quiz")


def bail(msg: str) -> None:
    print(f"❌ ERROR: {msg}")
    sys.exit(1)


def parse_args(argv):
    """Parses arguments: questions.json [--project path]."""
    project = DEFAULT_PROJECT
    positional = []
    i = 0
    while i < len(argv):
        if argv[i] == "--project":
            i += 1
            if i >= len(argv):
                bail("--project richiede un percorso")
            project = Path(argv[i])
        else:
            positional.append(argv[i])
        i += 1
    if len(positional) < 1:
        bail("Usage: python change_quiz_theme.py <questions.json> [--project /path]")
    return Path(positional[0]), project


def backup(file: Path, backup_dir: Path) -> None:
    backup_dir.mkdir(parents=True, exist_ok=True)
    ts = os.path.getmtime(file) if file.exists() else "0"
    dest = backup_dir / f"{file.name}.bak.{int(ts)}"
    shutil.copy2(file, dest)
    print(f"  ✔ Backup: {dest.name}")


def read_or_bail(path: Path) -> str:
    if not path.exists():
        bail(f"File non trovato: {path}")
    return path.read_text(encoding="utf-8")


# ── File-modification functions (ogni file in UNA sola copia) ──────────────

def replace_questions_ts(path: Path, data: list[dict], backup_dir: Path) -> None:
    """Replace the entire questions array (export const BECQUER_QUESTIONS = [...])."""
    backup(path, backup_dir)
    lines = []
    for q in data:
        lines.append("  {")
        lines.append(f'    number: {q["number"]},')
        if q.get("sectionTitle"):
            lines.append(f'    sectionTitle: {json.dumps(q["sectionTitle"])},')
        lines.append(f'    question: {json.dumps(q["question"])},')
        lines.append(f"    options: {json.dumps(q['options'])},")
        lines.append(f"    correctAnswer: {json.dumps(q['correctAnswer'])},\n  }},")
    # json.dumps con ensure_ascii=False produce accenti veri; il sorgente usa
    # escape \u00xx ma entrambe le forme sono valide in TS.
    # Per fedeltà visiva usiamo ensure_ascii=False.
    for i, l in enumerate(lines):
        lines[i] = l.replace('"question"', '"question"').replace('"options"', '"options"')

    content = read_or_bail(path)
    m = re.search(r"export const \w+_QUESTIONS(?::\s*\w+\s*\[\])?\s*=\s*\[", content)
    if not m:
        bail(f"Array domande (export const *_QUESTIONS) non trovato in {path}")
    bracket = m.end()
    end_bracket = content.rindex("];") + 2

    # Costruisce il corpo con ensure_ascii=False per accenti leggibili
    body_lines = []
    for q in data:
        body_lines.append("  {")
        body_lines.append(f'    number: {q["number"]},')
        if q.get("sectionTitle"):
            body_lines.append(f"    sectionTitle: {json.dumps(q['sectionTitle'], ensure_ascii=False)},")
        body_lines.append(f"    question: {json.dumps(q['question'], ensure_ascii=False)},")
        body_lines.append(f"    options: {json.dumps(q['options'], ensure_ascii=False)},")
        body_lines.append(f"    correctAnswer: {json.dumps(q['correctAnswer'], ensure_ascii=False)},")
        body_lines.append("  },")

    new = (
        content[:bracket]
        + "\n"
        + "\n".join(body_lines)
        + "\n"
        + "];"
        + content[end_bracket:]
    )
    path.write_text(new, encoding="utf-8")
    print(f"  ✔ {path.name} — {len(data)} domande scritte")


def replace_max_in_routers(path: Path, count: int, backup_dir: Path) -> None:
    """Update all `.min(1).max(10)` to `.min(1).max(count)` in routers."""
    backup(path, backup_dir)
    content = read_or_bail(path)
    new = re.sub(r"\.min\(1\)\.max\(10\)", f".min(1).max({count})", content)
    if new == content:
        bail(f"Nessun '.min(1).max(10)' trovato in {path} — validatori non aggiornati")
    path.write_text(new, encoding="utf-8")
    print(f"  ✔ {path.name} — .max({count}) applicato")


def replace_in_teacher_page(path: Path, count: int, backup_dir: Path) -> None:
    """Update hardcoded /10 in TeacherPage.tsx."""
    backup(path, backup_dir)
    content = read_or_bail(path)
    original = content

    content = content.replace("Domanda {classDetail.currentQuestion}{'/10'}",
                              f"Domanda {{classDetail.currentQuestion}}{{'/{count}'}}")
    content = content.replace("Domanda {classDetail?.currentQuestion || 1}{'/10'}",
                              f"Domanda {{classDetail?.currentQuestion || 1}}{{'/{count}'}}")
    content = content.replace("student.score + '/10' : correctAnswers + '/10'",
                              f"student.score + '/{count}' : correctAnswers + '/{count}'")
    content = content.replace("student.completed ? student.score + '/10' : correctAnswers + '/10'",
                              f"student.completed ? student.score + '/{count}' : correctAnswers + '/{count}'")

    if content == original:
        print(f"  ⚠️  {path.name} — nessuna sostituzione trovata (stringhe già aggiornate?)")
    else:
        path.write_text(content, encoding="utf-8")
        print(f"  ✔ {path.name} — /{count} applicati")


def replace_in_student_page(path: Path, count: int, backup_dir: Path) -> None:
    """Update hardcoded /10 in StudentQuiz.tsx (progress bar)."""
    backup(path, backup_dir)
    content = read_or_bail(path)
    original = content

    content = content.replace("DOMANDA {currentQNum}/10",
                              f"DOMANDA {{currentQNum}}/{count}")
    content = content.replace("(currentQNum / 10) * 100",
                              f"(currentQNum / {count}) * 100")

    if content == original:
        print(f"  ⚠️  {path.name} — nessuna sostituzione trovata (stringhe già aggiornate?)")
    else:
        path.write_text(content, encoding="utf-8")
        print(f"  ✔ {path.name} — /{count} applicato")


def replace_in_report_pdf(path: Path, new_title: str, report_filename: str,
                          blank_filename: str, backup_dir: Path) -> None:
    """Replace PDF titles and filenames (grid is already dynamic)."""
    backup(path, backup_dir)
    content = read_or_bail(path)
    original = content

    # ── Titolo (report + questionario bianco) ──
    content = content.replace(
        'doc.text("CUESTIONARIO SOBRE GUSTAVO ADOLFO BÉCQUER", PAGE_W / 2, TOP + 1, { align: "center" });',
        f'doc.text("{new_title}", PAGE_W / 2, TOP + 1, {{ align: "center" }});',
    )
    content = content.replace(
        'doc.text("CUESTIONARIO SOBRE GUSTAVO ADOLFO BÉCQUER", PAGE_W / 2, y, { align: "center" });',
        f'doc.text("{new_title}", PAGE_W / 2, y, {{ align: "center" }});',
    )

    # ── Nomi file PDF ──
    content = content.replace("doc.save(`Report_Becquer_",
                              f"doc.save(`{report_filename}_")
    content = content.replace("doc.save(`Cuestionario_Becquer_",
                              f"doc.save(`{blank_filename}_")

    if content == original:
        print(f"  ⚠️  {path.name} — nessuna sostituzione trovata (già adattato?)")
    else:
        path.write_text(content, encoding="utf-8")
        print(f"  ✔ {path.name} — titoli e nomi file applicati")


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    json_path, project = parse_args(sys.argv[1:])
    if not json_path.exists():
        bail(f"File non trovato: {json_path}")

    payload = json.loads(json_path.read_text(encoding="utf-8"))

    # Validazione
    if "questions" not in payload or not isinstance(payload["questions"], list):
        bail("Il JSON deve contenere un array 'questions'")
    if not payload["questions"]:
        bail("L'array questions è vuoto")
    if "title" not in payload:
        bail("Il JSON deve contenere una stringa 'title'")

    title = payload["title"]
    questions = payload["questions"]
    count = len(questions)

    for q in questions:
        if not all(k in q for k in ("number", "question", "options", "correctAnswer")):
            bail(f"Domanda #{q.get('number', '?')} manca di uno di: number, question, options, correctAnswer")
        if not isinstance(q["options"], list) or len(q["options"]) < 2:
            bail(f"Domanda #{q['number']} deve avere almeno 2 opzioni")

    report_fn = payload.get("report_pdf_filename", "Report_Becquer")
    blank_fn = payload.get("blank_pdf_filename", "Cuestionario_Becquer")

    # ── Percorsi (UNA sola copia per file — niente mirror) ──
    P = project
    FILES = {
        "questions":    P / "server" / "questions.ts",
        "routers":      P / "server" / "routers.ts",
        "teacher_page": P / "client" / "src" / "pages" / "TeacherPage.tsx",
        "student_page": P / "client" / "src" / "pages" / "StudentQuiz.tsx",
        "report_pdf":   P / "client" / "src" / "lib" / "reportPdf.ts",
    }
    BACKUP_DIR = P / ".quiz-backups"

    print(f"\n🚀 Cambio set domande in: {project}")
    print(f"   Titolo: {title} — Domande: {count}\n")

    print("[1/5] Sostituzione array domande …")
    replace_questions_ts(FILES["questions"], questions, BACKUP_DIR)

    print("[2/5] Aggiornamento validatori numero domande …")
    replace_max_in_routers(FILES["routers"], count, BACKUP_DIR)

    print("[3/5] Aggiornamento TeacherPage.tsx …")
    replace_in_teacher_page(FILES["teacher_page"], count, BACKUP_DIR)

    print("[4/5] Aggiornamento StudentQuiz.tsx …")
    replace_in_student_page(FILES["student_page"], count, BACKUP_DIR)

    print("[5/5] Aggiornamento reportPdf.ts …")
    replace_in_report_pdf(FILES["report_pdf"], title, report_fn, blank_fn, BACKUP_DIR)

    print(f"\n✅ Fatto! {count} domande scritte in {project}\n")
    print("Prossimi passi:")
    print(f"  1. cd {project}")
    print("  2. pnpm check         (verifica errori TypeScript)")
    print("  3. pnpm build         (compila per la produzione)")
    print("  4. Deploy preview → conferma utente → deploy produzione")
    print(f"\n📁 Backup salvati in: {BACKUP_DIR}\n")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
clone_audio_quiz_app.py — Clona l'app QUIZ INTERATTIVO CON AUDIO SORGENTE
(l'app Bécquer Quiz in /home/user/becquer-quiz) in una NUOVA app identica,
con un set di domande diverso. Audio, testi di lettura, UI, logica sessioni,
report PDF e stili restano IDENTICI al sorgente.

Usage:
    python clone_audio_quiz_app.py --name <nome-progetto> --questions <domande.json> [opzioni]

Opzioni:
    --name <nome>        Nome della nuova app (solo minuscole, numeri, trattini).
                         Es. "quiz-lorca"  →  /home/user/quiz-lorca
    --questions <path>   File JSON con il nuovo set di domande (vedi template).
    --title <titolo>     Titolo mostrato nella scheda del browser
                         (es. "Lorca Quiz Interattivo"). Opzionale: se omesso
                         mantiene "Bécquer Quiz Interattivo".
    --source <path|url>  Progetto sorgente da clonare (default:
                         /home/user/becquer-quiz). Può essere un percorso
                         locale OPPURE un URL di repository GitHub: in tal
                         caso la repository viene clonata in
                         /home/user/_repo_<nome> e usata come sorgente.
    --adapter <path>     Percorso di change_quiz_theme.py (default: auto-rileva
                         prima nella skill quiz-interattivo-con-audio-sorgente,
                         poi in quiz-adapter).
    --force              Sovrascrive la cartella di destinazione se esiste.
    --no-install         Salta pnpm install e pnpm check (per test rapidi).

Cosa fa:
    1. Copia l'intero progetto sorgente (esclusi node_modules, .git, dist,
       .quiz-backups, ZIP, log e guide di deploy).
    2. Rinomina package.json (name) e il <title> di client/index.html.
    3. Inizializza git nella copia (per i checkpoint webdev).
    4. Lancia change_quiz_theme.py sulla copia con il JSON delle domande:
       aggiorna domande (con sectionTitle), validatori, riferimenti /N in UI
       e titoli/nomi file PDF.
    5. Esegue pnpm install e pnpm check (salvo --no-install).

Output atteso: una nuova app pronta per il deploy preview, identica al
sorgente tranne il set di domande (e opzionalmente titolo scheda browser).
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

DEFAULT_SOURCE = Path("/home/user/becquer-quiz")
SKILL_DIR = Path(__file__).resolve().parent
ADAPTER_CANDIDATES = [
    SKILL_DIR / "change_quiz_theme.py",
    Path("/home/user/skills/quiz-adapter/scripts/change_quiz_theme.py"),
]

# Cartelle/file esclusi dalla copia
IGNORED = shutil.ignore_patterns(
    "node_modules", ".git", "dist", ".quiz-backups",
    "*.zip", "*.bak.*", ".DS_Store", "*.log", "__pycache__",
)


def bail(msg: str) -> None:
    print(f"❌ ERROR: {msg}")
    sys.exit(1)


def find_adapter(explicit: str | None) -> Path:
    if explicit:
        p = Path(explicit)
        if not p.exists():
            bail(f"Adapter non trovato: {p}")
        return p
    for cand in ADAPTER_CANDIDATES:
        if cand.exists():
            return cand
    bail("change_quiz_theme.py non trovato né nella skill quiz-interattivo-con-audio-sorgente né in quiz-adapter")


def rename_project(dest: Path, name: str, title: str | None) -> None:
    """Rinomina package.json (name) e <title> di client/index.html."""
    pkg = dest / "package.json"
    if pkg.exists():
        content = pkg.read_text(encoding="utf-8")
        content = re.sub(r'"name"\s*:\s*"[^"]*"', f'"name": "{name}"', content, count=1)
        pkg.write_text(content, encoding="utf-8")
        print(f"  ✔ package.json name → {name}")

    if title:
        html = dest / "client" / "index.html"
        if html.exists():
            content = html.read_text(encoding="utf-8")
            new_content = re.sub(r"<title>[^<]*</title>", f"<title>{title}</title>", content, count=1)
            if new_content != content:
                html.write_text(new_content, encoding="utf-8")
                print(f"  ✔ <title> → {title}")
            else:
                print(f"  ⚠️  <title> non trovato in client/index.html")
        else:
            print(f"  ⚠️  client/index.html non trovato")


def git_init(dest: Path) -> None:
    """Inizializza git e crea il primo commit (necessario per i checkpoint webdev)."""
    try:
        subprocess.run(["git", "init", "-q"], cwd=dest, check=True, capture_output=True)
        # Configura identità locale per garantire il commit (non tocca la config globale)
        subprocess.run(["git", "config", "user.email", "marky@easy-peasy.ai"], cwd=dest, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Marky"], cwd=dest, check=True, capture_output=True)
        subprocess.run(["git", "add", "-A"], cwd=dest, check=True, capture_output=True)
        subprocess.run(
            ["git", "commit", "-q", "-m", "Clone from QUIZ INTERATTIVO CON AUDIO SORGENTE"],
            cwd=dest, check=True, capture_output=True,
        )
        print("  ✔ git inizializzato con primo commit")
    except subprocess.CalledProcessError as e:
        print(f"  ⚠️  git init/commit fallito ({e.stderr.decode()[:120]}). Puoi ignorare se non serve.")


def verify_clone(dest: Path, name: str, count: int, title: str | None) -> bool:
    """Verifica post-clonazione: audio presenti, domande/validatori/titolo aggiornati,
    nessun residuo del nome storico Bécquer nei punti chiave. Ritorna True se tutto ok."""
    print("\n[6/7] Verifica post-clonazione …")
    ok = True

    def check(label: str, cond: bool, detail: str = "") -> None:
        nonlocal ok
        if cond:
            print(f"  ✔ {label}" + (f" ({detail})" if detail else ""))
        else:
            ok = False
            print(f"  ❌ {label}" + (f" ({detail})" if detail else ""))

    # 1. Segmenti audio copiati
    audio_dir = dest / "client" / "public" / "audio"
    segs = sorted(audio_dir.glob("segment_*.m4a")) if audio_dir.exists() else []
    check("segmenti audio copiati", len(segs) >= 5, f"{len(segs)} trovati")

    # 2. Array domande aggiornato (contiene almeno la prima domanda e il numero atteso)
    qts = dest / "server" / "questions.ts"
    q_content = qts.read_text(encoding="utf-8") if qts.exists() else ""
    check("server/questions.ts aggiornato", "number: 1," in q_content)

    # 3. Validatori routers aggiornati
    rts = dest / "server" / "routers.ts"
    r_content = rts.read_text(encoding="utf-8") if rts.exists() else ""
    check(f"validatori .max({count})", f".max({count})" in r_content)

    # 4. package.json rinominato
    pkg = dest / "package.json"
    pkg_content = pkg.read_text(encoding="utf-8") if pkg.exists() else ""
    check("package.json name aggiornato", f'"name": "{name}"' in pkg_content)

    # 5. Titolo browser aggiornato (se richiesto)
    html = dest / "client" / "index.html"
    html_content = html.read_text(encoding="utf-8") if html.exists() else ""
    if title:
        check("<title> browser aggiornato", f"<title>{title}</title>" in html_content)

    # 6. Nessun residuo del nome storico nei file chiave (UI/PDF/questions)
    leftovers = []
    for f in ["client/src/pages/TeacherPage.tsx", "client/src/pages/StudentQuiz.tsx",
              "client/src/lib/reportPdf.ts", "server/questions.ts"]:
        p = dest / f
        if p.exists() and "Bécquer" in p.read_text(encoding="utf-8"):
            leftovers.append(f)
    check("nessun residuo 'Bécquer' nei file chiave", not leftovers,
          ", ".join(leftovers) if leftovers else "")

    # 7. Pattern PDF accessibili (font OpenDyslexic, base 10, box una riga, simboli)
    pdf = dest / "client" / "src" / "lib" / "reportPdf.ts"
    pdf_content = pdf.read_text(encoding="utf-8") if pdf.exists() else ""
    check("PDF: font OpenDyslexic (accessibile)",
          pdf_content.count("OpenDyslexic") >= 2,
          f"{pdf_content.count('OpenDyslexic')} occorrenze")
    check("PDF: box 'massimo 10/10' (report + bianco)",
          pdf_content.count("massimo 10/10") >= 2,
          f"{pdf_content.count('massimo 10/10')} occorrenze")
    check("PDF: box su UN'UNICA riga (larghezza dal testo, margini stretti)",
          "doc.getTextWidth(scoreLine)" in pdf_content,
          "getTextWidth(scoreLine) presente")
    check("PDF: legenda simboli ✔/✘ (buildLegendSegments)",
          "buildLegendSegments" in pdf_content,
          "legenda presente")
    check("PDF: voto su base 10 (X/10)",
          pdf_content.count("/10`") >= 2,
          f"{pdf_content.count('/10`')} occorrenze")
    # 7b. Accessibilità UI presente (font + barra + TTS)
    ui_acc = dest / "client" / "src" / "components" / "AccessibilityToolbar.tsx"
    acc_ctx = dest / "client" / "src" / "contexts" / "AccessibilityContext.tsx"
    font_reg = dest / "client" / "public" / "fonts" / "OpenDyslexic-Regular.ttf"
    check("A11Y: AccessibilityToolbar.tsx presente", ui_acc.exists(), "")
    check("A11Y: AccessibilityContext.tsx presente", acc_ctx.exists(), "")
    check("A11Y: font OpenDyslexic-Regular.ttf presente", font_reg.exists(), "")

    return ok


def export_zip(dest: Path, name: str) -> Path:
    """Crea /home/user/<name>.zip (esclusi node_modules, .git, dist, .quiz-backups, log)
    pronto per il caricamento su GitHub."""
    zip_path = Path("/home/user") / f"{name}.zip"
    if zip_path.exists():
        zip_path.unlink()
    subprocess.run(
        ["zip", "-r", "-q", str(zip_path), f"{name}/",
         "-x", "*/node_modules/*", "*/.git/*", "*/dist/*", "*/.quiz-backups/*", "*.log", "*/.env", "*/__pycache__/*"],
        cwd="/home/user", check=True,
    )
    print(f"  ✔ ZIP pronto: {zip_path}")
    return zip_path


def prepare_source(source: str, name: str) -> Path:
    """Ritorna il percorso sorgente. Se è un URL GitHub, clona in /home/user/_repo_<name>."""
    if source.startswith("http://") or source.startswith("https://"):
        repo_dir = Path(f"/home/user/_repo_{name}")
        if repo_dir.exists():
            shutil.rmtree(repo_dir)
        print(f"  ⏬ Clonazione repository {source} …")
        subprocess.run(
            ["git", "clone", "--depth", "1", source, str(repo_dir)],
            check=True, capture_output=True,
        )
        return repo_dir
    p = Path(source)
    if not p.exists():
        bail(f"Sorgente non trovato: {p}")
    return p


def main() -> None:
    parser = argparse.ArgumentParser(description="Clona QUIZ INTERATTIVO CON AUDIO SORGENTE")
    parser.add_argument("--name", required=True, help="Nome nuova app (minuscole/numeri/trattini)")
    parser.add_argument("--questions", required=True, help="JSON con il nuovo set di domande")
    parser.add_argument("--title", default=None, help="Titolo scheda browser")
    parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Percorso o URL GitHub del sorgente")
    parser.add_argument("--adapter", default=None, help="Percorso alternativo di change_quiz_theme.py")
    parser.add_argument("--force", action="store_true", help="Sovrascrive la destinazione se esiste")
    parser.add_argument("--no-install", action="store_true", help="Salta pnpm install e pnpm check")
    args = parser.parse_args()

    name = args.name
    if not re.fullmatch(r"[a-z0-9-]+", name):
        bail("--name deve contenere solo minuscole, numeri e trattini (es. quiz-lorca)")

    questions = Path(args.questions)
    if not questions.exists():
        bail(f"File domande non trovato: {questions}")

    dest = Path(f"/home/user/{name}")
    if dest.exists():
        if not args.force:
            bail(f"La cartella {dest} esiste già. Usa --force per sovrascriverla.")
        # rm -rf è più robusto di shutil.rmtree con i symlink di node_modules (pnpm)
        subprocess.run(["rm", "-rf", str(dest)], check=True)

    print(f"\n🚀 Clonazione QUIZ INTERATTIVO CON AUDIO SORGENTE → /home/user/{name}\n")

    # 0. Sorgente
    src = prepare_source(args.source, name)

    # 1. Copia
    print("[1/7] Copia progetto …")
    shutil.copytree(src, dest, ignore=IGNORED)
    # rimuove eventuali guide/asset di branding del sorgente
    for extra in ["GUIDA-*.html", "GUIDA-*.txt", "ISTRUZIONI-*.txt"]:
        for f in dest.glob(extra):
            f.unlink()
    print(f"  ✔ Copiato in {dest}")

    # 2. Rinomina
    print("[2/7] Rinomina package.json e <title> …")
    rename_project(dest, name, args.title)

    # 3. Git
    print("[3/7] Inizializzazione git …")
    git_init(dest)

    # 4. Cambio domande
    print("[4/7] Applicazione nuovo set di domande …")
    adapter = find_adapter(args.adapter)
    subprocess.run(
        [sys.executable, str(adapter), str(questions), "--project", str(dest)],
        check=True,
    )

    # 5. Install + check
    if args.no_install:
        print("\n✅ Clonazione completata (--no-install). Esegui manualmente: cd {dest} && pnpm install && pnpm check")
        count = json.loads(questions.read_text(encoding="utf-8")).get("questions", [])
        verify_clone(dest, name, len(count) if isinstance(count, list) else 0, args.title)
        export_zip(dest, name)
        return

    print("[5/7] pnpm install e pnpm check …")
    subprocess.run(["pnpm", "install"], cwd=dest, check=True)
    subprocess.run(["pnpm", "check"], cwd=dest, check=True)

    # 6. Verifica automatica
    count = len(json.loads(questions.read_text(encoding="utf-8")).get("questions", []))
    ok = verify_clone(dest, name, count, args.title)
    if not ok:
        print("\n⚠️  Verifica con problemi: controlla i punti ❌ sopra prima del deploy.")

    # 7. Export ZIP per GitHub
    print("[7/7] Export ZIP …")
    export_zip(dest, name)

    print(f"\n✅ Fatto! Nuova app pronta in /home/user/{name}")
    print("   Verifica completata. Prossimi passi: preview → test visivo → checkpoint → conferma → produzione")
    print(f"   ZIP per GitHub: /home/user/{name}.zip")


if __name__ == "__main__":
    main()

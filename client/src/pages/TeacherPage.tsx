import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play, Users, User, KeyRound, Eye, EyeOff, Plus,
  Hash, Loader2, Check, CheckCircle2, X, XCircle, Clock, BarChart3, LogOut, FileText,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BookOpen, Trash2,
  RotateCcw, Pause, Volume2
} from "lucide-react";
import { toast } from "sonner";
import { generateReportPdf, generateBlankQuestionsPdf } from "@/lib/reportPdf";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── Audio segments for Reading Pauses ──
const READING_SECTIONS = [
  {
    stage: 1,
    title: "1 · El autor",
    audio: "/audio/segment_1.m4a",
  },
  {
    stage: 2,
    title: "2 · La quintaesencia del escritor romántico",
    audio: "/audio/segment_2.m4a",
  },
  {
    stage: 3,
    title: "3 · Rimas (desde 1858)",
    audio: "/audio/segment_3.m4a",
  },
  {
    stage: 4,
    title: "4 · Estructura",
    audio: "/audio/segment_4.m4a",
  },
  {
    stage: 5,
    title: "5 · Lenguaje y estilo",
    audio: "/audio/segment_5.m4a",
  },
];

export default function TeacherPage() {
  // --- Create form state ---
  const [clsName, setClsName] = useState("");
  const [classDate, setClassDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- Active class ---
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeClassInfo, setActiveClassInfo] = useState<any>(null);

  // --- Reopen form state ---
  const [reopenCode, setReopenCode] = useState("");
  const [reopenPassword, setReopenPassword] = useState("");
  const [showReopenPassword, setShowReopenPassword] = useState(false);

  // --- Expanded student answers ---
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // --- Tooltip nome studente: su touch mostra il nome completo al tap ---
  const [tooltipStudent, setTooltipStudent] = useState<string | null>(null);

  // Chiude il tooltip quando si tocca/clicca fuori dal nome.
  // NB: il listener è NATIVO (document), quindi riceve il click anche dopo
  // e.stopPropagation() di React: ignoriamo i click che partono dal nome
  // stesso (data-tooltip-name), altrimenti il tooltip si chiuderebbe subito.
  useEffect(() => {
    if (!tooltipStudent) return;
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest("[data-tooltip-name]")) return;
      setTooltipStudent(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [tooltipStudent]);

  // ── Audio player state (reading pauses) ──
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch ALL classes (for the teacher list)
  const { data: allClasses, isLoading: loadingClasses } = trpc.classes.listAll.useQuery();

  // tRPC utils for imperative calls
  const utils = trpc.useUtils();

  // --- Mutations & Queries ---

  const createClass = trpc.classes.create.useMutation({
    onSuccess: (data) => {
      setActiveClassInfo(data);
      setActiveClassId(data.id);
      toast.success("Classe creata con successo!");
    },
    onError: (err) => toast.error(err.message),
  });

  const closeClass = trpc.classes.close.useMutation({
    onSuccess: () => {
      toast.success("Classe chiusa!");
      utils.classes.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Session control mutations
  const startSessionMutation = trpc.classes.startSession.useMutation({
    onSuccess: () => {
      toast.success("Sessione avviata! Gli studenti ora vedono la domanda.");
      utils.classes.listAll.invalidate();
      utils.classes.getById.invalidate();
      utils.classes.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const goNextQuestion = trpc.classes.nextQuestion.useMutation({
    onSuccess: () => {
      utils.classes.listAll.invalidate();
      utils.classes.getById.invalidate();
      utils.classes.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const goPrevQuestion = trpc.classes.prevQuestion.useMutation({
    onSuccess: () => {
      utils.classes.listAll.invalidate();
      utils.classes.getById.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const advanceReadingMutation = trpc.classes.advanceFromReading.useMutation({
    onSuccess: () => {
      // Reset audio state
      setAudioPlaying(false);
      setAudioProgress(0);
      utils.classes.listAll.invalidate();
      utils.classes.getById.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeStudentMutation = trpc.classes.removeStudent.useMutation({
    onSuccess: () => {
      toast.success("Studente rimosso dalla sessione");
      utils.classes.listAll.invalidate();
      utils.classes.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: shakespeareQuestions } = trpc.questions.list.useQuery();

  // Report download — use utils.fetch to get data on demand
  const [reportLoading, setReportLoading] = useState(false);
  const handleDownloadReport = useCallback(async () => {
    if (!activeClassId) return;
    setReportLoading(true);
    try {
      const data = await utils.classes.report.fetch({ id: activeClassId });
      await generateReportPdf(data);
    } catch (err: any) {
      toast.error(err.message || "Errore durante il download del report");
    } finally {
      setReportLoading(false);
    }
  }, [activeClassId, utils]);

  const handleDownloadBlankQuestions = useCallback(() => {
    if (!activeClassInfo || !shakespeareQuestions) {
      toast.error("Dati non disponibili. Prova ad aprire prima una classe.");
      return;
    }
    generateBlankQuestionsPdf({
      className: activeClassInfo.name,
      classDate: activeClassInfo.date,
      questions: shakespeareQuestions,
    });
  }, [activeClassInfo, shakespeareQuestions]);

  const { data: questionsWithAnswers } = trpc.questions.listWithAnswers.useQuery();

  const revealAnswerMutation = trpc.classes.revealAnswer.useMutation({
    onSuccess: () => {
      toast.success("Risposta esatta mostrata!");
      utils.classes.listAll.invalidate();
      utils.classes.getById.invalidate();
      utils.classes.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetClassMutation = trpc.classes.reset.useMutation({
    onSuccess: (data) => {
      toast.success("Classe riavviata! Puoi iniziare una nuova sessione.");
      setActiveClassInfo(data);
      utils.classes.listAll.invalidate();
      utils.classes.getById.invalidate();
      utils.classes.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const endSessionMutation = trpc.classes.endSession.useMutation({
    onSuccess: () => {
      toast.success("Sessione terminata! La classe rimane aperta.");
      utils.classes.getById.invalidate();
      utils.classes.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEndSession = () => {
    if (!activeClassId) return;
    endSessionMutation.mutate({ id: activeClassId });
  };

  const deleteClass = trpc.classes.delete.useMutation({
    onSuccess: () => {
      toast.success("Classe eliminata definitivamente");
      utils.classes.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Fetch class stats (auto-refreshes every 2 seconds)
  const { data: stats, isFetching: statsLoading } = trpc.classes.stats.useQuery(
    { id: activeClassId! },
    { enabled: !!activeClassId, refetchInterval: 2000 }
  );

  // Fetch full class info
  const { data: classDetail } = trpc.classes.getById.useQuery(
    { id: activeClassId! },
    { enabled: !!activeClassId }
  );

  const handleDeleteClass = () => {
    if (!activeClassId) return;
    const classId = activeClassId;
    if (confirm('Eliminare definitivamente la classe "' + (activeClassInfo?.name || '') + '"?')) {
      setActiveClassId(null);
      setActiveClassInfo(null);
      setExpandedStudent(null);
      deleteClass.mutate({ id: classId });
    }
  };

  // --- Helpers ---

  const handleCreate = () => {
    if (!clsName.trim()) { toast.error("Inserisci il nome della classe"); return; }
    createClass.mutate({
      name: clsName.trim(), date: classDate,
      password: password.trim() || undefined,
    });
  };

  const reopenClassMutation = trpc.classes.reopen.useMutation();

  const handleReopen = async () => {
    if (reopenCode.length !== 4) { toast.error("Inserisci un codice valido di 4 cifre"); return; }
    if (!reopenPassword.trim()) { toast.error("Inserisci la password della classe."); return; }
    try {
      const cls = await reopenClassMutation.mutateAsync({ code: reopenCode, password: reopenPassword });
      setActiveClassInfo(cls);
      setActiveClassId(cls.id);
      toast.success(`Classe ${(cls as any).name} riaperta!`);
    } catch (err: any) {
      toast.error(err?.message || "Classe non trovata. Verifica codice e password.");
    }
  };

  const handleStartSession = () => {
    if (!activeClassId) return;
    startSessionMutation.mutate({ id: activeClassId });
  };

  const handleNextQuestion = () => {
    if (!activeClassId) return;
    goNextQuestion.mutate({ id: activeClassId });
  };

  const handlePrevQuestion = () => {
    if (!activeClassId) return;
    goPrevQuestion.mutate({ id: activeClassId });
  };

  const handleAdvanceFromReading = () => {
    if (!activeClassId) return;
    advanceReadingMutation.mutate({ id: activeClassId });
  };

  // ── Audio player handlers ──
  const currentSection = READING_SECTIONS.find(s => s.stage === (classDetail?.readingPauseStage ?? 0));

  // Reset audio when reading pause stage changes
  const prevStageRef = useRef(0);
  if (prevStageRef.current !== (classDetail?.readingPauseStage ?? 0)) {
    prevStageRef.current = classDetail?.readingPauseStage ?? 0;
    setAudioPlaying(false);
    setAudioProgress(0);
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play();
      setAudioPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime / audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
    setAudioProgress(pct);
  };

  const handleRemoveStudent = (studentId: string) => {
    removeStudentMutation.mutate({ studentId });
  };

  const handleRevealAnswer = () => {
    if (!activeClassId || !classDetail?.currentQuestion || !questionsWithAnswers) return;
    const qNum = classDetail.currentQuestion;
    const fullQ = questionsWithAnswers.find((qa: any) => qa.number === qNum);
    if (!fullQ) return;
    revealAnswerMutation.mutate({ id: activeClassId, questionNumber: qNum, correctAnswer: fullQ.correctAnswer });
  };

  // Track revealed questions
  const revealedData = useMemo(() => {
    try { return JSON.parse(classDetail?.revealedQuestions || "[]") as Array<{q: number; a: string}>; } catch { return []; }
  }, [classDetail?.revealedQuestions]);
  const currentRevealed = revealedData.find(r => r.q === (classDetail?.currentQuestion || 0));

  // ── Active students ──────────────────────────────────────────────────────
  // Tutti gli studenti iscritti alla classe vengono mostrati sempre.
  // Il contatore non si azzera se lo studente salta una domanda.
  const activeStudents = useMemo(() => {
    if (!stats) return [];
    return stats.students as any[];
  }, [stats]);

  // Students who haven't answered the current question (solo tra quelli attivi)
  const pendingStudents = useMemo(() => {
    if (!stats || !classDetail?.currentQuestion) return [];
    const currentQ = classDetail.currentQuestion;
    const answeredIds = new Set(
      (stats.answers as any[])
        .filter((a: any) => a.questionNumber === currentQ)
        .map((a: any) => a.studentId)
    );
    return (activeStudents as any[]).filter((s: any) => {
      if (answeredIds.has(s.id)) return false;
      return true;
    });
  }, [stats, classDetail?.currentQuestion, activeStudents]);

  const handleRestartClass = () => {
    if (!activeClassId) return;
    resetClassMutation.mutate({ id: activeClassId });
  };

  const handleCloseClass = () => {
    if (!activeClassId) return;
    const classId = activeClassId;
    // Reset view immediately — no need to wait for the server
    setActiveClassId(null);
    setActiveClassInfo(null);
    setExpandedStudent(null);
    closeClass.mutate({ id: classId });
  };

  // --- Render helpers ---

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-amber-600";
    return "text-red-500";
  };

  const completedCount = activeStudents.filter((s: any) => s.completed).length;
  const totalStudents = activeStudents.length;

  return (
    <div className="lf-docente min-h-screen bg-background paper-grain flex items-start justify-center p-3 sm:p-4 overflow-x-hidden">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
        }
        aside input, aside input::placeholder {
          text-align: left !important;
        }
        aside input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0 !important;
        }
      `}</style>

      <div className="lf-docente-card w-full max-w-6xl min-h-[580px] max-h-[92vh] bg-card rounded-2xl border border-border/60 shadow-xl flex flex-col overflow-hidden">

        {/* UPBAR */}
        <header className="shrink-0 border-b border-border/40 px-5 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-lg sm:text-xl font-bold leading-tight text-foreground text-center">
              QUIZ INTERATTIVO
            </h1>
            <a href="/" className="inline-flex mx-auto sm:mx-0 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-plum/40 hover:text-plum">
              <Users className="size-4" />
              Area studenti
            </a>
          </div>
        </header>

        {/* MIDDLE ROW: sidebar + main */}
        <div className="lf-docente-body min-h-0 flex-1 flex flex-col sm:flex-row overflow-y-auto sm:overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-full sm:w-72 shrink-0 sm:border-r sm:border-l-0 border-b sm:border-b-0 border-border/40 bg-card/40 sm:overflow-y-auto block pb-4 sm:pb-0">
          <div className="p-4 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Plus className="size-3.5 text-plum" />
                APRI UNA NUOVA CLASSE
              </h3>
              <div className="space-y-2">
                <Input placeholder="Nome classe" value={clsName} onChange={(e) => setClsName(e.target.value)} className="h-9 text-sm !text-center" />
                <div className="relative cursor-pointer" onClick={(e)=>{ const inp = e.currentTarget.querySelector('input') as HTMLInputElement | null; if (inp && typeof (inp as any).showPicker === 'function') (inp as any).showPicker(); }}>
                  <Input type="date" value={classDate} onChange={(e) => setClassDate(e.target.value)} className="h-9 text-sm text-transparent" />
                  <span className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm ${classDate ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {classDate ? new Date(classDate+'T00:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}) : 'gg/mm/aaaa'}
                  </span>
                </div>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`h-9 text-sm pr-8 !text-center ${showPassword ? 'password-visible' : ''}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <Button onClick={handleCreate} disabled={createClass.isPending} className="w-full h-9 text-sm font-semibold" size="sm">
                  {createClass.isPending ? <Loader2 className="size-4 animate-spin" /> : "CREA CLASSE"}
                </Button>
              </div>
            </div>
            <hr className="border-border/40" />
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <KeyRound className="size-3.5 text-plum" />
                RIAPRI UNA CLASSE
              </h3>
              <div className="space-y-2">
                <div className="relative">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input placeholder="Codice" value={reopenCode} onChange={(e) => setReopenCode(e.target.value.replace(/\D/g, "").slice(0, 4))} className="pl-8 h-9 text-sm !text-center" maxLength={4} />
                </div>
                <div className="relative">
                  <Input type={showReopenPassword ? "text" : "password"} placeholder="Password" value={reopenPassword} onChange={(e) => setReopenPassword(e.target.value)} className={`h-9 text-sm pr-8 !text-center ${showReopenPassword ? 'password-visible' : ''}`} />
                  <button type="button" onClick={() => setShowReopenPassword(!showReopenPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showReopenPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <Button onClick={handleReopen} className="w-full h-9 text-sm font-semibold" size="sm">RIAPRI</Button>
              </div>
            </div>
            <hr className="border-border/40" />
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="size-3.5 text-plum" />
                LE TUE CLASSI
                {loadingClasses && <Loader2 className="size-3 animate-spin text-muted-foreground ml-auto" />}
              </h3>
              {!allClasses || allClasses.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nessuna classe ancora creata.</p>
              ) : (
                <div className="space-y-0.5">
                  {allClasses.map((cls: any) => (
                    <div
                      key={cls.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground"
                    >
                      <div className={`size-2 rounded-full shrink-0 ${cls.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="flex-1 truncate font-medium">{cls.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{cls.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
        {/* MAIN CONTENT */}
        <main className="flex-1 sm:overflow-y-auto">
          <div className="w-full p-4 sm:p-5">

            {!activeClassInfo ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="size-20 rounded-3xl bg-muted/60 flex items-center justify-center mb-6">
                  <BookOpen className="size-10 text-muted-foreground/40" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Nessuna classe selezionata</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Crea una nuova classe dalla barra laterale oppure riaprine una già esistente
                </p>
              </div>
            ) : (
              <div className="animate-pop-in space-y-6">

                <div className="grid grid-cols-1 gap-6">
                  {/* Class header */}
                  <Card className="bg-primary/5 border-2 border-primary/30 shadow-md">
                    <CardContent className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                      {/* Riga 1: nome + data */}
                      <div className="flex items-center justify-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <BookOpen className="size-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">{activeClassInfo.name}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {activeClassInfo.date && new Date(activeClassInfo.date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {/* Riga 2: codice + chiudi */}
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg bg-card border border-border/50 px-3 py-1.5 shrink-0">
                          <Hash className="size-4 sm:size-5 text-primary" />
                          <span className="font-mono font-bold text-base sm:text-lg text-primary tracking-widest">{activeClassInfo.code}</span>
                        </div>
                        <Button onClick={handleCloseClass} disabled={closeClass.isPending} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-xl h-9 px-3 text-xs sm:text-sm">
                          {closeClass.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} <span>CHIUDI</span>
                        </Button>
                        <Button onClick={handleDeleteClass} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-xl h-9 px-3 text-xs sm:text-sm">
                          <Trash2 className="size-4" /> <span>ELIMINA CLASSE</span>
                        </Button>
                      </div>
                      {/* Riga 3: statistiche + pulsanti azioni */}
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <div className="flex flex-col rounded-lg bg-card border border-emerald-300 px-3 py-2">
                            <span className="text-[10px] leading-tight text-emerald-600">NUMERO STUDENTI ATTIVI<br/>NELLA SESSIONE IN CORSO</span>
                            <span className="font-bold text-sm text-emerald-700">{activeStudents.length}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button onClick={handleDownloadReport} disabled={reportLoading} variant="outline" className="border-plum/40 text-plum hover:bg-plum/5 hover:border-plum/60 rounded-xl h-9 px-3 text-xs sm:text-sm">
                          {reportLoading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} REPORT PDF
                        </Button>
                        <Button onClick={handleDownloadBlankQuestions} variant="outline" className="border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 rounded-xl h-9 px-3 text-xs sm:text-sm">
                          <FileText className="size-4" /> QUESTIONARIO PDF
                        </Button>
                      </div>
                      </div>

                    </CardContent>
                  </Card>

                  {/* Students */}
                  <Card className="bg-card border border-border/60 shadow-sm">
                    <CardContent className="p-8 sm:p-10">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="size-5 text-plum" />
                        <h3 className="text-lg font-bold text-foreground">Studenti attivi nella sessione</h3>
                        {statsLoading && <Loader2 className="size-4 animate-spin text-muted-foreground ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                        TUTTI GLI STUDENTI ISCRITTI RESTANO VISIBILI.
                      </p>
                      {!stats ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                          <Loader2 className="size-5 animate-spin mr-2" /><span className="text-sm">Caricamento studenti...</span>
                        </div>
                      ) : activeStudents.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-muted/50 border border-dashed border-border/50">
                          <p className="text-muted-foreground text-sm text-center">Nessuno studente ancora presente.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeStudents.map((student: any) => {
                            const studentAnswers = stats.answers.filter((a: any) => a.studentId === student.id);
                            const correctAnswers = studentAnswers.filter((a: any) => a.isCorrect).length;
                            const isExpanded = expandedStudent === student.id;
                            const hasAnswers = studentAnswers.length > 0;
                            const hasAnsweredCurrent = classDetail?.currentQuestion
                              ? studentAnswers.some((a: any) => a.questionNumber === classDetail.currentQuestion)
                              : false;
                            const sectionColors = ['#dc2626', '#f59e0b', '#16a34a', '#2563eb', '#9333ea'];

                            // Build section status for colored dots (matches PERFETTO_2 reference)
                            const sectionStatus = shakespeareQuestions ?
                              Array.from(new Set(shakespeareQuestions.map((q: any) => q.sectionTitle))).map((section, idx) => {
                                const sectionQuestions = shakespeareQuestions.filter((q: any) => q.sectionTitle === section);
                                const answeredInSection = studentAnswers.filter((a: any) =>
                                  sectionQuestions.some((q: any) => q.number === a.questionNumber)
                                );
                                return {
                                  label: section,
                                  submitted: answeredInSection.length > 0,
                                  count: answeredInSection.length,
                                  total: sectionQuestions.length,
                                  color: sectionColors[idx % sectionColors.length],
                                };
                              }) : [];

                            return (
                              <div key={student.id} className="rounded-xl border border-border/50 bg-muted/10">
                                <button onClick={() => setExpandedStudent(isExpanded ? null : student.id)} className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 hover:bg-muted/30 transition-colors text-left ${hasAnswers && isExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}>
                                  <div className="size-2.5 rounded-full shrink-0 bg-gray-300"></div>
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className="group relative block min-w-0 font-semibold text-sm text-foreground text-left cursor-pointer"
                                      onClick={(e: any) => {
                                        if (window.matchMedia('(hover: none)').matches) {
                                          e.stopPropagation();
                                          setTooltipStudent(tooltipStudent === student.id ? null : student.id);
                                        }
                                      }}
                                    >
                                      <span className="block truncate uppercase">{student.name}</span>
                                      <span className={`pointer-events-none absolute left-1/2 bottom-full z-[100] mb-2 -translate-x-1/2 max-w-[85vw] rounded-md bg-black px-3 py-1.5 text-xs text-white uppercase shadow-lg transition-opacity duration-150 ${tooltipStudent === student.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-active:opacity-100 group-focus:opacity-100"}`}>
                                        {student.name}
                                      </span>
                                    </span>
                                  </div>
                                  <div className={`text-[10px] sm:text-xs font-bold shrink-0 text-center leading-tight max-w-[70px] ${!hasAnsweredCurrent && classDetail?.currentQuestion ? 'text-orange-500' : scoreColor(student.completed ? student.score : correctAnswers)}`}>
                                    {!hasAnsweredCurrent && classDetail?.currentQuestion ? 'IN ATTESA DI INVIO' : (student.completed ? student.score : correctAnswers) + '/10'}
                                  </div>
                                  <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                                    {sectionStatus.map((ss: any, i: number) => (
                                      <Tooltip key={i}>
                                        <TooltipTrigger asChild>
                                          <div className={`size-2.5 rounded-full cursor-default ${ss.submitted ? '' : 'border-2'}`} style={ss.submitted ? { backgroundColor: ss.color } : { borderColor: ss.color, backgroundColor: 'transparent' }}></div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="px-3 py-1.5">
                                          <p className="text-[10px] font-bold uppercase">{ss.label}: {ss.submitted ? ss.count + '/' + ss.total + ' inviate' : 'IN ATTESA DI INVIO'}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.id); }} disabled={removeStudentMutation.isPending} className="text-red-500 hover:text-red-700 hover:bg-red-100 px-1.5 h-7 rounded-full" title="Rimuovi studente"><XCircle className="size-4" /></Button>
                                    {hasAnswers && (<div className="text-muted-foreground">{isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</div>)}
                                  </div>
                                </button>
                                {isExpanded && hasAnswers && (
                                  <div className="rounded-b-xl overflow-hidden">
                                    <AnswerDetails studentAnswers={studentAnswers} shakespeareQuestions={questionsWithAnswers || shakespeareQuestions || []} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Session Control */}
                <Card className="bg-card border border-border/60 shadow-sm">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col gap-2 mb-5">
                      {/* Riga titolo */}
                      <div className="flex items-center gap-3">
                        <Play className="size-5 text-plum shrink-0" />
                        <h3 className="text-lg font-bold text-foreground">SESSIONE DOMANDE</h3>
                      </div>

                      {classDetail && !classDetail.isActive ? (
                        /* Classe chiusa — mostra pulsante riavvio */
                        <div className="flex flex-col items-center gap-3 py-6">
                          <p className="text-sm text-muted-foreground">Questa classe è chiusa. Riavvia per iniziare una nuova sessione.</p>
                          <Button onClick={handleRestartClass} disabled={resetClassMutation.isPending} className="h-9 px-5 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                            {resetClassMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <><RotateCcw className="size-4 mr-1.5" /> RIAVVIA CLASSE</>}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          {classDetail?.sessionStarted ? (
                            <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                              <span className="inline-block text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">Sessione attiva · Domanda {classDetail.currentQuestion}{'/10'}</span>
                              <Button onClick={handleEndSession} disabled={endSessionMutation.isPending} className="h-8 px-3 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm">
                                {endSessionMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5 mr-1" />}
                                TERMINA SESSIONE
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    {!classDetail?.sessionStarted && READING_SECTIONS[0] ? (
                      <div className="rounded-2xl bg-muted/30 border border-border/50 p-5 sm:p-8 space-y-5">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <Volume2 className="size-5 text-plum shrink-0" />
                          <h3 className="text-lg font-bold text-foreground">LETTURA INIZIALE</h3>
                        </div>

                        {/* Section title */}
                        <div className="text-xs font-bold text-plum/70 bg-plum/10 rounded-lg px-3 py-1.5 inline-block">
                          {READING_SECTIONS[0].title}
                        </div>

                        {/* Avvia Sessione button */}
                        <div className="flex justify-center">
                          <Button onClick={handleStartSession} disabled={startSessionMutation.isPending} className="h-10 px-6 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                            {startSessionMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Play className="size-4 mr-2" /> AVVIA SESSIONE</>}
                          </Button>
                        </div>
                      </div>
                    ) : (
                    <div className="space-y-5">
                        <div className="flex items-center justify-center gap-4">
                          <Button onClick={handlePrevQuestion} disabled={goPrevQuestion.isPending || (classDetail?.currentQuestion || 1) <= 1} variant="outline" className="h-11 px-4 rounded-xl">
                            <ChevronLeft className="size-5" />
                          </Button>
                          {(classDetail?.readingPauseStage ?? 0) > 0 ? (
                            <span className="font-bold text-lg text-amber-700 min-w-[140px] text-center">📖 LETTURA</span>
                          ) : (
                            <span className="font-bold text-lg text-foreground min-w-[140px] text-center">Domanda {classDetail?.currentQuestion || 1}{'/10'}</span>
                          )}
                          <Button onClick={(classDetail?.readingPauseStage ?? 0) > 0 ? handleAdvanceFromReading : handleNextQuestion} disabled={(classDetail?.readingPauseStage ?? 0) > 0 ? advanceReadingMutation.isPending : (goNextQuestion.isPending || (classDetail?.currentQuestion || 0) >= 10)} variant="outline" className="h-11 px-4 rounded-xl">
                            <ChevronRight className="size-5" />
                          </Button>
                        </div>

                        {(classDetail?.readingPauseStage ?? 0) > 0 && currentSection ? (
                          <div className="rounded-2xl bg-muted/30 border border-border/50 p-5 sm:p-8 space-y-5">
                            {/* Hidden audio element */}
                            <audio
                              ref={audioRef}
                              src={currentSection.audio}
                              onTimeUpdate={handleTimeUpdate}
                              onEnded={handleAudioEnded}
                              preload="auto"
                            />

                            {/* Header */}
                            <div className="flex items-center gap-3">
                              <Volume2 className="size-5 text-plum shrink-0" />
                              <h3 className="text-lg font-bold text-foreground">PAUSA DI LETTURA</h3>
                            </div>

                            {/* Section title */}
                            <div className="text-xs font-bold text-plum/70 bg-plum/10 rounded-lg px-3 py-1.5 inline-block">
                              {currentSection.title}
                            </div>


                            {/* Audio player controls */}
                            <div className="bg-white rounded-xl border border-border/40 p-4 space-y-3">
                              <div
                                className="relative h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
                                onClick={handleSeek}
                              >
                                <div
                                  className="absolute left-0 top-0 h-full bg-plum rounded-full transition-all duration-100"
                                  style={{ width: `${audioProgress * 100}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-center gap-4">
                                <Button
                                  onClick={handlePlayPause}
                                  variant="outline"
                                  className="size-12 rounded-full border-border/60 text-plum hover:bg-plum/5 hover:text-plum hover:border-plum/30 flex items-center justify-center"
                                >
                                  {audioPlaying ? (
                                    <Pause className="size-5" />
                                  ) : (
                                    <Play className="size-5 ml-0.5" />
                                  )}
                                </Button>
                                <Button
                                  onClick={handleAdvanceFromReading}
                                  disabled={advanceReadingMutation.isPending}
                                  className="h-10 px-6 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                                >
                                  {advanceReadingMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Play className="size-4 mr-2" />}
                                  CONTINUA
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : shakespeareQuestions && (() => {
                          const qNum = classDetail?.currentQuestion || 1;
                          const q = shakespeareQuestions.find((qa: any) => qa.number === qNum) as any;
                          if (!q) return null;
                          const qAnswers = stats?.answers?.filter((a: any) => a.questionNumber === qNum) || [];
                          const totalQAnswers = qAnswers.length;
                          const isRevealed = currentRevealed?.q === qNum;
                          const activeStudentIds = new Set(activeStudents.map((s: any) => s.id));
                          const correctCount = isRevealed && currentRevealed?.a
                            ? qAnswers.filter((a: any) => activeStudentIds.has(a.studentId) && a.selectedAnswer === currentRevealed.a).length
                            : 0;
                          return (
                            <div className="rounded-2xl bg-muted/30 border border-border/50 p-5 space-y-4">
                              <div>
                                {q.sectionTitle && (
                                  <div className="text-xs font-bold text-plum/70 tracking-wider uppercase mb-1.5">{q.sectionTitle}</div>
                                )}
                                <p className="font-semibold text-foreground text-base">{q.question}</p>
                              </div>
                              {isRevealed && currentRevealed?.a && (
                                <div className="bg-green-100 border-2 border-green-400 rounded-xl px-4 py-3 text-center space-y-1">
                                  <div>
                                    <span className="text-xs font-medium text-green-700">RISPOSTA ESATTA: </span>
                                    <span className="text-base font-bold text-green-800">{currentRevealed.a}</span>
                                  </div>
                                  <div className="text-[10px] font-medium text-green-700 uppercase tracking-wider">
                                    {correctCount} {correctCount === 1 ? 'STUDENTE HA' : 'STUDENTI HANNO'} RISPOSTO CORRETTAMENTE
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2">
                                {q.options.map((option: string, idx: number) => {
                                  const count = qAnswers.filter((a: any) => a.selectedAnswer === option).length;
                                  const pct = totalQAnswers > 0 ? Math.round((count / totalQAnswers) * 100) : 0;
                                  return (
                                    <div key={idx} className={'flex items-center gap-3 p-3 rounded-xl border bg-card border-border/40'}>
                                      <span className={'size-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-muted text-muted-foreground'}>
                                        {String.fromCharCode(65 + idx)}
                                      </span>
                                      <span className={'text-sm flex-1'}>{option}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex justify-center pt-1">
                                {isRevealed ? (
                                  <div className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
                                    <Check className="size-4" /> Risposta esatta mostrata
                                  </div>
                                ) : (
                                  <Button onClick={handleRevealAnswer} disabled={revealAnswerMutation.isPending} variant="outline" className="h-10 px-5 text-sm font-medium rounded-xl border-plum/40 text-plum hover:bg-plum/5">
                                    {revealAnswerMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Eye className="size-4 mr-2" />} Mostra risposta esatta
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })()}


                      </div>
                    )}
                  </CardContent>
                </Card>


              </div>
            )}
          </div>
        </main>
      </div>

      </div>
    </div>
  );
}

// ── AnswerDetails component — mostra risposta data + risposta ESATTA se errata ──
// NB: le domande devono arrivare dall'endpoint `questions.listWithAnswers`
// (o comunque includere `correctAnswer`): `questions.list` le omette per gli
// studenti e senza di esse il menu mostrerebbe "—" al posto della risposta
// esatta (allineato all'app di riferimento PAROLE-CHIAVE-INTERATTIVE).
function AnswerDetails({ studentAnswers, shakespeareQuestions }: { studentAnswers: any[], shakespeareQuestions: any[] }) {
  const answersBySection = useMemo(() => {
    if (!studentAnswers?.length || !shakespeareQuestions?.length) return [];
    const groups = new Map();
    for (const ans of studentAnswers) {
      const q = shakespeareQuestions.find((qa: any) => qa.number === ans.questionNumber);
      const section = q?.sectionTitle || 'ALTRO';
      if (!groups.has(section)) groups.set(section, []);
      groups.get(section)!.push({ ...ans, correctAnswer: q?.correctAnswer || '—', sectionTitle: section });
    }
    const order = Array.from(new Set(shakespeareQuestions.map((q: any) => q.sectionTitle)));
    return Array.from(groups.entries()).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
  }, [studentAnswers, shakespeareQuestions]);

  const sectionHeaderColors = ['#dc2626', '#d97706', '#16a34a', '#2563eb', '#9333ea'];

  return (
    <div className="border-t border-border/40 bg-muted/15 p-4 space-y-4 rounded-b-xl">
      {answersBySection.map(([section, answers]: [string, any[]], sectionIdx: number) => (
        <div key={section} className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: sectionHeaderColors[sectionIdx % sectionHeaderColors.length] }}>{section}</p>
          {answers.sort((a, b) => a.questionNumber - b.questionNumber).map((answer: any) => (
            <div key={answer.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/70 border border-border/30">
              <span className="text-muted-foreground font-mono text-[11px] w-5 shrink-0 leading-4">#</span>
              {answer.isCorrect ? (
                <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 space-y-0.5">
                <span className={`block text-xs font-medium break-words ${answer.isCorrect ? 'text-green-700' : 'text-red-600'}`} title={answer.selectedAnswer}>{answer.selectedAnswer}</span>
                {!answer.isCorrect && (
                  <span className="block text-xs font-medium text-green-700 break-words" title={answer.correctAnswer}>
                    <span className="text-muted-foreground mr-1">→</span>{answer.correctAnswer}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

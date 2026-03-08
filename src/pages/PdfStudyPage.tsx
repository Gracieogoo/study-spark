import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubjects, useNotes } from "@/lib/study-store";
import { useFlashcards } from "@/lib/flashcard-store";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Loader2, CheckCircle2, XCircle, BookOpen, BrainCircuit, Trash2, Save, Layers, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface PdfHistoryItem {
  id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
}

interface QuizHistoryItem {
  id: string;
  source: string;
  source_name: string;
  questions: QuizQuestion[];
  score: number | null;
  total: number;
  created_at: string;
}

export default function PdfStudyPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<{ front: string; back: string }[]>([]);
  const [flashcardSubjectId, setFlashcardSubjectId] = useState("");
  const [saveSubjectId, setSaveSubjectId] = useState("");
  const [history, setHistory] = useState<PdfHistoryItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { subjects } = useSubjects();
  const { addNote } = useNotes();
  const { addFlashcard } = useFlashcards();

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const [pdfRes, quizRes] = await Promise.all([
      supabase.from("pdf_history").select("*").order("created_at", { ascending: false }),
      supabase.from("quiz_history").select("*").eq("source", "pdf").order("created_at", { ascending: false }),
    ]);
    setHistory((pdfRes.data as PdfHistoryItem[]) || []);
    setQuizHistory((quizRes.data as unknown as QuizHistoryItem[]) || []);
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleGenerateFlashcards = async () => {
    if (!pdfBase64 || !user) return;
    setLoadingFlashcards(true);
    setGeneratedFlashcards([]);
    try {
      const { data, error } = await supabase.functions.invoke("pdf-process", {
        body: { pdfBase64, action: "flashcards" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.flashcards && Array.isArray(data.flashcards)) {
        setGeneratedFlashcards(data.flashcards);
        toast.success(`Generated ${data.flashcards.length} flashcards!`);
      } else {
        toast.error("Unexpected response format from AI.");
      }
    } catch {
      toast.error("Failed to generate flashcards. Please try again.");
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleSaveFlashcards = async () => {
    if (!flashcardSubjectId || generatedFlashcards.length === 0) return;
    try {
      for (const card of generatedFlashcards) {
        await addFlashcard(flashcardSubjectId, card.front, card.back);
      }
      toast.success(`Saved ${generatedFlashcards.length} flashcards!`);
      setGeneratedFlashcards([]);
    } catch {
      toast.error("Failed to save flashcards.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }

    setFileName(file.name);
    setSummary("");
    setQuestions([]);
    setCurrentQuizId(null);
    setAnswers({});
    setShowResults(false);
    setGeneratedFlashcards([]);
    setUploading(true);

    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(filePath, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;
      setStoragePath(filePath);

      await supabase.from("pdf_history").insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: filePath,
      });
      fetchHistory();

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setPdfBase64(base64);
        setUploading(false);
      };
      reader.readAsDataURL(file);
      toast.success("PDF uploaded!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Failed to upload PDF. Please try again.");
      setUploading(false);
    }
  };

  const loadFromHistory = async (item: PdfHistoryItem) => {
    setFileName(item.file_name);
    setStoragePath(item.storage_path);
    setSummary("");
    setQuestions([]);
    setCurrentQuizId(null);
    setAnswers({});
    setShowResults(false);
    setGeneratedFlashcards([]);
    setUploading(true);

    try {
      const { data, error } = await supabase.storage
        .from("pdfs")
        .download(item.storage_path);
      if (error) throw error;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setPdfBase64(base64);
        setUploading(false);
      };
      reader.readAsDataURL(data);
      toast.success(`Loaded "${item.file_name}"`);
    } catch {
      toast.error("Failed to load PDF from history.");
      setUploading(false);
    }
  };

  const deleteFromHistory = async (item: PdfHistoryItem) => {
    await supabase.storage.from("pdfs").remove([item.storage_path]);
    await supabase.from("pdf_history").delete().eq("id", item.id);
    if (storagePath === item.storage_path) {
      setFileName("");
      setPdfBase64("");
      setStoragePath("");
      setSummary("");
      setQuestions([]);
      setCurrentQuizId(null);
      setAnswers({});
      setShowResults(false);
      setGeneratedFlashcards([]);
    }
    fetchHistory();
    toast.success("PDF removed.");
  };

  const handleSummarize = async () => {
    if (!pdfBase64) return;
    setLoadingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("pdf-process", {
        body: { pdfBase64, action: "summarize" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setSummary(data?.summary || "No summary returned.");
    } catch {
      toast.error("Failed to summarize PDF. Please try again.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleQuiz = async () => {
    if (!pdfBase64 || !user) return;
    setLoadingQuiz(true);
    setAnswers({});
    setShowResults(false);
    setCurrentQuizId(null);
    try {
      const { data, error } = await supabase.functions.invoke("pdf-process", {
        body: { pdfBase64, action: "quiz" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);

        // Auto-save quiz to history
        const { data: inserted } = await supabase.from("quiz_history").insert({
          user_id: user.id,
          source: "pdf",
          source_name: fileName || "PDF",
          questions: data.questions,
          total: data.questions.length,
        }).select("id").single();

        if (inserted) setCurrentQuizId(inserted.id);
        fetchHistory();
        toast.success("Quiz generated and saved!");
      } else {
        toast.error("Unexpected response format from AI.");
      }
    } catch {
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswer = (qIndex: number, optIndex: number) => {
    if (showResults) return;
    setAnswers((p) => ({ ...p, [qIndex]: optIndex }));
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );

  const handleCheckAnswers = async () => {
    setShowResults(true);
    // Update score in quiz history
    if (currentQuizId && user) {
      await supabase.from("quiz_history").update({ score }).eq("id", currentQuizId);
      fetchHistory();
    }
  };

  const loadQuizFromHistory = (item: QuizHistoryItem) => {
    setQuestions(item.questions);
    setCurrentQuizId(item.id);
    setAnswers({});
    setShowResults(false);
  };

  const clearFile = () => {
    setFileName("");
    setPdfBase64("");
    setStoragePath("");
    setSummary("");
    setQuestions([]);
    setCurrentQuizId(null);
    setAnswers({});
    setShowResults(false);
    setGeneratedFlashcards([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">PDF Study Tool</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF to get an AI-powered summary, quiz, or flashcards.
        </p>
      </div>

      {/* Upload area */}
      <Card className={pdfBase64 ? "border-primary/40" : "border-dashed"}>
        <CardContent className="py-6">
          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Loading PDF...</span>
            </div>
          ) : !pdfBase64 ? (
            <label className="flex flex-col items-center justify-center gap-3 cursor-pointer py-6">
              <FileUp className="h-10 w-10 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">
                Click to upload a PDF (max 10MB)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm truncate max-w-xs">{fileName}</span>
              </div>
              <Button size="sm" variant="outline" onClick={clearFile}>
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {pdfBase64 && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSummarize} disabled={loadingSummary || loadingQuiz || loadingFlashcards || uploading}>
            {loadingSummary ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BookOpen className="h-4 w-4 mr-1" />}
            Summarize
          </Button>
          <Button variant="secondary" onClick={handleQuiz} disabled={loadingSummary || loadingQuiz || loadingFlashcards || uploading}>
            {loadingQuiz ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-1" />}
            Generate Quiz
          </Button>
          <Button variant="secondary" onClick={handleGenerateFlashcards} disabled={loadingSummary || loadingQuiz || loadingFlashcards || uploading}>
            {loadingFlashcards ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Layers className="h-4 w-4 mr-1" />}
            Generate Flashcards
          </Button>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Summary
              </span>
              <div className="flex items-center gap-2">
                <Select value={saveSubjectId} onValueChange={setSaveSubjectId}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="Subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!saveSubjectId}
                  onClick={async () => {
                    await addNote({ subjectId: saveSubjectId, title: `Summary: ${fileName}`, content: summary });
                    toast.success("Summary saved as note!");
                  }}
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Save as Note
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* Quiz */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" /> Quiz
          </h2>
          {questions.map((q, qi) => (
            <Card key={qi}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">
                  Q{qi + 1}. {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  const isCorrect = q.correctIndex === oi;
                  let extraClass = "cursor-pointer hover:bg-primary/5 border";

                  if (showResults && isCorrect) {
                    extraClass = "border-2 border-success bg-success/5";
                  } else if (showResults && selected && !isCorrect) {
                    extraClass = "border-2 border-destructive bg-destructive/5";
                  } else if (selected) {
                    extraClass = "border-2 border-primary bg-primary/5";
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(qi, oi)}
                      className={`w-full text-left text-sm p-3 rounded-lg flex items-center gap-2 transition-colors ${extraClass}`}
                    >
                      {showResults && isCorrect && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                      {showResults && selected && !isCorrect && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center gap-3">
            {!showResults ? (
              <Button
                onClick={handleCheckAnswers}
                disabled={Object.keys(answers).length < questions.length}
              >
                Check Answers
              </Button>
            ) : (
              <Card className="w-full">
                <CardContent className="py-4 flex items-center justify-between">
                  <span className="font-display font-bold text-lg">
                    Score: {score}/{questions.length}
                  </span>
                  <Button variant="secondary" onClick={handleQuiz}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Generated Flashcards */}
      {generatedFlashcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Generated Flashcards ({generatedFlashcards.length})
              </span>
              <div className="flex items-center gap-2">
                <Select value={flashcardSubjectId} onValueChange={setFlashcardSubjectId}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="Subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!flashcardSubjectId}
                  onClick={handleSaveFlashcards}
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Save All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {generatedFlashcards.map((card, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.back}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quiz History */}
      {quizHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary" /> Quiz History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quizHistory.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                onClick={() => loadQuizFromHistory(item)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.source_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()} · {item.total} questions
                  </p>
                </div>
                {item.score !== null && (
                  <span className={`text-sm font-bold shrink-0 ${item.score >= item.total * 0.7 ? "text-success" : "text-destructive"}`}>
                    {item.score}/{item.total}
                  </span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PDF History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> PDF History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PDFs uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors
                    ${storagePath === item.storage_path ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/50"}
                  `}
                >
                  <button
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    onClick={() => loadFromHistory(item)}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteFromHistory(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

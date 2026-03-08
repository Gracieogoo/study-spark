import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubjects, useNotes } from "@/lib/study-store";
import { useFlashcards } from "@/lib/flashcard-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Loader2, CheckCircle2, XCircle, BookOpen, BrainCircuit, Trash2, Save, Layers } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export default function PdfStudyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [summary, setSummary] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [saveSubjectId, setSaveSubjectId] = useState("");
  const { subjects } = useSubjects();
  const { addNote } = useNotes();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setAnswers({});
    setShowResults(false);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setPdfBase64(base64);
    };
    reader.readAsDataURL(file);
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
    if (!pdfBase64) return;
    setLoadingQuiz(true);
    setAnswers({});
    setShowResults(false);
    try {
      const { data, error } = await supabase.functions.invoke("pdf-process", {
        body: { pdfBase64, action: "quiz" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
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

  const clearFile = () => {
    setFileName("");
    setPdfBase64("");
    setSummary("");
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">PDF Study Tool</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF to get an AI-powered summary or quiz.
        </p>
      </div>

      {/* Upload area */}
      <Card className={pdfBase64 ? "border-primary/40" : "border-dashed"}>
        <CardContent className="py-6">
          {!pdfBase64 ? (
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
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={clearFile}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {pdfBase64 && (
        <div className="flex gap-3">
          <Button onClick={handleSummarize} disabled={loadingSummary || loadingQuiz}>
            {loadingSummary ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BookOpen className="h-4 w-4 mr-1" />}
            Summarize
          </Button>
          <Button variant="secondary" onClick={handleQuiz} disabled={loadingSummary || loadingQuiz}>
            {loadingQuiz ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-1" />}
            Generate Quiz
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
                onClick={() => setShowResults(true)}
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
    </div>
  );
}

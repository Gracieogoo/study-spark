import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNotes, useSubjects } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Loader2, CheckCircle2, XCircle, FileText, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
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

export default function QuizPage() {
  const { user } = useAuth();
  const { notes } = useNotes();
  const { subjects } = useSubjects();
  const [topic, setTopic] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [mode, setMode] = useState<"topic" | "notes">("topic");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("quiz_history")
      .select("*")
      .order("created_at", { ascending: false });
    setHistory((data as unknown as QuizHistoryItem[]) || []);
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setAnswers({});
    setShowResults(false);
    setCurrentQuizId(null);

    try {
      let body: Record<string, string> = {};
      let sourceName = "";

      if (mode === "notes" && selectedNote) {
        const note = notes.find((n) => n.id === selectedNote);
        if (note) {
          body = { noteTitle: note.title, noteContent: note.content };
          sourceName = note.title;
        }
      } else if (mode === "topic" && topic.trim()) {
        body = { topic: topic.trim() };
        sourceName = topic.trim();
      }

      const { data, error } = await supabase.functions.invoke("quiz-generate", { body });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);

        // Auto-save to history
        const { data: inserted } = await supabase.from("quiz_history").insert({
          user_id: user.id,
          source: mode,
          source_name: sourceName,
          questions: data.questions,
          total: data.questions.length,
        }).select("id").single();

        if (inserted) setCurrentQuizId(inserted.id);
        fetchHistory();
        toast.success("Quiz generated and saved!");
      } else {
        toast.error("Unexpected response format from AI");
      }
    } catch (e) {
      console.error("Quiz generation error:", e);
      toast.error("Failed to generate quiz. Please try again.");
    }

    setLoading(false);
  };

  const canGenerate =
    (mode === "topic" && topic.trim()) || (mode === "notes" && selectedNote);

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
    if (currentQuizId && user) {
      await supabase.from("quiz_history").update({ score }).eq("id", currentQuizId);
      fetchHistory();
    }
  };

  const loadFromHistory = (item: QuizHistoryItem) => {
    setQuestions(item.questions);
    setCurrentQuizId(item.id);
    setAnswers({});
    setShowResults(false);
  };

  const deleteFromHistory = async (id: string) => {
    await supabase.from("quiz_history").delete().eq("id", id);
    if (currentQuizId === id) {
      setQuestions([]);
      setCurrentQuizId(null);
      setAnswers({});
      setShowResults(false);
    }
    fetchHistory();
    toast.success("Quiz removed from history.");
  };

  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name || "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">AI Quiz Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate smart quiz questions from a topic or from your class notes using AI.
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5" /> Generate
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> History ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "topic" ? "default" : "secondary"}
              size="sm"
              onClick={() => setMode("topic")}
            >
              <BrainCircuit className="h-4 w-4 mr-1" /> From Topic
            </Button>
            <Button
              variant={mode === "notes" ? "default" : "secondary"}
              size="sm"
              onClick={() => setMode("notes")}
            >
              <FileText className="h-4 w-4 mr-1" /> From Notes
            </Button>
          </div>

          {mode === "topic" ? (
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Photosynthesis, Linear Algebra, French Revolution..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canGenerate && !loading && handleGenerate()}
              />
              <Button onClick={handleGenerate} disabled={loading || !canGenerate}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-1" />}
                Generate
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={selectedNote} onValueChange={setSelectedNote}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a note to quiz from..." />
                </SelectTrigger>
                <SelectContent>
                  {notes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.title} — {getSubjectName(n.subject_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerate} disabled={loading || !canGenerate}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-1" />}
                Generate
              </Button>
            </div>
          )}

          {mode === "notes" && notes.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No notes yet! Head to the Notes page to create some.</p>
              </CardContent>
            </Card>
          )}

          {questions.length > 0 && (
            <div className="space-y-4">
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
                      <Button variant="secondary" onClick={handleGenerate}>
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {questions.length === 0 && !loading && mode === "topic" && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BrainCircuit className="h-10 w-10 mb-3 opacity-40" />
                <p>Type a topic above and generate an AI-powered quiz!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-40" />
                <p>No quiz history yet. Generate your first quiz!</p>
              </CardContent>
            </Card>
          ) : (
            history.map((item) => (
              <Card key={item.id} className="group">
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => loadFromHistory(item)}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{item.source_name || "Untitled"}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{item.source}</span>
                      <span>·</span>
                      <span>{item.total} questions</span>
                      <span>·</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.score !== null && (
                      <span className={`text-sm font-bold ${item.score >= item.total * 0.7 ? "text-success" : "text-destructive"}`}>
                        {item.score}/{item.total}
                      </span>
                    )}
                    {item.score === null && (
                      <span className="text-xs text-muted-foreground">Not taken</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => deleteFromHistory(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

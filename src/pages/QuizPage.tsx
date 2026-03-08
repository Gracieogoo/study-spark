import { useState } from "react";
import { useNotes, useSubjects } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Loader2, CheckCircle2, XCircle, FileText } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

function generateQuizFromTopic(topic: string): QuizQuestion[] {
  const templates: Array<(t: string) => QuizQuestion> = [
    (t) => ({
      question: `Which of the following best describes the core concept of ${t}?`,
      options: [
        `A fundamental principle that defines ${t}`,
        `A secondary aspect unrelated to ${t}`,
        `An outdated theory about ${t}`,
        `A common misconception about ${t}`,
      ],
      correctIndex: 0,
    }),
    (t) => ({
      question: `What is a key application of ${t} in practice?`,
      options: [
        `It has no practical applications`,
        `Problem-solving and analysis in its domain`,
        `Only used in theoretical discussions`,
        `Exclusively used in unrelated fields`,
      ],
      correctIndex: 1,
    }),
    (t) => ({
      question: `Which prerequisite knowledge is most helpful for understanding ${t}?`,
      options: [
        `No prior knowledge is needed`,
        `Advanced mathematics only`,
        `Foundational concepts in the same domain`,
        `Knowledge of unrelated subjects`,
      ],
      correctIndex: 2,
    }),
    (t) => ({
      question: `How has the understanding of ${t} evolved over time?`,
      options: [
        `It has remained completely unchanged`,
        `Only minor terminology changes`,
        `It was recently discovered`,
        `Significant developments through research and practice`,
      ],
      correctIndex: 3,
    }),
    (t) => ({
      question: `What is a common challenge when studying ${t}?`,
      options: [
        `Understanding the interconnected concepts`,
        `There are no challenges`,
        `It is too simple to be challenging`,
        `The topic is fully self-explanatory`,
      ],
      correctIndex: 0,
    }),
  ];
  return templates.map((fn) => fn(topic));
}

function generateQuizFromNotes(noteTitle: string, noteContent: string): QuizQuestion[] {
  // Extract key sentences from notes to build questions
  const sentences = noteContent
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const questions: QuizQuestion[] = [];

  if (sentences.length >= 1) {
    questions.push({
      question: `Based on your notes about "${noteTitle}", which statement is accurate?`,
      options: [
        sentences[0],
        `${noteTitle} has no relevant applications`,
        `This topic is entirely theoretical`,
        `None of the notes are relevant`,
      ],
      correctIndex: 0,
    });
  }

  if (sentences.length >= 2) {
    questions.push({
      question: `Your notes mention which of the following about "${noteTitle}"?`,
      options: [
        `The topic was never discussed`,
        sentences[Math.min(1, sentences.length - 1)],
        `Only formulas were covered`,
        `The topic is outdated`,
      ],
      correctIndex: 1,
    });
  }

  if (sentences.length >= 3) {
    questions.push({
      question: `Which key point from your "${noteTitle}" notes is correct?`,
      options: [
        `This was not covered in class`,
        `Only definitions were provided`,
        sentences[Math.min(2, sentences.length - 1)],
        `The notes are incomplete`,
      ],
      correctIndex: 2,
    });
  }

  questions.push({
    question: `What is the main topic of your notes titled "${noteTitle}"?`,
    options: [
      `An unrelated subject`,
      `General overview only`,
      `Not enough information`,
      `${noteTitle} and its key concepts`,
    ],
    correctIndex: 3,
  });

  questions.push({
    question: `How can you best review your "${noteTitle}" notes?`,
    options: [
      `By actively recalling the key points and testing yourself`,
      `By skimming once and moving on`,
      `By memorizing without understanding`,
      `By ignoring the material`,
    ],
    correctIndex: 0,
  });

  return questions.slice(0, 5);
}

export default function QuizPage() {
  const { notes } = useNotes();
  const { subjects } = useSubjects();
  const [topic, setTopic] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [mode, setMode] = useState<"topic" | "notes">("topic");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setAnswers({});
    setShowResults(false);

    setTimeout(() => {
      if (mode === "notes" && selectedNote) {
        const note = notes.find((n) => n.id === selectedNote);
        if (note) {
          setQuestions(generateQuizFromNotes(note.title, note.content));
        }
      } else if (mode === "topic" && topic.trim()) {
        setQuestions(generateQuizFromTopic(topic.trim()));
      }
      setLoading(false);
    }, 800);
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

  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name || "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">AI Quiz Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate quiz questions from a topic or from your class notes.
        </p>
      </div>

      {/* Mode selector */}
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
            onKeyDown={(e) => e.key === "Enter" && canGenerate && handleGenerate()}
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
            <p>Type a topic above and generate a quiz!</p>
            <p className="text-xs mt-1">Connect Lovable Cloud later for AI-powered questions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// Local quiz generator (no backend needed for V1)
function generateQuiz(topic: string): QuizQuestion[] {
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

export default function QuizPage() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setLoading(true);
    setAnswers({});
    setShowResults(false);
    // Simulate slight delay
    setTimeout(() => {
      setQuestions(generateQuiz(topic.trim()));
      setLoading(false);
    }, 800);
  };

  const handleAnswer = (qIndex: number, optIndex: number) => {
    if (showResults) return;
    setAnswers((p) => ({ ...p, [qIndex]: optIndex }));
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">AI Quiz Generator</h1>
        <p className="text-muted-foreground mt-1">
          Enter a topic and get quiz questions to test your knowledge.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="e.g., Photosynthesis, Linear Algebra, French Revolution..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <Button onClick={handleGenerate} disabled={loading || !topic.trim()}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-1" />}
          Generate
        </Button>
      </div>

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
                  let variant = "secondary" as const;
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

      {questions.length === 0 && !loading && (
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

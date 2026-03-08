import { useState, useMemo } from "react";
import { useSubjects } from "@/lib/study-store";
import { useFlashcards } from "@/lib/flashcard-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Brain,
  Trash2,
} from "lucide-react";

type Mode = "manage" | "review";

export default function FlashcardsPage() {
  const { subjects } = useSubjects();
  const { flashcards, addFlashcard, updateFlashcard, removeFlashcard } = useFlashcards();
  const [mode, setMode] = useState<Mode>("manage");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  // Review state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const filteredCards = useMemo(
    () =>
      selectedSubject
        ? flashcards.filter((c) => c.subject_id === selectedSubject)
        : flashcards,
    [flashcards, selectedSubject]
  );

  const dueCards = useMemo(
    () => filteredCards.filter((c) => new Date(c.next_review) <= new Date()),
    [filteredCards]
  );

  const handleAdd = async () => {
    if (!front.trim() || !back.trim() || !selectedSubject) return;
    await addFlashcard(selectedSubject, front.trim(), back.trim());
    setFront("");
    setBack("");
  };

  const startReview = () => {
    if (dueCards.length === 0) return;
    setMode("review");
    setReviewIndex(0);
    setFlipped(false);
    setReviewDone(false);
  };

  const handleReviewResponse = async (quality: number) => {
    const card = dueCards[reviewIndex];
    if (!card) return;

    // SM-2 algorithm
    let { ease_factor, interval, review_count } = card;
    let ef = Number(ease_factor);

    if (quality >= 3) {
      if (review_count === 0) interval = 1;
      else if (review_count === 1) interval = 6;
      else interval = Math.round(interval * ef);
      ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
      interval = 1;
    }
    if (ef < 1.3) ef = 1.3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await updateFlashcard(card.id, {
      interval,
      ease_factor: ef,
      review_count: review_count + 1,
      next_review: nextReview.toISOString(),
    });

    setFlipped(false);
    if (reviewIndex + 1 >= dueCards.length) {
      setReviewDone(true);
    } else {
      setReviewIndex((i) => i + 1);
    }
  };

  const currentCard = dueCards[reviewIndex];

  if (mode === "review") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Review
          </h1>
          <Button variant="ghost" size="sm" onClick={() => setMode("manage")}>
            Back
          </Button>
        </div>

        {reviewDone ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <p className="text-lg font-display font-bold">All done!</p>
              <p className="text-sm text-muted-foreground">
                You reviewed {dueCards.length} card{dueCards.length !== 1 ? "s" : ""}. Come back later for more.
              </p>
              <Button variant="secondary" onClick={() => setMode("manage")}>
                Back to Cards
              </Button>
            </CardContent>
          </Card>
        ) : currentCard ? (
          <>
            <p className="text-sm text-muted-foreground">
              Card {reviewIndex + 1} of {dueCards.length}
            </p>
            <Card
              className="cursor-pointer min-h-[200px] flex items-center justify-center transition-all hover:shadow-md"
              onClick={() => setFlipped(!flipped)}
            >
              <CardContent className="py-10 text-center">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                  {flipped ? "Answer" : "Question"}
                </p>
                <p className="text-lg font-medium text-foreground whitespace-pre-wrap">
                  {flipped ? currentCard.back : currentCard.front}
                </p>
                {!flipped && (
                  <p className="text-xs text-muted-foreground mt-4">Tap to reveal</p>
                )}
              </CardContent>
            </Card>

            {flipped && (
              <div className="flex gap-2 justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReviewResponse(1)}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Again
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReviewResponse(3)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Hard
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleReviewResponse(4)}
                >
                  Good
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReviewResponse(5)}
                >
                  Easy
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Flashcards</h1>
        <p className="text-muted-foreground mt-1">
          Create and review flashcards with spaced repetition.
        </p>
      </div>

      {/* Subject filter + review button */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={startReview} disabled={dueCards.length === 0}>
          <Brain className="h-4 w-4 mr-1" />
          Review ({dueCards.length} due)
        </Button>
      </div>

      {/* Add card form */}
      {selectedSubject && selectedSubject !== "all" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> New Flashcard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Front (question)"
              value={front}
              onChange={(e) => setFront(e.target.value)}
            />
            <Textarea
              placeholder="Back (answer)"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
            />
            <Button size="sm" onClick={handleAdd} disabled={!front.trim() || !back.trim()}>
              Add Card
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Card list */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Layers className="h-4 w-4" />
          {filteredCards.length} card{filteredCards.length !== 1 ? "s" : ""}
        </h2>
        {filteredCards.map((card) => {
          const subj = subjects.find((s) => s.id === card.subject_id);
          return (
            <Card key={card.id} className="group">
              <CardContent className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{card.front}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.back}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    {subj && (
                      <span
                        className="h-2 w-2 rounded-full inline-block"
                        style={{ backgroundColor: subj.color }}
                      />
                    )}
                    {subj?.name} · Next: {new Date(card.next_review).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => removeFlashcard(card.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

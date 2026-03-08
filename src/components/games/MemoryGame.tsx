import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Timer } from "lucide-react";

const EMOJIS = ["🧠", "📚", "✏️", "🎯", "💡", "🔬", "🎓", "🌟"];

interface CardData {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(): CardData[] {
  const pairs = shuffle(EMOJIS).slice(0, 8);
  return shuffle(
    pairs.flatMap((emoji, i) => [
      { id: i * 2, emoji, flipped: false, matched: false },
      { id: i * 2 + 1, emoji, flipped: false, matched: false },
    ])
  );
}

export default function MemoryGame() {
  const [cards, setCards] = useState<CardData[]>(createCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(() => {
    const saved = localStorage.getItem("memory-best");
    return saved ? Number(saved) : null;
  });
  const lockRef = useRef(false);

  const matched = cards.filter((c) => c.matched).length;
  const won = matched === cards.length;

  useEffect(() => {
    if (!startTime || won) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, won]);

  useEffect(() => {
    if (won && moves > 0) {
      if (!bestScore || moves < bestScore) {
        setBestScore(moves);
        localStorage.setItem("memory-best", String(moves));
      }
    }
  }, [won, moves, bestScore]);

  const handleClick = useCallback(
    (id: number) => {
      if (lockRef.current) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return;
      if (!startTime) setStartTime(Date.now());

      const newSelected = [...selected, id];
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));

      if (newSelected.length === 2) {
        setMoves((m) => m + 1);
        lockRef.current = true;
        const [a, b] = newSelected;
        const ca = cards.find((c) => c.id === a)!;
        const cb = cards.find((c) => c.id === b)!;
        if (ca.emoji === cb.emoji) {
          setCards((prev) =>
            prev.map((c) => (c.id === a || c.id === b ? { ...c, matched: true, flipped: true } : c))
          );
          lockRef.current = false;
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c))
            );
            lockRef.current = false;
          }, 700);
        }
        setSelected([]);
      } else {
        setSelected(newSelected);
      }
    },
    [cards, selected, startTime]
  );

  const reset = () => {
    setCards(createCards());
    setSelected([]);
    setMoves(0);
    setStartTime(null);
    setElapsed(0);
    lockRef.current = false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" /> {elapsed}s
        </div>
        <div className="text-sm text-muted-foreground">
          Moves: <span className="font-semibold text-foreground">{moves}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Matched: <span className="font-semibold text-foreground">{matched / 2}/8</span>
        </div>
        {bestScore && (
          <div className="flex items-center gap-1.5 text-sm text-primary">
            <Trophy className="h-4 w-4" /> Best: {bestScore} moves
          </div>
        )}
        <Button variant="outline" size="sm" onClick={reset} className="ml-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Game
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleClick(card.id)}
            className={`aspect-square rounded-xl text-3xl md:text-4xl font-bold transition-all duration-300 border-2 select-none
              ${card.flipped || card.matched
                ? "bg-primary/10 border-primary/40 scale-100"
                : "bg-muted border-border hover:border-primary/30 hover:bg-muted/80 cursor-pointer"
              }
              ${card.matched ? "opacity-60" : ""}
            `}
          >
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>

      {won && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-2xl font-display font-bold text-foreground">🎉 You did it!</p>
            <p className="text-muted-foreground">
              Completed in <span className="font-semibold text-foreground">{moves} moves</span> and{" "}
              <span className="font-semibold text-foreground">{elapsed}s</span>
            </p>
            <Button onClick={reset} className="mt-2">
              <RotateCcw className="h-4 w-4 mr-2" /> Play Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

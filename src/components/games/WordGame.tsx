import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RotateCcw, Trophy, Check, X } from "lucide-react";

const WORDS = [
  "BRAIN", "STUDY", "LEARN", "FOCUS", "THINK", "SMART", "LOGIC", "SOLVE",
  "IDEAS", "NOTES", "BOOKS", "TEACH", "SKILL", "FACTS", "GUESS", "TRACK",
  "SPEED", "POWER", "DREAM", "QUEST", "LEVEL", "SCORE", "SPARK", "CRAFT",
  "BLEND", "PRIME", "FLAME", "GRACE", "LIGHT", "PULSE", "SWIFT", "VIGOR",
];

const MAX_GUESSES = 6;

function pickWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

type LetterState = "correct" | "present" | "absent" | "empty";

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(5).fill("absent");
  const answerArr = answer.split("");
  const used = Array(5).fill(false);

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answerArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === answerArr[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

const stateColors: Record<LetterState, string> = {
  correct: "bg-green-600 text-white border-green-600",
  present: "bg-yellow-500 text-white border-yellow-500",
  absent: "bg-muted text-muted-foreground border-border",
  empty: "border-border bg-background text-foreground",
};

export default function WordGame() {
  const [answer, setAnswer] = useState(pickWord);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [shakeRow, setShakeRow] = useState(-1);

  const won = guesses.length > 0 && guesses[guesses.length - 1] === answer;
  const lost = !won && guesses.length >= MAX_GUESSES;
  const gameOver = won || lost;

  const handleSubmit = useCallback(() => {
    const guess = current.toUpperCase();
    if (guess.length !== 5) {
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(-1), 500);
      return;
    }
    setGuesses((prev) => [...prev, guess]);
    setCurrent("");
  }, [current, guesses.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Backspace") {
        setCurrent((prev) => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && current.length < 5) {
        setCurrent((prev) => prev + e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, gameOver, handleSubmit]);

  const reset = () => {
    setAnswer(pickWord());
    setGuesses([]);
    setCurrent("");
  };

  // Build keyboard state
  const keyStates: Record<string, LetterState> = {};
  guesses.forEach((g) => {
    const states = evaluateGuess(g, answer);
    g.split("").forEach((letter, i) => {
      const curr = keyStates[letter];
      if (states[i] === "correct") keyStates[letter] = "correct";
      else if (states[i] === "present" && curr !== "correct") keyStates[letter] = "present";
      else if (!curr) keyStates[letter] = "absent";
    });
  });

  const keyboard = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Guesses: <span className="font-semibold text-foreground">{guesses.length}/{MAX_GUESSES}</span>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="ml-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Word
        </Button>
      </div>

      {/* Grid */}
      <div className="flex flex-col items-center gap-1.5">
        {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
          const guess = guesses[rowIdx];
          const isCurrentRow = rowIdx === guesses.length && !gameOver;
          const letters = guess
            ? guess.split("")
            : isCurrentRow
            ? current.padEnd(5, " ").split("").slice(0, 5)
            : Array(5).fill(" ");
          const states = guess ? evaluateGuess(guess, answer) : Array(5).fill("empty") as LetterState[];

          return (
            <div
              key={rowIdx}
              className={`flex gap-1.5 ${shakeRow === rowIdx ? "animate-pulse" : ""}`}
            >
              {letters.map((letter, colIdx) => (
                <div
                  key={colIdx}
                  className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-lg md:text-xl font-bold border-2 rounded-md transition-all select-none
                    ${stateColors[states[colIdx]]}
                    ${isCurrentRow && letter.trim() ? "border-foreground/40" : ""}
                  `}
                >
                  {letter.trim()}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      {!gameOver && (
        <div className="flex flex-col items-center gap-1">
          {keyboard.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {ri === 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={handleSubmit}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {row.split("").map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className={`w-8 h-10 md:w-9 p-0 text-xs font-bold ${
                    keyStates[key] ? stateColors[keyStates[key]] : ""
                  }`}
                  onClick={() => {
                    if (current.length < 5) setCurrent((prev) => prev + key);
                  }}
                >
                  {key}
                </Button>
              ))}
              {ri === 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-2 text-xs"
                  onClick={() => setCurrent((prev) => prev.slice(0, -1))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Win/Lose states */}
      {won && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-primary" /> Brilliant!
            </p>
            <p className="text-muted-foreground">
              You guessed <span className="font-semibold text-foreground">{answer}</span> in{" "}
              <span className="font-semibold text-foreground">{guesses.length}</span> tries
            </p>
            <Button onClick={reset} className="mt-2">
              <RotateCcw className="h-4 w-4 mr-2" /> Play Again
            </Button>
          </CardContent>
        </Card>
      )}

      {lost && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-2xl font-display font-bold text-foreground">Game Over</p>
            <p className="text-muted-foreground">
              The word was <span className="font-semibold text-foreground">{answer}</span>
            </p>
            <Button onClick={reset} className="mt-2">
              <RotateCcw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

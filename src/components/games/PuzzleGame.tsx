import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Trophy, Timer } from "lucide-react";

const SIZE = 4;

function createSolved(): number[] {
  return Array.from({ length: SIZE * SIZE - 1 }, (_, i) => i + 1).concat(0);
}

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  // Perform random valid moves from solved state
  let blankIdx = a.indexOf(0);
  for (let i = 0; i < 200; i++) {
    const row = Math.floor(blankIdx / SIZE);
    const col = blankIdx % SIZE;
    const moves: number[] = [];
    if (row > 0) moves.push(blankIdx - SIZE);
    if (row < SIZE - 1) moves.push(blankIdx + SIZE);
    if (col > 0) moves.push(blankIdx - 1);
    if (col < SIZE - 1) moves.push(blankIdx + 1);
    const target = moves[Math.floor(Math.random() * moves.length)];
    [a[blankIdx], a[target]] = [a[target], a[blankIdx]];
    blankIdx = target;
  }
  return a;
}

export default function PuzzleGame() {
  const [tiles, setTiles] = useState(() => shuffle(createSolved()));
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const won = tiles.every((t, i) => t === (i === SIZE * SIZE - 1 ? 0 : i + 1));

  useEffect(() => {
    if (!startTime || won) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, won]);

  const handleClick = (idx: number) => {
    if (won || tiles[idx] === 0) return;
    const blankIdx = tiles.indexOf(0);
    const row = Math.floor(idx / SIZE);
    const col = idx % SIZE;
    const blankRow = Math.floor(blankIdx / SIZE);
    const blankCol = blankIdx % SIZE;

    if (
      (Math.abs(row - blankRow) === 1 && col === blankCol) ||
      (Math.abs(col - blankCol) === 1 && row === blankRow)
    ) {
      if (!startTime) setStartTime(Date.now());
      const newTiles = [...tiles];
      [newTiles[idx], newTiles[blankIdx]] = [newTiles[blankIdx], newTiles[idx]];
      setTiles(newTiles);
      setMoves((m) => m + 1);
    }
  };

  const reset = () => {
    setTiles(shuffle(createSolved()));
    setMoves(0);
    setStartTime(null);
    setElapsed(0);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-4 space-y-1 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground text-base">How to play</p>
          <p>Tap a tile next to the empty space to slide it. Arrange all numbers 1–15 in order from left to right, top to bottom.</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" /> {elapsed}s
        </div>
        <div className="text-sm text-muted-foreground">
          Moves: <span className="font-semibold text-foreground">{moves}</span>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="ml-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Game
        </Button>
      </div>

      <div className="flex justify-center">
        <div className="inline-grid grid-cols-4 gap-1.5">
          {tiles.map((tile, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-lg text-xl md:text-2xl font-bold transition-all duration-150 select-none
                ${tile === 0
                  ? "bg-transparent"
                  : "bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 cursor-pointer text-foreground"
                }
              `}
            >
              {tile !== 0 ? tile : ""}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Slide tiles to arrange numbers 1–15 in order
      </p>

      {won && moves > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-primary" /> Puzzle Solved!
            </p>
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

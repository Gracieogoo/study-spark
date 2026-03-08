import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Trophy, Lightbulb } from "lucide-react";

type Board = (number | null)[][];

function generateSudoku(): { puzzle: Board; solution: Board } {
  const base: number[][] = [];
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Simple valid board generation using shifting pattern
  const shuffle = <T,>(a: T[]): T[] => {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const shuffled = shuffle(nums);
  for (let r = 0; r < 9; r++) {
    const row: number[] = [];
    for (let c = 0; c < 9; c++) {
      const shift = Math.floor(r / 3) + (r % 3) * 3 + c;
      row.push(shuffled[shift % 9]);
    }
    base.push(row);
  }

  const solution: Board = base.map((r) => [...r]);
  const puzzle: Board = base.map((r) => [...r]);

  // Remove ~40 cells for an easy puzzle
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i)
  ).slice(0, 40);

  for (const pos of positions) {
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    puzzle[r][c] = null;
  }

  return { puzzle, solution };
}

export default function SudokuGame() {
  const [{ puzzle, solution }] = useState(generateSudoku);
  const [board, setBoard] = useState<Board>(() => puzzle.map((r) => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);
  const [hints, setHints] = useState(3);

  const isOriginal = (r: number, c: number) => puzzle[r][c] !== null;

  const checkWin = useCallback(
    (b: Board) => {
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (b[r][c] !== solution[r][c]) return false;
      return true;
    },
    [solution]
  );

  const handleCellClick = (r: number, c: number) => {
    if (won || isOriginal(r, c)) return;
    setSelected([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (isOriginal(r, c)) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = num === 0 ? null : num;
    setBoard(newBoard);

    const newErrors = new Set(errors);
    const key = `${r}-${c}`;
    if (num !== 0 && num !== solution[r][c]) {
      newErrors.add(key);
    } else {
      newErrors.delete(key);
    }
    setErrors(newErrors);

    if (checkWin(newBoard)) setWon(true);
  };

  const useHint = () => {
    if (!selected || won || hints <= 0) return;
    const [r, c] = selected;
    if (isOriginal(r, c)) return;
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    setHints((h) => h - 1);
    const newErrors = new Set(errors);
    newErrors.delete(`${r}-${c}`);
    setErrors(newErrors);
    if (checkWin(newBoard)) setWon(true);
  };

  const reset = () => {
    const { puzzle: p, solution: s } = generateSudoku();
    setBoard(p.map((r) => [...r]));
    setSelected(null);
    setErrors(new Set());
    setWon(false);
    setHints(3);
    // Force re-render with new puzzle by using object spread trick
    Object.assign(puzzle, p);
    Object.assign(solution, s);
  };

  const getCellClass = (r: number, c: number) => {
    const isSelected = selected && selected[0] === r && selected[1] === c;
    const isError = errors.has(`${r}-${c}`);
    const isOrig = isOriginal(r, c);
    const borderR = c === 2 || c === 5 ? "border-r-2 border-r-foreground/30" : "";
    const borderB = r === 2 || r === 5 ? "border-b-2 border-b-foreground/30" : "";

    return `w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-sm md:text-base font-semibold border border-border transition-colors select-none
      ${borderR} ${borderB}
      ${isSelected ? "bg-primary/20 ring-2 ring-primary" : ""}
      ${isError ? "text-destructive bg-destructive/10" : ""}
      ${isOrig ? "text-foreground bg-muted/50" : "text-primary cursor-pointer hover:bg-accent/50"}
    `;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Errors: <span className="font-semibold text-destructive">{errors.size}</span>
        </div>
        <Button variant="outline" size="sm" onClick={useHint} disabled={hints <= 0 || !selected}>
          <Lightbulb className="h-3.5 w-3.5 mr-1.5" /> Hint ({hints})
        </Button>
        <Button variant="outline" size="sm" onClick={reset} className="ml-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Game
        </Button>
      </div>

      <div className="flex justify-center">
        <div className="inline-grid grid-cols-9 border-2 border-foreground/30 rounded-lg overflow-hidden">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                className={getCellClass(r, c)}
                onClick={() => handleCellClick(r, c)}
              >
                {cell || ""}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Button
            key={n}
            variant="outline"
            size="sm"
            className="w-9 h-9 text-base font-bold"
            onClick={() => handleNumberInput(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 text-base"
          onClick={() => handleNumberInput(0)}
        >
          ✕
        </Button>
      </div>

      {won && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-primary" /> Sudoku Complete!
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

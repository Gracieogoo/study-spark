import React from "react";
import { Gamepad2, Grid3X3, Puzzle, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MemoryGame from "@/components/games/MemoryGame";
import SudokuGame from "@/components/games/SudokuGame";
import PuzzleGame from "@/components/games/PuzzleGame";
import WordGame from "@/components/games/WordGame";

export default function BreakGamePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <Gamepad2 className="h-7 w-7 text-primary" /> Take a Break
        </h1>
        <p className="text-muted-foreground">
          Relax your mind with a quick game between study sessions.
        </p>
      </div>

      <Tabs defaultValue="memory" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memory" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Memory</span>
          </TabsTrigger>
          <TabsTrigger value="sudoku" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Grid3X3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sudoku</span>
          </TabsTrigger>
          <TabsTrigger value="puzzle" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Puzzle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Puzzle</span>
          </TabsTrigger>
          <TabsTrigger value="word" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Type className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Word</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memory">
          <MemoryGame />
        </TabsContent>
        <TabsContent value="sudoku">
          <SudokuGame />
        </TabsContent>
        <TabsContent value="puzzle">
          <PuzzleGame />
        </TabsContent>
        <TabsContent value="word">
          <WordGame />
        </TabsContent>
      </Tabs>
    </div>
  );
}

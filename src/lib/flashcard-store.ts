import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string;
  front: string;
  back: string;
  interval: number;
  ease_factor: number;
  review_count: number;
  next_review: string;
  created_at: string;
}

export function useFlashcards() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const fetchFlashcards = useCallback(async () => {
    if (!user) { setFlashcards([]); return; }
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .order("created_at", { ascending: false });
    setFlashcards((data as Flashcard[]) || []);
  }, [user]);

  useEffect(() => { fetchFlashcards(); }, [fetchFlashcards]);

  const addFlashcard = useCallback(async (subjectId: string, front: string, back: string) => {
    if (!user) return;
    await supabase.from("flashcards").insert({
      subject_id: subjectId,
      front,
      back,
      user_id: user.id,
    });
    fetchFlashcards();
  }, [user, fetchFlashcards]);

  const updateFlashcard = useCallback(async (id: string, updates: Partial<Pick<Flashcard, "interval" | "ease_factor" | "review_count" | "next_review">>) => {
    await supabase.from("flashcards").update(updates).eq("id", id);
    fetchFlashcards();
  }, [fetchFlashcards]);

  const removeFlashcard = useCallback(async (id: string) => {
    await supabase.from("flashcards").delete().eq("id", id);
    fetchFlashcards();
  }, [fetchFlashcards]);

  return { flashcards, addFlashcard, updateFlashcard, removeFlashcard };
}

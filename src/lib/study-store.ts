import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Subject = Tables<"subjects"> & { topics: Topic[] };
export type Topic = Tables<"topics">;
export type StudySession = Tables<"study_sessions">;
export type Note = Tables<"notes">;

const SUBJECT_COLORS = [
  "hsl(172, 60%, 38%)",
  "hsl(260, 50%, 55%)",
  "hsl(35, 85%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(145, 60%, 40%)",
  "hsl(15, 75%, 55%)",
  "hsl(280, 55%, 50%)",
];

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    const { data: subjectsData } = await supabase.from("subjects").select("*").order("created_at");
    const { data: topicsData } = await supabase.from("topics").select("*").order("created_at");

    const subs: Subject[] = (subjectsData || []).map((s) => ({
      ...s,
      topics: (topicsData || []).filter((t) => t.subject_id === s.id),
    }));
    setSubjects(subs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const addSubject = useCallback(async (name: string) => {
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    const { error } = await supabase.from("subjects").insert({ name, color });
    if (!error) fetchSubjects();
  }, [subjects.length, fetchSubjects]);

  const removeSubject = useCallback(async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    fetchSubjects();
  }, [fetchSubjects]);

  const addTopic = useCallback(async (subjectId: string, topicName: string) => {
    await supabase.from("topics").insert({ subject_id: subjectId, name: topicName });
    fetchSubjects();
  }, [fetchSubjects]);

  const toggleTopic = useCallback(async (subjectId: string, topicId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const topic = subject?.topics.find((t) => t.id === topicId);
    if (topic) {
      await supabase.from("topics").update({ done: !topic.done }).eq("id", topicId);
      fetchSubjects();
    }
  }, [subjects, fetchSubjects]);

  const removeTopic = useCallback(async (subjectId: string, topicId: string) => {
    await supabase.from("topics").delete().eq("id", topicId);
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, addSubject, removeSubject, addTopic, toggleTopic, removeTopic };
}

export function useSessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase.from("study_sessions").select("*").order("date", { ascending: false });
    setSessions(data || []);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const addSession = useCallback(async (session: { subjectId: string; subjectName: string; duration: number; date: string }) => {
    await supabase.from("study_sessions").insert({
      subject_id: session.subjectId,
      subject_name: session.subjectName,
      duration: session.duration,
      date: session.date,
    });
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, addSession };
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    setNotes(data || []);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(async (note: { subjectId: string; title: string; content: string }) => {
    await supabase.from("notes").insert({
      subject_id: note.subjectId,
      title: note.title,
      content: note.content,
    });
    fetchNotes();
  }, [fetchNotes]);

  const updateNote = useCallback(async (id: string, content: string) => {
    await supabase.from("notes").update({ content }).eq("id", id);
    fetchNotes();
  }, [fetchNotes]);

  const removeNote = useCallback(async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    fetchNotes();
  }, [fetchNotes]);

  return { notes, addNote, updateNote, removeNote };
}

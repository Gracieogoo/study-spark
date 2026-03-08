import { useState, useEffect, useCallback } from "react";

export interface Topic {
  id: string;
  name: string;
  done: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  topics: Topic[];
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  duration: number; // minutes
  date: string; // ISO
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  date: string; // ISO
}

const SUBJECTS_KEY = "studybuddy_subjects";
const SESSIONS_KEY = "studybuddy_sessions";
const NOTES_KEY = "studybuddy_notes";

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

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => load(SUBJECTS_KEY, []));

  useEffect(() => {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  }, [subjects]);

  const addSubject = useCallback((name: string) => {
    setSubjects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        color: SUBJECT_COLORS[prev.length % SUBJECT_COLORS.length],
        topics: [],
      },
    ]);
  }, []);

  const removeSubject = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addTopic = useCallback((subjectId: string, topicName: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: [...s.topics, { id: crypto.randomUUID(), name: topicName, done: false }] }
          : s
      )
    );
  }, []);

  const toggleTopic = useCallback((subjectId: string, topicId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.map((t) => (t.id === topicId ? { ...t, done: !t.done } : t)) }
          : s
      )
    );
  }, []);

  const removeTopic = useCallback((subjectId: string, topicId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
          : s
      )
    );
  }, []);

  return { subjects, addSubject, removeSubject, addTopic, toggleTopic, removeTopic };
}

export function useSessions() {
  const [sessions, setSessions] = useState<StudySession[]>(() => load(SESSIONS_KEY, []));

  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const addSession = useCallback((session: Omit<StudySession, "id">) => {
    setSessions((prev) => [...prev, { ...session, id: crypto.randomUUID() }]);
  }, []);

  return { sessions, addSession };
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => load(NOTES_KEY, []));

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((note: Omit<Note, "id">) => {
    setNotes((prev) => [...prev, { ...note, id: crypto.randomUUID() }]);
  }, []);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)));
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notes, addNote, updateNote, removeNote };
}

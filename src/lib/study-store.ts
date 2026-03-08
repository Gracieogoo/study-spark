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

const SUBJECTS_KEY = "studybuddy_subjects";
const SESSIONS_KEY = "studybuddy_sessions";

const SUBJECT_COLORS = [
  "hsl(16, 85%, 62%)",
  "hsl(270, 50%, 60%)",
  "hsl(165, 55%, 48%)",
  "hsl(40, 85%, 58%)",
  "hsl(200, 65%, 55%)",
  "hsl(330, 55%, 55%)",
  "hsl(120, 45%, 50%)",
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

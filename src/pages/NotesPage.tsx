import { useState, useEffect, useRef, useCallback } from "react";
import { useSubjects, useNotes } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Plus, Trash2, FileText, Save } from "lucide-react";
import { toast } from "sonner";

// Extend window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export default function NotesPage() {
  const { subjects } = useSubjects();
  const { notes, addNote, updateNote, removeNote } = useNotes();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      // Append finalized results
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        setContent((prev) => (prev ? prev + " " + lastResult[0].transcript : lastResult[0].transcript));
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Listening... speak now!");
    }
  }, [isListening]);

  const handleSave = () => {
    if (!selectedSubject || !title.trim() || !content.trim()) {
      toast.error("Please select a subject, add a title, and write some content.");
      return;
    }
    if (editingId) {
      updateNote(editingId, content);
      toast.success("Note updated!");
      setEditingId(null);
    } else {
      addNote({
        subjectId: selectedSubject,
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString(),
      });
      toast.success("Note saved!");
    }
    setTitle("");
    setContent("");
  };

  const handleEdit = (note: typeof notes[0]) => {
    setEditingId(note.id);
    setSelectedSubject(note.subjectId);
    setTitle(note.title);
    setContent(note.content);
  };

  const filteredNotes = selectedSubject
    ? notes.filter((n) => n.subjectId === selectedSubject)
    : notes;

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || "Unknown";
  const getSubjectColor = (id: string) => subjects.find((s) => s.id === id)?.color || "hsl(var(--primary))";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Class Notes</h1>
        <p className="text-muted-foreground mt-1">
          Type or use voice-to-text to capture your class notes. Use them to generate quizzes!
        </p>
      </div>

      {/* Note Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            {editingId ? "Edit Note" : "New Note"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select subject..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="relative">
            <Textarea
              placeholder="Start typing your notes here, or click the mic to dictate..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none pr-12"
            />
            {supported && (
              <Button
                size="icon"
                variant={isListening ? "destructive" : "secondary"}
                className="absolute bottom-3 right-3 h-8 w-8"
                onClick={toggleListening}
                title={isListening ? "Stop recording" : "Start voice recording"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              Listening — speak clearly into your microphone...
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!selectedSubject || !title.trim() || !content.trim()}>
              <Save className="h-4 w-4 mr-1" />
              {editingId ? "Update Note" : "Save Note"}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={() => { setEditingId(null); setTitle(""); setContent(""); }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Notes */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-3">
          Saved Notes {filteredNotes.length > 0 && `(${filteredNotes.length})`}
        </h2>

        {filteredNotes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p>No notes yet. Start taking notes above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredNotes
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((note) => (
                <Card key={note.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleEdit(note)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getSubjectColor(note.subjectId) }} />
                        <span className="text-xs text-muted-foreground">{getSubjectName(note.subjectId)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); removeNote(note.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-sm font-display">{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.date).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

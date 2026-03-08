import { useState } from "react";
import { useSubjects } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SubjectsPage() {
  const { subjects, addSubject, removeSubject, addTopic, toggleTopic, removeTopic } = useSubjects();
  const [newSubject, setNewSubject] = useState("");
  const [newTopics, setNewTopics] = useState<Record<string, string>>({});

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    addSubject(newSubject.trim());
    setNewSubject("");
  };

  const handleAddTopic = (subjectId: string) => {
    const name = newTopics[subjectId]?.trim();
    if (!name) return;
    addTopic(subjectId, name);
    setNewTopics((p) => ({ ...p, [subjectId]: "" }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Subjects & Topics</h1>
        <p className="text-muted-foreground mt-1">Track what you're studying and mark topics as complete.</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a new subject..."
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
          className="max-w-sm"
        />
        <Button onClick={handleAddSubject} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Subject
        </Button>
      </div>

      {subjects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mb-3 opacity-40" />
            <p>No subjects yet. Add your first subject above!</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {subjects.map((subject) => {
          const done = subject.topics.filter((t) => t.done).length;
          const total = subject.topics.length;
          const pct = total > 0 ? (done / total) * 100 : 0;

          return (
            <Card key={subject.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                    <CardTitle className="text-lg font-display">{subject.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeSubject(subject.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {total > 0 && (
                  <div className="space-y-1 mt-2">
                    <Progress value={pct} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{done}/{total} topics complete</p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {subject.topics.map((topic) => (
                  <div key={topic.id} className="flex items-center gap-2 group">
                    <Checkbox checked={topic.done} onCheckedChange={() => toggleTopic(subject.id, topic.id)} />
                    <span className={`flex-1 text-sm ${topic.done ? "line-through text-muted-foreground" : ""}`}>
                      {topic.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={() => removeTopic(subject.id, topic.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add topic..."
                    value={newTopics[subject.id] || ""}
                    onChange={(e) => setNewTopics((p) => ({ ...p, [subject.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTopic(subject.id)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" variant="secondary" className="h-8" onClick={() => handleAddTopic(subject.id)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo, useCallback } from "react";
import { useSubjects, useSessions, useNotes } from "@/lib/study-store";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  FileText,
  BrainCircuit,
  Timer,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Flame,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const { sessions } = useSessions();
  const { notes } = useNotes();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().slice(0, 10);

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date.slice(0, 10) === todayStr),
    [sessions, todayStr]
  );

  const todayMinutes = useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.duration, 0),
    [todaySessions]
  );

  const totalTopics = useMemo(
    () => subjects.reduce((sum, s) => sum + s.topics.length, 0),
    [subjects]
  );

  const completedTopics = useMemo(
    () => subjects.reduce((sum, s) => sum + s.topics.filter((t) => t.done).length, 0),
    [subjects]
  );

  const recentNotes = useMemo(() => notes.slice(0, 3), [notes]);

  const studyStreak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const uniqueDays = new Set(sessions.map((s) => s.date.slice(0, 10)));
    const sortedDays = Array.from(uniqueDays).sort().reverse();
    
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    
    // Streak must include today or yesterday
    if (!uniqueDays.has(todayStr) && !uniqueDays.has(yesterdayStr)) return 0;
    
    let streak = 0;
    const startDate = uniqueDays.has(todayStr) ? today : new Date(today.getTime() - 86400000);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(startDate.getTime() - i * 86400000).toISOString().slice(0, 10);
      if (uniqueDays.has(checkDate)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [sessions]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = user?.email?.split("@")[0] ?? "Student";

  const suggestions = useMemo(() => {
    const items: { label: string; description: string; icon: typeof BookOpen; path: string }[] = [];
    if (subjects.length === 0) {
      items.push({
        label: "Create your first subject",
        description: "Add a subject to start organizing your study material",
        icon: BookOpen,
        path: "/subjects",
      });
    }
    if (notes.length === 0) {
      items.push({
        label: "Write your first note",
        description: "Capture key concepts with text or voice-to-text",
        icon: FileText,
        path: "/notes",
      });
    }
    if (todayMinutes === 0) {
      items.push({
        label: "Start a study session",
        description: "Use the Pomodoro timer to stay focused",
        icon: Timer,
        path: "/pomodoro",
      });
    }
    if (subjects.length > 0) {
      items.push({
        label: "Take an AI quiz",
        description: "Test your knowledge with AI-generated questions",
        icon: BrainCircuit,
        path: "/quiz",
      });
    }
    if (subjects.length > 0 && completedTopics < totalTopics) {
      items.push({
        label: "Review your progress",
        description: `${completedTopics}/${totalTopics} topics completed — keep going!`,
        icon: TrendingUp,
        path: "/progress",
      });
    }
    return items.slice(0, 3);
  }, [subjects, notes, todayMinutes, completedTopics, totalTopics]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero greeting */}
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          {greeting}, <span className="text-gradient-brand">{displayName}</span>
          <Sparkles className="h-6 w-6 text-primary/70" />
        </h1>
        <p className="text-muted-foreground">Here's your study overview for today.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Flame} label="Study streak" value={`${studyStreak} day${studyStreak !== 1 ? "s" : ""}`} highlight={studyStreak >= 3} />
        <StatCard icon={Clock} label="Study today" value={`${todayMinutes} min`} />
        <StatCard icon={Timer} label="Sessions today" value={String(todaySessions.length)} />
        <StatCard icon={BookOpen} label="Subjects" value={String(subjects.length)} />
        <StatCard
          icon={TrendingUp}
          label="Topics done"
          value={totalTopics > 0 ? `${Math.round((completedTopics / totalTopics) * 100)}%` : "—"}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Recent Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet. Start capturing ideas!</p>
            ) : (
              recentNotes.map((note) => {
                const subj = subjects.find((s) => s.id === note.subject_id);
                return (
                  <button
                    key={note.id}
                    onClick={() => navigate("/notes")}
                    className="w-full text-left rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/60 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      {subj && (
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: subj.color }}
                        />
                      )}
                      {subj?.name ?? "Unknown"} ·{" "}
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })
            )}
            {notes.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary"
                onClick={() => navigate("/notes")}
              >
                View all notes <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Suggested actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Suggested Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">You're all caught up! 🎉</p>
            ) : (
              suggestions.map((s) => (
                <button
                  key={s.path + s.label}
                  onClick={() => navigate(s.path)}
                  className="w-full text-left rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/60 transition-colors flex items-start gap-3"
                >
                  <s.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${highlight ? "border-primary/50 bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${highlight ? "bg-primary/20" : "bg-primary/10"}`}>
            <Icon className={`h-5 w-5 ${highlight ? "text-primary" : "text-primary"}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useSessions, useSubjects } from "@/lib/study-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, BookOpen, TrendingUp } from "lucide-react";

export default function ProgressPage() {
  const { sessions } = useSessions();
  const { subjects } = useSubjects();

  const totalMinutes = sessions.reduce((a, s) => a + s.duration, 0);
  const totalSessions = sessions.length;

  // Per-subject data
  const subjectMap = new Map<string, { name: string; minutes: number; color: string }>();
  sessions.forEach((s) => {
    const existing = subjectMap.get(s.subjectId);
    const sub = subjects.find((x) => x.id === s.subjectId);
    const color = sub?.color || "hsl(var(--primary))";
    if (existing) {
      existing.minutes += s.duration;
    } else {
      subjectMap.set(s.subjectId, { name: s.subjectName, minutes: s.duration, color });
    }
  });
  const subjectData = Array.from(subjectMap.values());

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const mins = sessions
      .filter((s) => new Date(s.date).toDateString() === dateStr)
      .reduce((a, s) => a + s.duration, 0);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      minutes: mins,
    };
  });

  const topicsComplete = subjects.reduce((a, s) => a + s.topics.filter((t) => t.done).length, 0);
  const topicsTotal = subjects.reduce((a, s) => a + s.topics.length, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Progress Dashboard</h1>
        <p className="text-muted-foreground mt-1">See how your study sessions are stacking up.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{totalMinutes}</p>
              <p className="text-xs text-muted-foreground">Total Minutes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{topicsComplete}/{topicsTotal}</p>
              <p className="text-xs text-muted-foreground">Topics Complete</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={last7}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip formatter={(v: number) => [`${v} min`, "Study time"]} />
                <Bar dataKey="minutes" fill="hsl(16, 85%, 62%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Time by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Complete some Pomodoro sessions to see data here.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={subjectData} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {subjectData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} min`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

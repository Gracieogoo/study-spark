import { useState, useEffect, useRef, useCallback } from "react";
import { useSubjects, useSessions } from "@/lib/study-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function PomodoroPage() {
  const { subjects } = useSubjects();
  const { sessions, addSession } = useSessions();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalMinutes = isBreak ? BREAK_MINUTES : WORK_MINUTES;
  const progress = ((totalMinutes * 60 - secondsLeft) / (totalMinutes * 60)) * 100;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const completeSession = useCallback(() => {
    if (!isBreak && selectedSubject) {
      const sub = subjects.find((s) => s.id === selectedSubject);
      if (sub) {
        addSession({
          subjectId: sub.id,
          subjectName: sub.name,
          duration: WORK_MINUTES,
          date: new Date().toISOString(),
        });
        toast.success(`${WORK_MINUTES}min session logged for ${sub.name}!`);
      }
    }
  }, [isBreak, selectedSubject, subjects, addSession]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          completeSession();
          // Switch mode
          setIsBreak((b) => !b);
          return isBreak ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isBreak, completeSession]);

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSecondsLeft(WORK_MINUTES * 60);
  };

  const todaySessions = sessions.filter(
    (s) => new Date(s.date).toDateString() === new Date().toDateString()
  );
  const todayMinutes = todaySessions.reduce((a, s) => a + s.duration, 0);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Pomodoro Timer</h1>
        <p className="text-muted-foreground mt-1">Focus for 25 minutes, then take a 5 minute break.</p>
      </div>

      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
        <SelectTrigger>
          <SelectValue placeholder="Select a subject to study..." />
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

      <Card>
        <CardContent className="flex flex-col items-center py-10">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {isBreak ? "Break Time" : "Focus Time"}
          </p>

          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={isBreak ? "hsl(var(--success))" : "hsl(var(--primary))"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-display font-bold tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              disabled={!selectedSubject && !isBreak}
            >
              {isRunning ? <Pause className="h-5 w-5 mr-1" /> : <Play className="h-5 w-5 mr-1" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button size="lg" variant="secondary" onClick={reset}>
              <RotateCcw className="h-5 w-5 mr-1" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="font-medium">Today:</span>
            <span className="text-muted-foreground">
              {todaySessions.length} session{todaySessions.length !== 1 ? "s" : ""} · {todayMinutes} min
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

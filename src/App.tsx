import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import SubjectsPage from "@/pages/SubjectsPage";
import NotesPage from "@/pages/NotesPage";
import PomodoroPage from "@/pages/PomodoroPage";
import ProgressPage from "@/pages/ProgressPage";
import QuizPage from "@/pages/QuizPage";
import PdfStudyPage from "@/pages/PdfStudyPage";
import FlashcardsPage from "@/pages/FlashcardsPage";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-display">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/pomodoro" element={<PomodoroPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/pdf-study" element={<PdfStudyPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AuthRouteGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRouteGuard />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

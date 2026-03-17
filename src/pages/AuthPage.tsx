import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import neuralLogo from "@/assets/neural-logo.png";
import { Loader2, ArrowLeft, Eye, EyeOff, Github } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type AuthView = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<AuthView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    if (view === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset link sent! Check your email.");
        setView("signin");
      }
      setLoading(false);
      return;
    }

    if (!password) { setLoading(false); return; }

    const { error } = view === "signup"
      ? await signUp(email, password, displayName.trim() || undefined)
      : await signIn(email, password);

    if (error) {
      console.error("Auth error details:", error);
      toast.error(error.message);
    } else if (view === "signup") {
      toast.success("Account created! Check your email to verify.");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <img src={neuralLogo} alt="Neural Guide" className="h-16 w-16 mx-auto" />
          <CardTitle className="text-2xl font-display text-gradient-brand">
            Neural Guide
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {view === "signup" ? "Create your account" : view === "forgot" ? "Reset your password" : "Sign in to your dashboard"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {view !== "forgot" && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full bg-black text-white hover:bg-slate-900 border-black shadow-sm transition-all duration-300 font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 border-slate-800 transition-colors"
                  onClick={handleGithubSignIn}
                  disabled={loading}
                >
                  <Github className="mr-2 h-5 w-5" />
                  Sign in with GitHub
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {view === "signup" && (
                <Input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {view !== "forgot" && (
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {view === "signup" ? "Sign Up" : view === "forgot" ? "Send Reset Link" : "Sign In"}
              </Button>
            </form>
          </div>

          {view === "signin" && (
            <button
              onClick={() => setView("forgot")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-primary mt-3"
            >
              Forgot password?
            </button>
          )}

          {view === "forgot" ? (
            <button
              onClick={() => setView("signin")}
              className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-primary mt-4"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </button>
          ) : (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {view === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setView(view === "signup" ? "signin" : "signup")}
                className="text-primary hover:underline font-medium"
              >
                {view === "signup" ? "Sign In" : "Sign Up"}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

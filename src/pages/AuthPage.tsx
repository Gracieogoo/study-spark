import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import neuralLogo from "@/assets/neural-logo.png";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
      toast.error(error.message);
    } else if (view === "signup") {
      toast.success("Account created! Check your email to verify.");
    }
    setLoading(false);
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

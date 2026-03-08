import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import neuralLogo from "@/assets/neural-logo.png";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase redirects with hash containing type=recovery
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      // Not a valid recovery link — redirect
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/", { replace: true }), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <img src={neuralLogo} alt="Neural Guide" className="h-16 w-16 mx-auto" />
          <CardTitle className="text-2xl font-display text-gradient-brand">
            Set New Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm text-muted-foreground">Password updated! Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

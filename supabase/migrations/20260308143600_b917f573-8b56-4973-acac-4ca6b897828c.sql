
CREATE TABLE public.quiz_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'topic',
  source_name TEXT NOT NULL DEFAULT '',
  questions JSONB NOT NULL,
  score INTEGER,
  total INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz history" ON public.quiz_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quiz history" ON public.quiz_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own quiz history" ON public.quiz_history FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz history" ON public.quiz_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);

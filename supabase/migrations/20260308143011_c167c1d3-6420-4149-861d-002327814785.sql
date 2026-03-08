
CREATE TABLE public.pdf_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdf_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pdf history" ON public.pdf_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pdf history" ON public.pdf_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pdf history" ON public.pdf_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

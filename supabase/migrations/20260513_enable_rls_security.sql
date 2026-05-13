-- Activăm RLS pe tabelele expuse public pentru a asigura securitatea și a elimina avertismentele din Supabase
ALTER TABLE IF EXISTS public.happy_hour_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations ENABLE ROW LEVEL SECURITY;

-- Opțional: Dacă dorim ca aceste tabele să fie complet izolate din exterior (accesibile doar prin backend-ul nostru care folosește service_role key), 
-- NU adăugăm nicio politică. Lipsa unei politici + RLS activat = acces blocat complet pentru cheile publice anonime.
-- Backend-ul nostru nu este afectat deoarece folosește cheia `service_role`.

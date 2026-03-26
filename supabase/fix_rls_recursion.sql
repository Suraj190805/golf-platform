-- =============================================
-- FIX: Infinite recursion in RLS policies
-- Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Admins can insert charities" ON public.charities;
DROP POLICY IF EXISTS "Admins can update charities" ON public.charities;
DROP POLICY IF EXISTS "Admins can delete charities" ON public.charities;

DROP POLICY IF EXISTS "Admins can view all scores" ON public.scores;
DROP POLICY IF EXISTS "Admins can update all scores" ON public.scores;

DROP POLICY IF EXISTS "Admins can manage draws" ON public.draws;
DROP POLICY IF EXISTS "Admins can manage draw results" ON public.draw_results;
DROP POLICY IF EXISTS "Admins can manage verifications" ON public.winner_verifications;

-- Step 2: Create a secure function to check admin status (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 3: Recreate profiles policies (no recursion)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Step 4: Recreate charities admin policies
CREATE POLICY "Admins can insert charities" ON public.charities
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update charities" ON public.charities
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete charities" ON public.charities
  FOR DELETE USING (public.is_admin());

-- Step 5: Recreate scores admin policies
CREATE POLICY "Admins can view all scores" ON public.scores
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all scores" ON public.scores
  FOR UPDATE USING (public.is_admin());

-- Step 6: Recreate draws admin policy
CREATE POLICY "Admins can manage draws" ON public.draws
  FOR ALL USING (public.is_admin());

-- Step 7: Recreate draw_results admin policy
CREATE POLICY "Admins can manage draw results" ON public.draw_results
  FOR ALL USING (public.is_admin());

-- Step 8: Recreate winner_verifications admin policy
CREATE POLICY "Admins can manage verifications" ON public.winner_verifications
  FOR ALL USING (public.is_admin());

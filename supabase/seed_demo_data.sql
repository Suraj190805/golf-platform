-- =============================================
-- SEED DEMO DATA: Make user admin + seed draw
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Make your user an admin (replace email if different)
UPDATE public.profiles
SET is_admin = true
WHERE email = 'johngowda123@gmail.com';

-- 2. Create a published draw for the current month
INSERT INTO public.draws (draw_date, draw_month, status, draw_type, winning_numbers, prize_pool_total, jackpot_rollover, published_at)
VALUES (
  CURRENT_DATE,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
  'published',
  'random',
  ARRAY[32, 17, 44, 9, 28],
  250.00,
  0,
  NOW()
);

-- 3. Create a draw result for your user (3-match = 25% of pool)
INSERT INTO public.draw_results (draw_id, user_id, user_scores, matched_count, prize_amount)
SELECT
  d.id,
  p.id,
  ARRAY[32, 41, 44, 34, 12],
  3,
  62.50
FROM public.draws d, public.profiles p
WHERE d.draw_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  AND p.email = 'johngowda123@gmail.com'
LIMIT 1;

-- 4. Create a second (older) draw from last month
INSERT INTO public.draws (draw_date, draw_month, status, draw_type, winning_numbers, prize_pool_total, jackpot_rollover, published_at)
VALUES (
  CURRENT_DATE - INTERVAL '30 days',
  TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'YYYY-MM'),
  'published',
  'algorithmic',
  ARRAY[12, 38, 22, 41, 5],
  180.00,
  70.00,
  NOW() - INTERVAL '30 days'
);

-- 5. Result for last month (4-match = 35% of pool)
INSERT INTO public.draw_results (draw_id, user_id, user_scores, matched_count, prize_amount)
SELECT
  d.id,
  p.id,
  ARRAY[32, 41, 44, 34, 12],
  4,
  87.50
FROM public.draws d, public.profiles p
WHERE d.draw_month = TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'YYYY-MM')
  AND p.email = 'johngowda123@gmail.com'
LIMIT 1;

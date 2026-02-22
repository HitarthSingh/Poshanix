-- ============================================================
-- Add onboarding / health-profile columns to profiles table
-- ============================================================

alter table public.profiles
  add column if not exists age                  smallint,
  add column if not exists gender               text
    check (gender in ('male', 'female')),
  add column if not exists weight               numeric(6,2),
  add column if not exists weight_unit          text default 'kg'
    check (weight_unit in ('kg', 'lbs')),
  add column if not exists height               numeric(6,2),
  add column if not exists height_unit          text default 'cm'
    check (height_unit in ('cm', 'ft')),
  add column if not exists bmi                  numeric(4,1),
  add column if not exists bmr                  smallint,
  add column if not exists water_intake         text
    check (water_intake in ('1-2L', '2-3L', '3L+')),
  add column if not exists eating_habits        text
    check (eating_habits in ('1_meal', '2_meals', '3_meals', '3+_meals')),
  add column if not exists has_medical_history  boolean,
  add column if not exists medical_doc_url      text,
  add column if not exists food_allergies       text,
  add column if not exists workout_level        text
    check (workout_level in ('none', 'moderate', 'high')),
  add column if not exists onboarding_completed boolean not null default false;
  add column if not exists height      numeric(6,2),
  add column if not exists height_unit text default 'cm'
    check (height_unit in ('cm', 'ft')),
  add column if not exists gender      text
    check (gender in ('male', 'female')),
  add column if not exists bmi         numeric(4,1),
  add column if not exists bmr         smallint;

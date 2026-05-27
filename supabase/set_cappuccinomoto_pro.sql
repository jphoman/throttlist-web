-- Grant Pro status to the @cappuccinomoto seed account.
-- Run once in the Supabase SQL editor.
update public.profiles
set is_pro = true
where username = 'cappuccinomoto';

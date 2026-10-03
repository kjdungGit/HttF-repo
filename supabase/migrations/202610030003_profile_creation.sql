-- Apply to the original public.profiles schema before tax-form migrations.
-- Auth creation and retries preserve existing user data.
begin;
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
 insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
 for each row execute function public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;
commit;

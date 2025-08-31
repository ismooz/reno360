-- Create trigger to link new auth users to profiles and existing renovation requests
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
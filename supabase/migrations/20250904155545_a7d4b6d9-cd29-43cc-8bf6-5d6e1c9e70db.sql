-- Corriger la fonction handle_new_user pour ajouter search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  
  -- Link existing requests to the new user account based on email
  UPDATE public.renovation_requests
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$function$;
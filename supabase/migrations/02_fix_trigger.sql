-- Drop the existing trigger and function to recreate them robustly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- We use EXISTS to quickly check if table is empty
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, 'sin-correo@ecommerce.com'), 
    CASE WHEN is_first_user THEN 'administrador'::public.user_role ELSE 'cliente'::public.user_role END
  );
  
  RETURN NEW;
EXCEPTION 
  -- If something fails, we catch it and allow the signup to proceed, logging the error internally
  WHEN OTHERS THEN
    RAISE LOG 'Error on profile creation trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

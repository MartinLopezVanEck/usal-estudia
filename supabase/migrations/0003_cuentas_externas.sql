-- Cuentas que no son @usal.edu.ar pero pueden ingresar (ej. el mail personal de un admin).
-- Ejecutar en el SQL Editor después de 0002_permisos.sql.

create table cuentas_externas (
  email text primary key check (email = lower(email)),
  rol rol_usuario not null default 'admin',
  created_at timestamptz not null default now()
);

-- Solo el servidor (service role) la lee y la modifica.
alter table cuentas_externas enable row level security;
grant all on cuentas_externas to service_role;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol_inicial rol_usuario := 'alumno';
begin
  if lower(new.email) not like '%@usal.edu.ar' then
    select rol into rol_inicial from cuentas_externas where email = lower(new.email);
    if not found then
      raise exception 'Solo se permiten cuentas @usal.edu.ar';
    end if;
  end if;

  insert into profiles (id, email, nombre, avatar_url, rol)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    rol_inicial
  );
  return new;
end;
$$;

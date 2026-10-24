-- Usal Estudia: esquema inicial
-- Ejecutar completo en el SQL Editor de Supabase.

create extension if not exists unaccent;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type rol_usuario as enum ('alumno', 'admin');
create type estado_revision as enum ('pendiente', 'aprobado', 'rechazado');
create type cuatrimestre as enum ('primero', 'segundo', 'anual');
create type tipo_material as enum (
  'parcial', 'final', 'apunte', 'guia_resuelta', 'resumen', 'tp', 'presentacion', 'otro'
);

-- ---------------------------------------------------------------------------
-- Perfiles (1 a 1 con auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nombre text not null,
  avatar_url text,
  rol rol_usuario not null default 'alumno',
  created_at timestamptz not null default now()
);

-- Solo se permiten cuentas @usal.edu.ar: si el mail no es del dominio,
-- el alta en auth.users falla y el login se rechaza.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) not like '%@usal.edu.ar' then
    raise exception 'Solo se permiten cuentas @usal.edu.ar';
  end if;

  insert into profiles (id, email, nombre, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and rol = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Catálogo: carreras, materias (compartibles entre carreras), profesores
-- ---------------------------------------------------------------------------
create table carreras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  estado estado_revision not null default 'pendiente',
  creado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table materias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  estado estado_revision not null default 'pendiente',
  creado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- En qué año/cuatrimestre se cursa cada materia dentro de cada carrera
create table plan_materias (
  carrera_id uuid not null references carreras (id) on delete cascade,
  materia_id uuid not null references materias (id) on delete cascade,
  anio smallint not null check (anio between 1 and 7),
  cuatrimestre cuatrimestre not null default 'anual',
  primary key (carrera_id, materia_id)
);
create index on plan_materias (materia_id);

create table profesores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  estado estado_revision not null default 'pendiente',
  creado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Cátedras: qué profesores dictan cada materia
create table catedras (
  materia_id uuid not null references materias (id) on delete cascade,
  profesor_id uuid not null references profesores (id) on delete cascade,
  primary key (materia_id, profesor_id)
);
create index on catedras (profesor_id);

-- ---------------------------------------------------------------------------
-- Archivos
-- ---------------------------------------------------------------------------
create table archivos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  tipo tipo_material not null,
  materia_id uuid not null references materias (id) on delete restrict,
  profesor_id uuid references profesores (id) on delete set null,
  anio_cursada smallint check (anio_cursada between 1990 and 2100),
  storage_key text not null unique,
  nombre_original text not null,
  mime text,
  tamano bigint not null,
  anonimo boolean not null default false,
  estado estado_revision not null default 'pendiente',
  motivo_rechazo text,
  subido_por uuid references profiles (id) on delete set null,
  revisado_por uuid references profiles (id) on delete set null,
  revisado_at timestamptz,
  created_at timestamptz not null default now()
);
create index on archivos (materia_id, estado);
create index on archivos (subido_por);
create index on archivos (estado);

-- ---------------------------------------------------------------------------
-- Seguridad (RLS)
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table carreras enable row level security;
alter table materias enable row level security;
alter table plan_materias enable row level security;
alter table profesores enable row level security;
alter table catedras enable row level security;
alter table archivos enable row level security;

-- Perfiles: cada uno ve el suyo, los admins ven todos. Los cambios de rol
-- se hacen desde el servidor con la service role.
create policy "ver perfil propio o admin" on profiles
  for select to authenticated using (id = auth.uid() or is_admin());

-- Catálogo: se ve lo aprobado, lo propio y todo si sos admin.
-- Las altas/ediciones se hacen desde el servidor (service role), que valida.
create policy "ver carreras" on carreras for select to authenticated
  using (estado = 'aprobado' or creado_por = auth.uid() or is_admin());
create policy "ver materias" on materias for select to authenticated
  using (estado = 'aprobado' or creado_por = auth.uid() or is_admin());
create policy "ver profesores" on profesores for select to authenticated
  using (estado = 'aprobado' or creado_por = auth.uid() or is_admin());
create policy "ver plan" on plan_materias for select to authenticated using (true);
create policy "ver catedras" on catedras for select to authenticated using (true);

-- Archivos: sin políticas directas. Los alumnos leen a través de la vista
-- archivos_visibles (que oculta el autor de los anónimos) y todas las
-- escrituras pasan por el servidor.
revoke all on archivos from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vista de lectura de archivos
-- ---------------------------------------------------------------------------
create or replace view archivos_visibles as
select
  a.id,
  a.titulo,
  a.descripcion,
  a.tipo,
  a.materia_id,
  m.nombre as materia_nombre,
  m.slug as materia_slug,
  a.profesor_id,
  p.nombre as profesor_nombre,
  a.anio_cursada,
  a.nombre_original,
  a.mime,
  a.tamano,
  a.anonimo,
  a.estado,
  a.motivo_rechazo,
  a.created_at,
  (a.subido_por = auth.uid()) as es_mio,
  case
    when a.anonimo and not is_admin() and a.subido_por is distinct from auth.uid() then null
    else u.nombre
  end as autor_nombre,
  case when is_admin() then u.email else null end as autor_email,
  lower(unaccent(
    a.titulo || ' ' || coalesce(a.descripcion, '') || ' ' || m.nombre || ' ' ||
    coalesce(p.nombre, '') || ' ' || a.nombre_original
  )) as busqueda
from archivos a
join materias m on m.id = a.materia_id
left join profesores p on p.id = a.profesor_id
left join profiles u on u.id = a.subido_por
where auth.uid() is not null
  and (a.estado = 'aprobado' or a.subido_por = auth.uid() or is_admin());

revoke all on archivos_visibles from anon;
grant select on archivos_visibles to authenticated;

-- Mis materias, "Me sirvió" y reportes de archivos.
-- Ejecutar en el SQL Editor después de 0004_seguridad.sql.

-- ---------------------------------------------------------------------------
-- Mis materias: las que cada alumno fija para tenerlas a mano
-- ---------------------------------------------------------------------------
create table materias_fijadas (
  usuario_id uuid not null references profiles (id) on delete cascade,
  materia_id uuid not null references materias (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, materia_id)
);
create index on materias_fijadas (materia_id);

alter table materias_fijadas enable row level security;
create policy "ver mis materias" on materias_fijadas for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "fijar materia" on materias_fijadas for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "quitar materia" on materias_fijadas for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- "Me sirvió": un voto por alumno y archivo
-- ---------------------------------------------------------------------------
create table archivo_votos (
  archivo_id uuid not null references archivos (id) on delete cascade,
  usuario_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (archivo_id, usuario_id)
);
create index on archivo_votos (usuario_id);

alter table archivo_votos enable row level security;
create policy "ver mis votos" on archivo_votos for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "votar" on archivo_votos for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "quitar voto" on archivo_votos for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Total de votos por archivo, sin exponer quién votó.
-- Es security definer a propósito (igual que archivos_visibles): los alumnos
-- solo pueden leer sus propios votos, pero el total lo ven todos.
create or replace view archivo_votos_conteo as
select v.archivo_id, a.materia_id, count(*)::int as votos
from archivo_votos v
join archivos a on a.id = v.archivo_id
where a.estado = 'aprobado'
group by v.archivo_id, a.materia_id;

revoke all on archivo_votos_conteo from anon;
grant select on archivo_votos_conteo to authenticated;

-- ---------------------------------------------------------------------------
-- Reportes de archivos (los ve y resuelve un admin)
-- ---------------------------------------------------------------------------
create type motivo_reporte as enum ('materia_incorrecta', 'ilegible', 'duplicado', 'inapropiado', 'otro');

create table reportes (
  id uuid primary key default gen_random_uuid(),
  archivo_id uuid not null references archivos (id) on delete cascade,
  usuario_id uuid references profiles (id) on delete set null,
  motivo motivo_reporte not null,
  detalle text check (char_length(detalle) <= 500),
  resuelto boolean not null default false,
  created_at timestamptz not null default now()
);
create index on reportes (resuelto);

-- Sin políticas: todo pasa por el servidor (service role), que valida.
alter table reportes enable row level security;
revoke all on reportes from anon, authenticated;

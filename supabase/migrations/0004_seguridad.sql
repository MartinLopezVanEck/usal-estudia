-- Ajustes del Security Advisor de Supabase.
-- Ejecutar en el SQL Editor después de 0003_cuentas_externas.sql.

-- ---------------------------------------------------------------------------
-- unaccent fuera del esquema public
-- ---------------------------------------------------------------------------
create schema if not exists extensions;
alter extension unaccent set schema extensions;

-- ---------------------------------------------------------------------------
-- Funciones internas en un esquema que la API no expone
-- ---------------------------------------------------------------------------
create schema if not exists privado;
grant usage on schema privado to authenticated, service_role;

alter function public.is_admin() set schema privado;
alter function public.handle_new_user() set schema privado;

-- La función del trigger no la llama nadie directamente.
revoke execute on function privado.handle_new_user() from public, anon, authenticated;
-- is_admin la usan las políticas RLS, que se evalúan como el usuario logueado.
revoke execute on function privado.is_admin() from public, anon;
grant execute on function privado.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Políticas: (select ...) hace que se evalúe una vez por consulta y no por fila
-- ---------------------------------------------------------------------------
drop policy "ver perfil propio o admin" on profiles;
create policy "ver perfil propio o admin" on profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select privado.is_admin()));

drop policy "ver carreras" on carreras;
create policy "ver carreras" on carreras for select to authenticated
  using (estado = 'aprobado' or creado_por = (select auth.uid()) or (select privado.is_admin()));

drop policy "ver materias" on materias;
create policy "ver materias" on materias for select to authenticated
  using (estado = 'aprobado' or creado_por = (select auth.uid()) or (select privado.is_admin()));

drop policy "ver profesores" on profesores;
create policy "ver profesores" on profesores for select to authenticated
  using (estado = 'aprobado' or creado_por = (select auth.uid()) or (select privado.is_admin()));

-- ---------------------------------------------------------------------------
-- Vista de archivos (misma definición, con las referencias nuevas).
-- Es security definer a propósito: filtra por usuario en el WHERE y oculta
-- el autor de los anónimos, cosa que RLS no puede hacer por columna.
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
    when a.anonimo and not privado.is_admin() and a.subido_por is distinct from auth.uid() then null
    else u.nombre
  end as autor_nombre,
  case when privado.is_admin() then u.email else null end as autor_email,
  lower(extensions.unaccent(
    'extensions.unaccent'::regdictionary,
    a.titulo || ' ' || coalesce(a.descripcion, '') || ' ' || m.nombre || ' ' ||
    coalesce(p.nombre, '') || ' ' || a.nombre_original
  )) as busqueda
from archivos a
join materias m on m.id = a.materia_id
left join profesores p on p.id = a.profesor_id
left join profiles u on u.id = a.subido_por
where auth.uid() is not null
  and (a.estado = 'aprobado' or a.subido_por = auth.uid() or privado.is_admin());

revoke all on archivos_visibles from anon;
grant select on archivos_visibles to authenticated;

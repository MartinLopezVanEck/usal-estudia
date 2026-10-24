-- Permisos explícitos: los proyectos nuevos de Supabase no exponen
-- automáticamente las tablas creadas por SQL a la API.
-- Ejecutar en el SQL Editor después de 0001_init.sql.

grant usage on schema public to anon, authenticated, service_role;

-- El servidor (service role) hace todas las escrituras.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to authenticated, service_role;

-- Los usuarios logueados solo leen; RLS filtra qué filas ven.
grant select on profiles, carreras, materias, plan_materias, profesores, catedras
  to authenticated;

-- Archivos: solo a través de la vista (la tabla sigue sin acceso directo).
revoke all on archivos from anon, authenticated;
grant select on archivos_visibles to authenticated;

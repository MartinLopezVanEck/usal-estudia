import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { agregarCuentaExterna, cambiarRol, quitarCuentaExterna } from "../actions";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const yo = await requireAdmin();
  const { q = "" } = await searchParams;
  const db = createAdminClient();

  let consulta = db.from("profiles").select("id, nombre, email, rol, created_at").order("rol").order("nombre").limit(200);
  if (q.trim()) {
    const t = q.trim().replace(/[%_,()]/g, " ");
    consulta = consulta.or(`nombre.ilike.%${t}%,email.ilike.%${t}%`);
  }
  const [{ data: usuarios }, { data: aportes }, { data: externas }] = await Promise.all([
    consulta,
    db.from("archivos").select("subido_por").eq("estado", "aprobado"),
    db.from("cuentas_externas").select("email, rol").order("email"),
  ]);
  const aportesDe = (id: string) => (aportes ?? []).filter((a) => a.subido_por === id).length;

  return (
    <div>
      <section className="tarjeta mb-8 space-y-3 p-4">
        <div>
          <h2 className="font-semibold">Cuentas externas autorizadas</h2>
          <p className="text-sm text-tenue">
            Mails que no son @usal.edu.ar pero pueden ingresar (con «Ingresar con otra cuenta autorizada» en el login).
          </p>
        </div>
        {(externas ?? []).length > 0 && (
          <ul className="divide-y divide-borde rounded-lg border border-borde">
            {externas!.map((c) => (
              <li key={c.email} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  {c.email} <span className="text-tenue">· {c.rol === "admin" ? "Admin" : "Alumno"}</span>
                </span>
                {c.email !== yo.email && (
                  <form action={quitarCuentaExterna}>
                    <input type="hidden" name="email" value={c.email} />
                    <button className="text-peligro hover:underline" title="Quita el acceso y borra la cuenta">
                      Quitar acceso
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <form action={agregarCuentaExterna} className="flex flex-wrap gap-2">
          <input name="email" type="email" placeholder="mail@gmail.com" className="input min-w-56 flex-1" required />
          <select name="rol" className="input w-auto" aria-label="Rol">
            <option value="admin">Admin</option>
            <option value="alumno">Alumno</option>
          </select>
          <button className="btn-secundario">Autorizar</button>
        </form>
      </section>

      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre o mail" className="input max-w-sm" />
        <button className="btn-secundario">Buscar</button>
      </form>
      <p className="mb-4 text-sm text-tenue">
        Los usuarios aparecen acá después de ingresar por primera vez. Los admins pueden aprobar archivos y editar el catálogo.
      </p>
      <ul className="tarjeta divide-y divide-borde">
        {(usuarios ?? []).map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">
                {u.nombre}
                {u.rol === "admin" && (
                  <span className="ml-2 rounded-full bg-acento/10 px-2 py-0.5 text-xs text-acento">Admin</span>
                )}
              </p>
              <p className="text-sm text-tenue">
                {u.email} · {aportesDe(u.id)} aportes publicados
              </p>
            </div>
            {u.id !== yo.id && (
              <form action={cambiarRol}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="rol" value={u.rol === "admin" ? "alumno" : "admin"} />
                <button className={u.rol === "admin" ? "btn-peligro" : "btn-secundario"}>
                  {u.rol === "admin" ? "Quitar admin" : "Hacer admin"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

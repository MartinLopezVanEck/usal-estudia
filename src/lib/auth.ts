import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  email: string;
  nombre: string;
  avatar_url: string | null;
  rol: "alumno" | "admin";
};

export const obtenerPerfil = cache(async (): Promise<Perfil | null> => {
  const supabase = await createClient();
  // getClaims lee el usuario del token (ya verificado y renovado por el middleware)
  // sin una consulta extra a Supabase.
  const { data: sesion } = await supabase.auth.getClaims();
  const id = sesion?.claims?.sub;
  if (!id) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, nombre, avatar_url, rol")
    .eq("id", id)
    .single();
  return data;
});

export async function requireUser() {
  const perfil = await obtenerPerfil();
  if (!perfil) redirect("/login");
  return perfil;
}

export async function requireAdmin() {
  const perfil = await requireUser();
  if (perfil.rol !== "admin") redirect("/carreras");
  return perfil;
}

export function limiteSubidaBytes(perfil: Perfil) {
  const mb =
    perfil.rol === "admin"
      ? Number(process.env.MAX_UPLOAD_MB_ADMIN ?? 100)
      : Number(process.env.MAX_UPLOAD_MB_ALUMNO ?? 25);
  return mb * 1024 * 1024;
}

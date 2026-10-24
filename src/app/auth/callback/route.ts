import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Cuentas @usal.edu.ar o las cargadas como externas por un admin. */
async function emailPermitido(email: string | undefined) {
  const mail = email?.toLowerCase();
  if (!mail) return false;
  if (mail.endsWith("@usal.edu.ar")) return true;
  const { data } = await createAdminClient()
    .from("cuentas_externas")
    .select("email")
    .eq("email", mail)
    .maybeSingle();
  return !!data;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const destino = next?.startsWith("/") && !next.startsWith("//") ? next : "/carreras";

  // Si el trigger de la base rechazó el mail, Supabase vuelve con un error.
  const errorDesc = searchParams.get("error_description") ?? "";
  if (searchParams.get("error")) {
    const tipo = errorDesc.toLowerCase().includes("database") ? "dominio" : "auth";
    return NextResponse.redirect(`${origin}/login?error=${tipo}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (!(await emailPermitido(data.user.email))) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=dominio`);
      }
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

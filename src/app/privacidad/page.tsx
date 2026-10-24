import type { Metadata } from "next";
import { Contacto, PaginaLegal } from "@/components/pagina-legal";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <PaginaLegal titulo="Política de privacidad" actualizado="octubre de 2026">
      <p>
        Usal Estudia es un sitio hecho por alumnos para compartir material de estudio de la Universidad del
        Salvador. No es un sitio oficial de la universidad.
      </p>

      <h2>Qué datos usamos</h2>
      <p>Cuando ingresás con Google recibimos únicamente:</p>
      <ul>
        <li>tu nombre,</li>
        <li>tu dirección de correo,</li>
        <li>tu foto de perfil.</li>
      </ul>
      <p>No accedemos a tu Gmail, Drive, contactos ni a ningún otro dato de tu cuenta.</p>
      <p>
        Además guardamos los archivos que subís y los datos que cargás con ellos (título, materia, profesor,
        etc.).
      </p>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Para verificar que sos alumno de la USAL (cuenta @usal.edu.ar).</li>
        <li>Para mostrar quién subió cada archivo, salvo que elijas subirlo de forma anónima.</li>
        <li>Para que los administradores puedan revisar el material antes de publicarlo.</li>
      </ul>
      <p>
        Si subís algo de forma anónima, tu nombre no se muestra a los demás alumnos, pero los administradores
        sí pueden ver quién lo subió.
      </p>
      <p>No vendemos ni compartimos tus datos con terceros, y no usamos publicidad ni rastreadores.</p>

      <h2>Dónde se guardan</h2>
      <p>
        Los datos se guardan en Supabase (base de datos y login) y los archivos en Cloudflare R2. Ambos son
        proveedores de infraestructura que solo los almacenan por cuenta nuestra.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedir que borremos tu cuenta o cualquier archivo que hayas subido escribiendo a <Contacto />.
        Si borramos tu cuenta, el material que subiste puede quedar publicado sin autor, salvo que pidas
        eliminarlo también.
      </p>
    </PaginaLegal>
  );
}

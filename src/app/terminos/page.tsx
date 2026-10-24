import type { Metadata } from "next";
import { Contacto, PaginaLegal } from "@/components/pagina-legal";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <PaginaLegal titulo="Términos y condiciones" actualizado="octubre de 2026">
      <p>
        Usal Estudia es un sitio gratuito hecho por alumnos para compartir material de estudio. No es un sitio
        oficial de la Universidad del Salvador. Al usarlo aceptás estas condiciones.
      </p>

      <h2>Quién puede usarlo</h2>
      <p>
        El acceso es solo para cuentas @usal.edu.ar y para las cuentas que autoricen los administradores.
      </p>

      <h2>Qué se puede subir</h2>
      <ul>
        <li>Material de estudio: parciales, finales, apuntes, guías, resúmenes, trabajos prácticos y presentaciones.</li>
        <li>Solo material que tengas derecho a compartir.</li>
        <li>
          Nada de contenido ofensivo, datos personales de terceros, archivos maliciosos ni material ajeno a
          la facultad.
        </li>
      </ul>
      <p>
        Todo lo que se sube pasa por revisión de un administrador antes de publicarse. Los administradores
        pueden rechazar, editar o eliminar material y cuentas a su criterio.
      </p>

      <h2>Uso del material</h2>
      <p>
        El material se comparte para estudiar. Cada archivo sigue perteneciendo a su autor. No garantizamos
        que esté completo, actualizado o libre de errores: usalo como apoyo, no como fuente oficial.
      </p>

      <h2>Reclamos</h2>
      <p>
        Si encontrás material que te pertenece y querés que lo bajemos, o algo que no debería estar
        publicado, escribí a <Contacto /> y lo revisamos.
      </p>

      <h2>Cambios</h2>
      <p>
        Estos términos pueden cambiar. Si el cambio es importante lo vamos a avisar en el sitio.
      </p>
    </PaginaLegal>
  );
}

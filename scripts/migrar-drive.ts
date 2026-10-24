/**
 * Migra una copia local del Drive a Usal Estudia.
 *
 * Paso 1 (analizar): recorre la carpeta y genera un CSV con lo que va a importar.
 *   npm run migrar -- analizar "G:/Mi unidad/Ing-Lic Informática Usal/Lo importante"
 *
 * Paso 2: abrí el CSV en Excel, corregí lo que haga falta (materia, profesor,
 * tipo, título, columna "importar") y guardalo (mismo formato: CSV separado por ;).
 *
 * Paso 3 (importar): sube los archivos a R2 y los carga como aprobados.
 *   npm run migrar -- importar migracion.csv --raiz "<misma carpeta>" --admin tu-mail@usal.edu.ar \
 *     --carreras "Ingeniería en Informática;Licenciatura en Informática"
 *
 * Se puede correr "importar" varias veces: lo que ya se subió se saltea.
 *
 * Estructura esperada:
 *   <raíz>/<N° Año>/[Primer|Segundo cuatrimestre]/<Materia>/[<Profesor>]/.../archivo
 * Las materias que cuelgan directo del año se toman como anuales.
 * Los archivos sueltos dentro de la materia quedan como "General" (sin profesor).
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { createReadStream, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { config as cargarEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { slugify } from "@/lib/slug";
import {
  EXTENSIONES_BLOQUEADAS,
  TIPOS_MATERIAL,
  detectarAnioCursada,
  detectarTipo,
  type Cuatrimestre,
  type TipoMaterial,
} from "@/lib/constants";
import {
  asegurarCatedra,
  asegurarPlan,
  obtenerOCrearCarrera,
  obtenerOCrearMateria,
  obtenerOCrearProfesor,
} from "@/lib/catalogo";

cargarEnv({ path: ".env.local" });

const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB_ADMIN ?? 100) * 1024 * 1024;
const COLUMNAS = [
  "importar", "ruta", "anio", "cuatrimestre", "materia", "profesor", "tipo", "titulo", "anio_cursada", "tamano_mb", "nota",
] as const;
type Fila = Record<(typeof COLUMNAS)[number], string>;

// ---------------------------------------------------------------------------
// Heurísticas
// ---------------------------------------------------------------------------

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function detectarAnio(nombre: string): number | null {
  const m = normalizar(nombre).match(/^(\d)\s*[°º]?\s*(er|do|ro|to|vo)?\s*ano/);
  return m ? Number(m[1]) : null;
}

function detectarCuatrimestre(nombre: string): Cuatrimestre | null {
  const n = normalizar(nombre);
  if (!n.includes("cuatri")) return null;
  if (/primer|^1/.test(n)) return "primero";
  if (/segundo|^2/.test(n)) return "segundo";
  return null;
}

// ---------------------------------------------------------------------------
// CSV (separado por ; para que Excel en español lo abra directo)
// ---------------------------------------------------------------------------

function aCsv(filas: Fila[]) {
  const celda = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return "\uFEFF" + [COLUMNAS.join(";"), ...filas.map((f) => COLUMNAS.map((c) => celda(f[c])).join(";"))].join("\r\n");
}

function deCsv(texto: string): Fila[] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  texto = texto.replace(/^\uFEFF/, "");
  // Excel en espa\u00F1ol guarda con ";", en ingl\u00E9s con ",".
  const sep = texto.slice(0, texto.indexOf("\n")).includes(";") ? ";" : ",";
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (ch === '"') comillas = false;
      else celda += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) { fila.push(celda); celda = ""; }
    else if (ch === "\n") { fila.push(celda.replace(/\r$/, "")); filas.push(fila); fila = []; celda = ""; }
    else celda += ch;
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila); }

  const [encabezado, ...resto] = filas;
  return resto
    .filter((f) => f.some((c) => c.trim()))
    .map((f) => Object.fromEntries(encabezado.map((h, i) => [h.trim(), (f[i] ?? "").trim()])) as Fila);
}

// ---------------------------------------------------------------------------
// Paso 1: analizar
// ---------------------------------------------------------------------------

function listar(dir: string) {
  return readdirSync(dir, { withFileTypes: true }).filter((e) => !e.name.startsWith("."));
}

function archivosRecursivos(dir: string): string[] {
  return listar(dir).flatMap((e) => {
    const ruta = join(dir, e.name);
    return e.isDirectory() ? archivosRecursivos(ruta) : [ruta];
  });
}

function analizar(raiz: string, salida: string) {
  const filas: Fila[] = [];
  const omitir = (ruta: string, nota: string) =>
    filas.push({
      importar: "no", ruta: relative(raiz, ruta), anio: "", cuatrimestre: "", materia: "", profesor: "",
      tipo: "", titulo: basename(ruta), anio_cursada: "", tamano_mb: "", nota,
    });

  function agregarMateria(dirMateria: string, anio: number, cuatrimestre: Cuatrimestre) {
    const materia = basename(dirMateria);
    for (const e of listar(dirMateria)) {
      const ruta = join(dirMateria, e.name);
      // Subcarpeta directa de la materia = profesor. Más adentro, todo va a ese profesor.
      const profesor = e.isDirectory() ? e.name : "";
      for (const archivo of e.isDirectory() ? archivosRecursivos(ruta) : [ruta]) {
        const nombre = basename(archivo);
        const ext = extname(nombre).slice(1).toLowerCase();
        const tamano = statSync(archivo).size;
        const subcarpetas = relative(e.isDirectory() ? ruta : dirMateria, archivo).split(/[\\/]/).slice(0, -1);

        let nota = subcarpetas.length ? `Subcarpeta: ${subcarpetas.join(" / ")}` : "";
        let importar = "si";
        if (["gdoc", "gsheet", "gslides", "gdraw", "gform", "gmap"].includes(ext)) {
          importar = "no";
          nota = "Archivo nativo de Google: exportalo a PDF/Office para importarlo";
        } else if (EXTENSIONES_BLOQUEADAS.includes(ext)) {
          importar = "no";
          nota = "Extensión bloqueada";
        } else if (tamano > MAX_BYTES) {
          importar = "no";
          nota = `Supera ${MAX_BYTES / 1024 / 1024} MB`;
        } else if (tamano === 0) {
          importar = "no";
          nota = "Archivo vacío";
        }

        filas.push({
          importar,
          ruta: relative(raiz, archivo),
          anio: String(anio),
          cuatrimestre,
          materia,
          profesor,
          tipo: detectarTipo(nombre),
          titulo: nombre.replace(/\.[^.]+$/, ""),
          anio_cursada: detectarAnioCursada(nombre),
          tamano_mb: (tamano / 1024 / 1024).toFixed(1).replace(".", ","),
          nota,
        });
      }
    }
  }

  for (const eAnio of listar(raiz)) {
    const rutaAnio = join(raiz, eAnio.name);
    const anio = eAnio.isDirectory() ? detectarAnio(eAnio.name) : null;
    if (!anio) {
      (eAnio.isDirectory() ? archivosRecursivos(rutaAnio) : [rutaAnio]).forEach((r) => omitir(r, "Fuera de una carpeta de año"));
      continue;
    }
    for (const e of listar(rutaAnio)) {
      const ruta = join(rutaAnio, e.name);
      if (!e.isDirectory()) {
        omitir(ruta, "Archivo suelto en la carpeta del año");
        continue;
      }
      const cuatri = detectarCuatrimestre(e.name);
      if (cuatri) {
        for (const eMateria of listar(ruta)) {
          const rutaMateria = join(ruta, eMateria.name);
          if (eMateria.isDirectory()) agregarMateria(rutaMateria, anio, cuatri);
          else omitir(rutaMateria, "Archivo suelto en la carpeta del cuatrimestre");
        }
      } else {
        agregarMateria(ruta, anio, "anual");
      }
    }
  }

  writeFileSync(salida, aCsv(filas), "utf8");
  const aImportar = filas.filter((f) => f.importar === "si");
  const materias = new Set(aImportar.map((f) => f.materia));
  const profesores = new Set(aImportar.map((f) => f.profesor).filter(Boolean));
  console.log(`\nListo: ${salida}`);
  console.log(`  ${aImportar.length} archivos a importar, ${filas.length - aImportar.length} omitidos`);
  console.log(`  ${materias.size} materias, ${profesores.size} profesores`);
  console.log(`\nRevisalo en Excel (sobre todo las columnas profesor y tipo) y después corré "importar".`);
}

// ---------------------------------------------------------------------------
// Paso 2: importar
// ---------------------------------------------------------------------------

async function importar(csv: string, raiz: string, adminEmail: string, nombresCarreras: string[]) {
  for (const v of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
    if (!process.env[v]) throw new Error(`Falta la variable ${v} en .env.local`);
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  });
  const bucket = process.env.R2_BUCKET!;

  const { data: admin } = await db.from("profiles").select("id, rol").eq("email", adminEmail.toLowerCase()).single();
  if (!admin) throw new Error(`No existe el usuario ${adminEmail}. Ingresá una vez a la web con esa cuenta.`);
  if (admin.rol !== "admin") throw new Error(`${adminEmail} no es admin.`);

  const carreras = [];
  for (const nombre of nombresCarreras) carreras.push(await obtenerOCrearCarrera(db, nombre, "aprobado", admin.id));

  const filas = deCsv(readFileSync(csv, "utf8")).filter((f) => normalizar(f.importar) === "si");
  const cacheMaterias = new Map<string, string>();
  const cacheProfes = new Map<string, string>();
  let subidos = 0, salteados = 0, errores = 0;

  for (const [i, f] of filas.entries()) {
    const prefijo = `[${i + 1}/${filas.length}] ${f.ruta}`;
    try {
      const ruta = join(raiz, f.ruta);
      const ext = extname(ruta).slice(1).toLowerCase();
      // Clave determinística: si se vuelve a correr, el archivo ya está.
      const key = `migracion/${createHash("sha1").update(f.ruta.replace(/\\/g, "/")).digest("hex")}${ext ? `.${ext}` : ""}`;

      const { data: existente } = await db.from("archivos").select("id").eq("storage_key", key).maybeSingle();
      if (existente) { salteados++; continue; }

      const anio = Number(f.anio);
      const cuatri = (f.cuatrimestre || "anual") as Cuatrimestre;
      if (!f.materia || !(anio >= 1 && anio <= 7)) throw new Error("Falta materia o año");

      const claveMateria = slugify(f.materia);
      let materiaId = cacheMaterias.get(claveMateria);
      if (!materiaId) {
        materiaId = await obtenerOCrearMateria(db, f.materia, "aprobado", admin.id);
        for (const c of carreras) await asegurarPlan(db, c, materiaId, anio, cuatri);
        cacheMaterias.set(claveMateria, materiaId);
      }

      let profesorId: string | null = null;
      if (f.profesor) {
        const claveProfe = slugify(f.profesor);
        profesorId = cacheProfes.get(claveProfe) ?? (await obtenerOCrearProfesor(db, f.profesor, "aprobado", admin.id));
        cacheProfes.set(claveProfe, profesorId);
        await asegurarCatedra(db, materiaId, profesorId);
      }

      const tamano = statSync(ruta).size;
      const yaEnR2 = await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key })).then(() => true, () => false);
      if (!yaEnR2) {
        await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: createReadStream(ruta), ContentLength: tamano }));
      }

      // Acepta tanto "guia_resuelta" como "Guía resuelta".
      const tipo = (Object.entries(TIPOS_MATERIAL).find(
        ([clave, etiqueta]) => clave === f.tipo || slugify(etiqueta) === slugify(f.tipo),
      )?.[0] ?? "otro") as TipoMaterial;
      const { error } = await db.from("archivos").insert({
        titulo: f.titulo || basename(ruta),
        descripcion: f.nota.startsWith("Subcarpeta:") ? f.nota : null,
        tipo,
        materia_id: materiaId,
        profesor_id: profesorId,
        anio_cursada: f.anio_cursada ? Number(f.anio_cursada) : null,
        storage_key: key,
        nombre_original: basename(ruta),
        tamano,
        estado: "aprobado",
        subido_por: admin.id,
        revisado_por: admin.id,
        revisado_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      subidos++;
      console.log(`✓ ${prefijo}`);
    } catch (e) {
      errores++;
      console.error(`✗ ${prefijo}: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Lo creado por la migración queda aprobado aunque ya existiera como pendiente.
  await db.from("materias").update({ estado: "aprobado" }).in("id", [...cacheMaterias.values()]);
  await db.from("profesores").update({ estado: "aprobado" }).in("id", [...cacheProfes.values()]);

  console.log(`\nSubidos: ${subidos} · ya estaban: ${salteados} · errores: ${errores}`);
}

// ---------------------------------------------------------------------------

function opcion(args: string[], nombre: string) {
  const i = args.indexOf(`--${nombre}`);
  return i === -1 ? undefined : args[i + 1];
}

async function main() {
  const [comando, ...args] = process.argv.slice(2);

  if (comando === "analizar" && args[0]) {
    analizar(args[0], opcion(args, "salida") ?? "migracion.csv");
  } else if (comando === "importar" && args[0]) {
    const raiz = opcion(args, "raiz");
    const admin = opcion(args, "admin");
    const carreras = opcion(args, "carreras");
    if (!raiz || !admin || !carreras) {
      throw new Error('Uso: importar <csv> --raiz "<carpeta>" --admin <mail> --carreras "Carrera 1;Carrera 2"');
    }
    await importar(args[0], raiz, admin, carreras.split(";").map((c) => c.trim()).filter(Boolean));
  } else {
    console.log(`Uso:
  npm run migrar -- analizar "<carpeta raíz>" [--salida migracion.csv]
  npm run migrar -- importar migracion.csv --raiz "<carpeta raíz>" --admin <mail> --carreras "Carrera 1;Carrera 2"`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

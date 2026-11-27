import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

/** URL firmada para que el navegador suba el archivo directo a R2. */
export function urlDeSubida(key: string, contentType: string, tamano: number) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: tamano,
    }),
    { expiresIn: 60 * 15 },
  );
}

const HORA = 60 * 60 * 1000;

/**
 * URL firmada de descarga. `inline` la muestra en el navegador (vista previa).
 *
 * La firma usa el comienzo de la hora actual, así la URL es la misma durante esa
 * hora y el navegador reutiliza el archivo que ya bajó (Cache-Control). Vale 2 h
 * desde ese momento, o sea que siempre le queda al menos una hora de vida.
 */
export function urlDeDescarga(
  key: string,
  nombre: string,
  opciones: { inline?: boolean; contentType?: string | null } = {},
) {
  const disposicion = opciones.inline ? "inline" : "attachment";
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `${disposicion}; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      ResponseContentType: opciones.contentType ?? undefined,
      ResponseCacheControl: "private, max-age=3600",
    }),
    { expiresIn: 2 * 60 * 60, signingDate: new Date(Math.floor(Date.now() / HORA) * HORA) },
  );
}

/** Tamaño real del objeto en R2, o null si no existe. */
export async function tamanoEnR2(key: string): Promise<number | null> {
  try {
    const res = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return res.ContentLength ?? null;
  } catch {
    return null;
  }
}

export async function borrarDeR2(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

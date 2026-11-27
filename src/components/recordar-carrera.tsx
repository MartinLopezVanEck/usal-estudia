"use client";

import { useEffect } from "react";
import { COOKIE_CARRERA } from "@/lib/constants";

/** Recuerda la última carrera que abriste: "Carreras" te lleva directo ahí. */
export function RecordarCarrera({ slug }: { slug: string }) {
  useEffect(() => {
    document.cookie = `${COOKIE_CARRERA}=${encodeURIComponent(slug)}; path=/; max-age=31536000; samesite=lax`;
  }, [slug]);
  return null;
}

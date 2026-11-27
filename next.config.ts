import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // El navegador reutiliza las páginas ya visitadas por 30 s (60 s las precargadas):
    // volver atrás o reabrir una materia es instantáneo. Al subir o aprobar algo se invalida.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;

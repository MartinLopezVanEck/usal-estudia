"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="tarjeta mx-auto max-w-md p-6 text-center">
      <h1 className="text-lg font-semibold">Algo salió mal</h1>
      <p className="mt-2 text-sm text-tenue">
        {process.env.NODE_ENV === "development" ? error.message : "Probá de nuevo en un rato."}
      </p>
      <button onClick={reset} className="btn-primario mt-4">Reintentar</button>
    </div>
  );
}

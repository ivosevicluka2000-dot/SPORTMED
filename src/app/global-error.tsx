"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          margin: 0,
          background: "#fff",
          color: "#0A1628",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>
            Greška / Error
          </h1>
          <p style={{ marginBottom: 24, color: "#555" }}>
            {error?.message || "Unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "12px 24px",
              background: "#0A1628",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Pokušaj ponovo
          </button>
        </div>
      </body>
    </html>
  );
}

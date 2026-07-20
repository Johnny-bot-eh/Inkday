"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#12151c",
          color: "#f3efe6",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Inkday hit a snag</h1>
          <p style={{ opacity: 0.75, marginBottom: 20 }}>
            Reload the page. If it keeps happening, open{" "}
            <a href="https://inkday-web.vercel.app" style={{ color: "#e87840" }}>
              inkday-web.vercel.app
            </a>
            .
          </p>
          <p style={{ opacity: 0.45, fontSize: 12, marginBottom: 20 }}>
            {error?.digest ? `Ref ${error.digest}` : error?.message || "Unknown error"}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#e87840",
              color: "#1a120c",
              border: 0,
              borderRadius: 8,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

"use client";
import { useState } from "react";

export function RehabCopyAccessButton({ email, scope, loginUrl }: { email: string; scope: string; loginUrl: string }) {
  const [result, setResult] = useState("");
  const message = `Zdravo! Imaš pristup Rehab platformi.\nPrijava: ${loginUrl}\nEmail: ${email}\nPristup: ${scope}.\nPočetnu lozinku dobijaš zasebno. Ako već imaš nalog, koristi svoju postojeću lozinku.`;
  return <div>
    <button type="button" className="text-sm font-medium text-teal hover:underline" onClick={async () => {
      try { await navigator.clipboard.writeText(message); setResult("Poruka je kopirana."); }
      catch { setResult("Kopiranje nije dostupno. Označite i kopirajte poruku ispod."); }
    }}>Kopiraj poruku za prijavu</button>
    {result && <p role="status" className="mt-1 text-xs text-gray-600">{result}</p>}
    {result.startsWith("Kopiranje") && <textarea readOnly aria-label="Poruka za prijavu" value={message} rows={6} className="mt-2 w-full rounded border p-2 text-xs" />}
  </div>;
}

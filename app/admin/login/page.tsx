"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/projects");
      router.refresh();
    } else {
      setError("סיסמה שגויה");
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>כניסת אדמין</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 4 }}>סיסמה</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 16,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </label>
        {error && (
          <p style={{ color: "#b00020", fontSize: 14, marginBottom: 12 }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 16,
            background: "#1f1f1f",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "בודק..." : "כניסה"}
        </button>
      </form>
    </main>
  );
}

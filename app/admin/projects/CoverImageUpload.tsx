"use client";

import { useState } from "react";

export default function CoverImageUpload({ initialUrl }: { initialUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(file: File | null) {
    if (!file) return;
    setStatus("uploading");
    setPreview(URL.createObjectURL(file));

    try {
      const signRes = await fetch("/api/admin/cloudinary-sign", { method: "POST" });
      if (!signRes.ok) throw new Error();
      const sign = await signRes.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", sign.apiKey);
      uploadData.append("timestamp", String(sign.timestamp));
      uploadData.append("signature", sign.signature);
      uploadData.append("folder", sign.folder);
      uploadData.append("public_id", sign.publicId);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });
      if (!uploadRes.ok) throw new Error();
      const uploaded = await uploadRes.json();

      setUrl(uploaded.secure_url);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <input type="hidden" name="coverImageUrl" value={url} />
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px dashed #ccc",
          borderRadius: 6,
          padding: 10,
          fontSize: 13,
          color: "#666",
          cursor: "pointer",
        }}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
        ) : null}
        <span>
          {status === "uploading" && "מעלה..."}
          {status === "error" && "ההעלאה נכשלה, נסי שוב"}
          {status === "idle" && (url ? "תמונת בית נבחרה" : "העלאת תמונת בית לפרויקט (אופציונלי)")}
        </span>
        <input type="file" accept="image/*,.heic,.heif" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
      </label>
    </div>
  );
}

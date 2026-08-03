"use client";

import { useState } from "react";
import { colors } from "./formStyles";

export default function CoverImageUpload({ initialUrl, readOnly }: { initialUrl?: string | null; readOnly?: boolean }) {
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
          display: "block",
          position: "relative",
          background: "white",
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          padding: 8,
          aspectRatio: "1 / 1",
          cursor: readOnly ? "default" : "pointer",
          boxSizing: "border-box",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 6,
              background: colors.inputBg,
              border: `1px dashed ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: colors.textLabel,
              textAlign: "center",
              padding: 8,
            }}
          >
            תמונת בית לפרויקט (אופציונלי)
          </div>
        )}

        {!readOnly && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#262046",
              border: "1px solid #3e376e",
              borderRadius: 8,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SwapIcon />
          </div>
        )}

        {!readOnly && (
          <input
            type="file"
            accept="image/*,.heic,.heif"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
        )}
      </label>
      {!readOnly && (
        <p style={{ fontSize: 12, color: colors.textLabel, margin: "6px 0 0", textAlign: "center" }}>
          {status === "uploading" && "מעלה..."}
          {status === "error" && "ההעלאה נכשלה, נסי שוב"}
        </p>
      )}
    </div>
  );
}

function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: "rotate(30deg)" }}>
      <path
        d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

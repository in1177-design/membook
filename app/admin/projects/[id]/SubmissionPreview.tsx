"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Frank_Ruhl_Libre } from "next/font/google";
import { addInviteeMediaAsset, deleteMediaAsset } from "../../../../lib/actions";

const headingFont = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["500", "700"] });

type Photo = { id: string; url: string };

type Props = {
  inviteeId: string;
  projectId: string;
  inviteeName: string;
  photos: Photo[];
  dateLocation: string | null;
  answers: { questionText: string; text: string }[];
};

export default function SubmissionPreview({ inviteeId, projectId, inviteeName, photos: initialPhotos, dateLocation, answers }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePhoto = photos[activeIndex] ?? null;

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/admin/invitee-photo-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId, projectId }),
      });
      if (!signRes.ok) throw new Error("לא הצלחנו להתחיל את העלאת התמונה");
      const sign = await signRes.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", sign.apiKey);
      uploadData.append("timestamp", String(sign.timestamp));
      uploadData.append("signature", sign.signature);
      uploadData.append("folder", sign.folder);
      uploadData.append("public_id", sign.publicId);
      uploadData.append("tags", sign.tag);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });
      if (!uploadRes.ok) throw new Error("העלאת התמונה נכשלה");
      const uploaded = await uploadRes.json();

      const created = await addInviteeMediaAsset(inviteeId, projectId, {
        cloudinaryPublicId: uploaded.public_id,
        url: uploaded.secure_url,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
      });

      setPhotos((prev) => {
        const next = [...prev, { id: created.id, url: created.url }];
        setActiveIndex(next.length - 1);
        return next;
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!activePhoto) return;
    if (!window.confirm("למחוק את התמונה הזו?")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteMediaAsset(activePhoto.id, projectId);
      setPhotos((prev) => {
        const next = prev.filter((p) => p.id !== activePhoto.id);
        setActiveIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
        return next;
      });
      router.refresh();
    } catch {
      setError("מחיקת התמונה נכשלה, נסי שוב");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#999", margin: "0 0 4px" }}>
        תצוגה מקדימה — מה {inviteeName} ראה/תה
      </p>
      <p style={{ fontSize: 12, color: "#bbb", margin: "0 0 20px" }}>כך נראה המסך אחרי שליחה, מנקודת המבט של המוזמן/ת</p>

      <div
        style={{
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid #ece9e4",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 12px 30px -14px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ position: "relative" }}>
          {activePhoto ? (
            <img src={activePhoto.url} alt="" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: 220,
                background: "#f7f6f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "#b5b3ae",
              }}
            >
              לא הועלתה תמונה
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i - 1 + photos.length) % photos.length)}
                aria-label="התמונה הקודמת"
                style={{ ...carouselArrowStyle, insetInlineStart: 10 }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i + 1) % photos.length)}
                aria-label="התמונה הבאה"
                style={{ ...carouselArrowStyle, insetInlineEnd: 10 }}
              >
                ›
              </button>
              <div style={{ position: "absolute", bottom: 10, insetInlineStart: 0, insetInlineEnd: 0, display: "flex", justifyContent: "center", gap: 6 }}>
                {photos.map((p, i) => (
                  <span
                    key={p.id}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: i === activeIndex ? "white" : "rgba(255,255,255,0.5)",
                      boxShadow: "0 0 2px rgba(0,0,0,0.4)",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, padding: "10px 24px", borderBottom: "1px solid #f0eee9", background: "#fbfaf8" }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!activePhoto || deleting}
            style={{ ...smallBtnStyle, color: "#c0392b", opacity: !activePhoto || deleting ? 0.5 : 1 }}
          >
            {deleting ? "מוחקת..." : "מחיקת תמונה"}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ ...smallBtnStyle, opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? "מעלה..." : activePhoto ? "העלאת תמונה נוספת" : "העלאת תמונה"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleUpload(file);
            }}
          />
        </div>
        {error && <p style={{ color: "#b00020", fontSize: 12, margin: "8px 24px 0" }}>{error}</p>}

        <div style={{ background: "white", padding: "28px 24px" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: 15,
              fontStyle: "italic",
              color: "#8a7f6f",
              margin: "0 0 20px",
            }}
            className={headingFont.className}
          >
            הסיפור שלך
          </p>

          {answers.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 14, color: "#b5b3ae", margin: 0 }}>עדיין לא נכתבו תשובות</p>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              {answers.map((a, i) => (
                <div key={i}>
                  <p style={{ textAlign: "center", fontSize: 15, color: "#333", lineHeight: 1.9, margin: 0, whiteSpace: "pre-wrap" }}>
                    {a.text}
                  </p>
                  {i < answers.length - 1 && (
                    <hr style={{ border: "none", borderTop: "1px solid #e8e6e2", margin: "20px 0 0" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {dateLocation && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "#9a9a9a",
                  marginBottom: 8,
                }}
              >
                תאריך ומקום
              </span>
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  fontSize: 14,
                  border: "1px solid #e6e4e0",
                  borderRadius: 10,
                  background: "#f7f6f4",
                  color: "#555",
                }}
              >
                {dateLocation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const carouselArrowStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 28,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.45)",
  color: "white",
  fontSize: 16,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const smallBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid #e0ddd7",
  borderRadius: 999,
  background: "white",
  cursor: "pointer",
  color: "#333",
};

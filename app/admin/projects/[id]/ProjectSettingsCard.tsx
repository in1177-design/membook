"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCircle, ImageIcon, cardStyle, cardHeadStyle, cardLabelStyle } from "./DashboardCards";

type Props = {
  projectId: string;
  projectName: string;
  coverImageUrl: string | null;
};

export default function ProjectSettingsCard({ projectId, projectName, coverImageUrl }: Props) {
  const [coverFailed, setCoverFailed] = useState(false);

  return (
    <Link
      href={`/admin/projects/${projectId}/settings`}
      style={{ ...cardStyle, textAlign: "start", display: "block", textDecoration: "none", color: "inherit", cursor: "pointer" }}
    >
      <div style={cardHeadStyle}>
        <IconCircle color="#6c5ce7" bg="#f0eefc">
          <ImageIcon />
        </IconCircle>
        <span style={cardLabelStyle}>הגדרות הפרויקט</span>
      </div>
      {coverImageUrl && !coverFailed ? (
        <img
          src={coverImageUrl}
          alt={projectName}
          onError={() => setCoverFailed(true)}
          style={{ width: "100%", height: 76, objectFit: "cover", borderRadius: 10, marginTop: 10 }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 76,
            borderRadius: 10,
            marginTop: 10,
            background: "#f7f6f4",
            border: "1px dashed #e0ddd7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#b5b3ae",
          }}
        >
          אין תמונת בית
        </div>
      )}
    </Link>
  );
}

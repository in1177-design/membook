"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type ProjectSummary = {
  id: string;
  name: string;
  totalMaterials: number;
  totalParticipants: number;
  submittedCount: number;
};

type Props = {
  allProjects: ProjectSummary[];
};

export default function ProjectSidebar({ allProjects }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const urlProjectId = pathname.match(/^\/admin\/projects\/([^/]+)(?:\/album)?$/)?.[1];
  const isAlbumRoute = /^\/admin\/projects\/[^/]+\/album$/.test(pathname);
  const activeProject = allProjects.find((p) => p.id === urlProjectId) ?? allProjects[0];
  const isStoryActive = activeProject.id === urlProjectId && !isAlbumRoute;
  const isAlbumActive = activeProject.id === urlProjectId && isAlbumRoute;
  const { id: projectId, name: projectName, totalMaterials, totalParticipants, submittedCount } = activeProject;

  const pct = totalParticipants > 0 ? Math.round((submittedCount / totalParticipants) * 100) : 0;

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <aside
        style={{
          width: collapsed ? 72 : 260,
          transition: "width 0.18s ease",
          background: "#202124",
          borderRadius: 20,
          padding: collapsed ? "20px 10px" : "20px 18px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          position: "sticky",
          top: 24,
          height: "calc(100vh - 48px)",
          color: "#e8e6e2",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 8,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "inherit",
            font: "inherit",
          }}
        >
          {!collapsed && <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>סיפור באלבום</span>}
          <BookHeartIcon />
        </button>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#2a2b2f",
            borderRadius: 12,
            padding: collapsed ? "10px 0" : "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: "pointer",
          }}
        >
          <ChevronDownIcon />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: "#9a9893", marginBottom: 2 }}>הפרויקט שלי</div>
              <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {projectName}
              </div>
            </div>
          )}
          <select
            value={projectId}
            onChange={(e) => router.push(`/admin/projects/${e.target.value}`)}
            aria-label="החלפת אלבום"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", appearance: "none" }}
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SidebarItem
            icon={<GridIcon />}
            label="איסוף חומרים"
            count={totalMaterials}
            collapsed={collapsed}
            disabled
          />
          <SidebarItem
            icon={<LayersIcon />}
            label="מוזמנים"
            collapsed={collapsed}
            active={isStoryActive}
            onClick={isStoryActive ? undefined : () => router.push(`/admin/projects/${projectId}`)}
          />
          <SidebarItem
            icon={<ColumnsIcon />}
            label="עיצוב האלבום"
            collapsed={collapsed}
            active={isAlbumActive}
            onClick={isAlbumActive ? undefined : () => router.push(`/admin/projects/${projectId}/album`)}
          />
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {!collapsed ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e2703f" }}>{pct}%</span>
                <span style={{ fontSize: 12, color: "#c9c7c2" }}>התקדמות האלבום</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "#38393d", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "#e2703f", borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 11, color: "#8a8883", marginTop: 6 }}>
                {submittedCount} מתוך {totalParticipants} מוזמנים הגישו
              </div>
            </div>
          ) : (
            <div style={{ height: 6, borderRadius: 999, background: "#38393d", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#e2703f", borderRadius: 999 }} />
            </div>
          )}

          <SidebarItem icon={<PeopleIcon />} label="משתתפים" count={totalParticipants} collapsed={collapsed} />

          <hr style={{ border: "none", borderTop: "1px solid #38393d", margin: 0 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
            <button
              type="button"
              onClick={handleLogout}
              title="התנתקות"
              aria-label="התנתקות"
              style={{ background: "none", border: "none", color: "#8a8883", cursor: "pointer", fontSize: 16, padding: 4 }}
            >
              ⋯
            </button>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  מנהל/ת
                </div>
                <div style={{ fontSize: 11, color: "#8a8883" }}>בעל/ת הפרויקט</div>
              </div>
            )}
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#e2a06f",
                color: "#2a2b2f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              מ
            </div>
          </div>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? "הרחבת התפריט" : "כיווץ התפריט"}
        aria-label={collapsed ? "הרחבת התפריט" : "כיווץ התפריט"}
        style={{
          position: "absolute",
          top: 28,
          left: -14,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "white",
          border: "1px solid #e6e4e0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: "#555",
        }}
      >
        {collapsed ? "‹" : "›"}
      </button>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  count,
  collapsed,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  collapsed: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={disabled ? undefined : onClick}
      title={disabled ? "בקרוב" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "10px 0" : "10px 10px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 10,
        background: active ? "#33343a" : "transparent",
        borderRight: active ? "3px solid #e2703f" : "3px solid transparent",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default",
      }}
    >
      {icon}
      {!collapsed && (
        <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, flex: 1, color: active ? "#fff" : "#d4d2cd" }}>
          {label}
        </span>
      )}
      {!collapsed && count !== undefined && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: "#38393d",
            color: "#c9c7c2",
            borderRadius: 999,
            padding: "2px 8px",
            flexShrink: 0,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function BookHeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M3 4.5c0-.8.7-1.5 1.5-1.5H10v13H4.5C3.7 16 3 15.3 3 14.5v-10Z" stroke="#e2703f" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M17 4.5c0-.8-.7-1.5-1.5-1.5H10v13h5.5c.8 0 1.5-.7 1.5-1.5v-10Z" stroke="#e2703f" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 6l4 4 4-4" stroke="#c9c7c2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="6" height="6" rx="1.3" stroke="#d4d2cd" strokeWidth="1.3" />
      <rect x="11" y="3" width="6" height="6" rx="1.3" stroke="#d4d2cd" strokeWidth="1.3" />
      <rect x="3" y="11" width="6" height="6" rx="1.3" stroke="#d4d2cd" strokeWidth="1.3" />
      <rect x="11" y="11" width="6" height="6" rx="1.3" stroke="#d4d2cd" strokeWidth="1.3" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <path d="M10 3 3 7l7 4 7-4-7-4Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 11l7 4 7-4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 15l7 4 7-4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

function ColumnsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="#d4d2cd" strokeWidth="1.3" />
      <path d="M8.3 3v14M13.7 3v14" stroke="#d4d2cd" strokeWidth="1.3" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7.5" cy="7" r="2.5" stroke="#d4d2cd" strokeWidth="1.3" />
      <path d="M2.5 16c0-2.5 2.2-4.3 5-4.3s5 1.8 5 4.3" stroke="#d4d2cd" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="14" cy="6.5" r="2" stroke="#d4d2cd" strokeWidth="1.1" opacity="0.7" />
      <path d="M12.8 11.2c2.3.3 3.7 1.9 3.7 4" stroke="#d4d2cd" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

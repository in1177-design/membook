"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Drawer from "../Drawer";
import Modal from "../Modal";
import RelationSelect from "./RelationSelect";
import AlbumPageView from "./AlbumPageView";
import ImportInviteesFromSheet from "./ImportInviteesFromSheet";
import type { Lang } from "../../../i/[token]/types";
import {
  addInvitee,
  addInviteeMediaAsset,
  deleteMediaAsset,
  updateInvitee,
  deleteInvitee,
  markInviteSent,
  revokeInviteLink,
  regenerateInviteLink,
  updateInviteeAttending,
  updateInviteeLanguage,
} from "../../../../lib/actions";

type Invitee = {
  id: string;
  name: string;
  name2: string | null;
  relation: string | null;
  phone: string | null;
  email: string | null;
  phone2: string | null;
  language: string | null;
  notes: string | null;
  attending: string | null;
  inviteLink: {
    id: string;
    token: string;
    sentAt: Date | null;
    firstViewedAt: Date | null;
    lastViewedAt: Date | null;
    revokedAt: Date | null;
  } | null;
  submission: {
    submittedAt: Date;
    completedAt: Date | null;
    dateLocation: string | null;
    blessingText: string | null;
    blessingSignedBy: string | null;
    additionalText: string | null;
    mediaAssets: { id: string; url: string }[];
    answers: { id: string; questionId: string; text: string }[];
  } | null;
};

// Full multi-language shape (matches app/i/[token]/types.ts's Question) —
// needed so AlbumPageView.tsx can render the real question text in whichever
// language the invitee actually got, same as the guest wizard does.
type QuestionRef = {
  id: string;
  textHe: string;
  textRu: string | null;
  textEn: string | null;
  helperTextHe: string | null;
  helperTextRu: string | null;
  helperTextEn: string | null;
};

// Project-level message templates (see EditProjectForm.tsx's "הודעות
// לאורחים" section) — one WhatsApp text + one email subject/body per
// language. Nothing per-guest is stored; the final text is generated here,
// client-side, at copy time only.
type MessageTemplates = {
  whatsappHe: string | null;
  whatsappRu: string | null;
  whatsappEn: string | null;
  emailSubjectHe: string | null;
  emailSubjectRu: string | null;
  emailSubjectEn: string | null;
  emailBodyHe: string | null;
  emailBodyRu: string | null;
  emailBodyEn: string | null;
};

type Props = {
  projectId: string;
  baseUrl: string;
  invitees: Invitee[];
  questions: QuestionRef[];
  defaultLanguage: string;
  // The album's real, persisted "שפות הפרויקט" config (project.languages —
  // see LanguageCheckboxes.tsx/EditProjectForm.tsx). Gates every place an
  // invitee's language gets picked in this file: AddInviteeForm,
  // EditInviteeForm, LanguageCell, and ImportInviteesFromSheet. Always
  // contains at least HE in practice (enforced by the checkbox UI), but code
  // below stays defensive in case of stale/invalid data.
  enabledLanguages: string[];
  celebrantNames: string;
  messageTemplates: MessageTemplates;
};

// Narrows the plain `string` we store (`invitee.language ?? defaultLanguage`)
// to the real Lang union AlbumPageView needs — same fallback shape as
// toLanguage() in lib/actions.ts, just client-side.
function toLangCode(value: string): Lang {
  return value === "RU" || value === "EN" ? value : "HE";
}

// Picks the He/Ru/En template trio for a guest's effective language (their
// own `language`, falling back to the project default — same resolution
// LanguageCell/AttendingCell already use elsewhere in this file).
function templatesForLanguage(templates: MessageTemplates, lang: string) {
  if (lang === "RU") return { whatsapp: templates.whatsappRu, emailSubject: templates.emailSubjectRu, emailBody: templates.emailBodyRu };
  if (lang === "EN") return { whatsapp: templates.whatsappEn, emailSubject: templates.emailSubjectEn, emailBody: templates.emailBodyEn };
  return { whatsapp: templates.whatsappHe, emailSubject: templates.emailSubjectHe, emailBody: templates.emailBodyHe };
}

// Substitutes the three supported tokens (see the "הודעות לאורחים" caption
// in EditProjectForm.tsx). Returns null (not an empty string) when the
// template itself is unset, so callers can tell "no template" apart from
// "template resolves to blank text" and disable the copy button accordingly.
function applyTemplate(template: string | null, vars: { guestName: string; celebrantNames: string; personalLink: string }): string | null {
  if (!template) return null;
  return template
    .replaceAll("{{guest_name}}", vars.guestName)
    .replaceAll("{{celebrant_names}}", vars.celebrantNames)
    .replaceAll("{{personal_link}}", vars.personalLink);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const AVATAR_COLORS = ["#6c5ce7", "#0984e3", "#00b894", "#e17055", "#d63031", "#0fb9b1", "#e84393", "#fdcb6e"];
function avatarColor(name: string): string {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
}

const TAG_PALETTE = [
  { bg: "#fdeaea", color: "#c0392b" },
  { bg: "#eaf6fd", color: "#2471a3" },
  { bg: "#eafaf1", color: "#1e8449" },
  { bg: "#f5eefb", color: "#7d3c98" },
  { bg: "#fff5e6", color: "#af7000" },
];
function tagStyle(text: string) {
  return TAG_PALETTE[hashStr(text) % TAG_PALETTE.length];
}

const LANGUAGE_LABEL: Record<string, string> = { HE: "עברית", RU: "רוסית", EN: "אנגלית" };

const ATTENDING_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  YES: { bg: "#e3f8ec", color: "#0f9d58", label: "כן" },
  NO: { bg: "#fdeaea", color: "#c0392b", label: "לא" },
  MAYBE: { bg: "#fef6e0", color: "#a15c00", label: "אולי" },
};
const ATTENDING_UNSET_STYLE = { bg: "#f1f1f1", color: "#999", label: "לא נקבע" };

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: "#e3f8ec", color: "#0f9d58", label: "הוגש" },
  // A Submission row exists (e.g. an admin pre-loaded a photo before the
  // invite was ever sent — AddInviteeForm/EditInviteeForm/AlbumPageView —
  // or a guest started the wizard and left) but completedAt is still null,
  // per its own schema comment: "distinguishes 'in progress' from 'actually
  // done'". Only a real completed submission should ever say "הוגש".
  inProgress: { bg: "#f1effb", color: "#5838b8", label: "בתהליך" },
  viewed: { bg: "#e8f0fe", color: "#1a56db", label: "נפתח" },
  sent: { bg: "#fef6e0", color: "#a15c00", label: "נשלח" },
  pending: { bg: "#f1f1f1", color: "#777", label: "טרם נשלח" },
};

function statusOf(invitee: Invitee): keyof typeof STATUS_STYLE {
  if (invitee.submission?.completedAt) return "submitted";
  if (invitee.submission) return "inProgress";
  if (invitee.inviteLink?.firstViewedAt) return "viewed";
  if (invitee.inviteLink?.sentAt) return "sent";
  return "pending";
}

// Sortable columns in the invitees table (search box + column-header sort,
// per product decision). Least-progressed → most-progressed, matching the
// guest journey — same ordering rationale as STATUS_STYLE above.
type SortKey = "name" | "attending" | "status" | "lastViewed";
const STATUS_RANK: Record<keyof typeof STATUS_STYLE, number> = { pending: 0, sent: 1, viewed: 2, inProgress: 3, submitted: 4 };
// Confirmed "כן" first (most actionable for the admin — e.g. seating/catering
// counts), then "אולי", then "לא", unset last.
const ATTENDING_RANK: Record<string, number> = { YES: 0, MAYBE: 1, NO: 2 };

function compareBy(key: SortKey, a: Invitee, b: Invitee): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name, "he");
    case "attending":
      return (ATTENDING_RANK[a.attending ?? ""] ?? 3) - (ATTENDING_RANK[b.attending ?? ""] ?? 3);
    case "status":
      return STATUS_RANK[statusOf(a)] - STATUS_RANK[statusOf(b)];
    case "lastViewed": {
      // Nulls (never viewed) always sort last, regardless of direction —
      // "never opened" isn't meaningfully before/after a real date.
      const av = a.inviteLink?.lastViewedAt;
      const bv = b.inviteLink?.lastViewedAt;
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av.getTime() - bv.getTime();
    }
  }
}

function SortableTh({
  sortKey,
  label,
  sort,
  onSort,
}: {
  sortKey: SortKey;
  label: string;
  sort: { key: SortKey; dir: "asc" | "desc" } | null;
  onSort: (key: SortKey) => void;
}) {
  const active = sort?.key === sortKey;
  return (
    <th style={thStyle}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          color: active ? "#333" : "inherit",
          cursor: "pointer",
        }}
      >
        {label}
        <span style={{ fontSize: 10, opacity: active ? 1 : 0.35 }}>{active && sort.dir === "desc" ? "▼" : "▲"}</span>
      </button>
    </th>
  );
}

export default function InviteesTable({ projectId, baseUrl, invitees, questions, defaultLanguage, enabledLanguages, celebrantNames, messageTemplates }: Props) {
  // Defensive fallback only — the checkbox UI always keeps HE enabled, so
  // this should never actually be empty in practice.
  const languages = enabledLanguages.length > 0 ? enabledLanguages : ["HE"];
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingInvitee, setEditingInvitee] = useState<Invitee | null>(null);
  const [previewingInvitee, setPreviewingInvitee] = useState<Invitee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

  // Name-only substring match (case-insensitive) — matches invitee.name as
  // typed, deliberately not name2/relation/phone/etc. per product decision.
  const query = searchQuery.trim().toLowerCase();
  const searchedInvitees = query ? invitees.filter((i) => i.name.toLowerCase().includes(query)) : invitees;

  // Sorting is applied on top of the search results, not the full list —
  // clicking a column header sorts whatever's currently visible.
  const visibleInvitees = sort ? [...searchedInvitees].sort((a, b) => sort.dir === "asc" ? compareBy(sort.key, a, b) : compareBy(sort.key, b, a)) : searchedInvitees;

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // third click on the same column clears back to the default (creation) order
    });
  }

  return (
    <div style={cardStyle}>
      <div style={headerRowStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>מוזמנים ({visibleInvitees.length})</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם..."
            style={searchInputStyle}
          />
        </div>
        <AddInviteeMenu onAddSingle={() => setShowAdd(true)} onImportFromSheet={() => setShowImport(true)} />
      </div>

      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0 }}>
        <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <SortableTh sortKey="name" label="שם מלא" sort={sort} onSort={toggleSort} />
              <th style={thStyle}>קרבה</th>
              <th style={thStyle}>שפה</th>
              <SortableTh sortKey="attending" label="מגיעה לאירוע" sort={sort} onSort={toggleSort} />
              <SortableTh sortKey="status" label="סטטוס" sort={sort} onSort={toggleSort} />
              <th style={thStyle}>התקדמות</th>
              <th style={thStyle}>תמונות</th>
              <th style={thStyle}>כניסה ראשונה</th>
              <SortableTh sortKey="lastViewed" label="כניסה אחרונה" sort={sort} onSort={toggleSort} />
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {visibleInvitees.length === 0 && query ? (
              <tr>
                <td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: "#999", padding: "24px 10px" }}>
                  לא נמצאו מוזמנים בשם &quot;{searchQuery.trim()}&quot;
                </td>
              </tr>
            ) : null}
            {visibleInvitees.map((invitee) => {
              const link = invitee.inviteLink;
              const status = STATUS_STYLE[statusOf(invitee)];
              const relTag = invitee.relation ? tagStyle(invitee.relation) : null;

              return (
                <tr key={invitee.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: avatarColor(invitee.name),
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {invitee.name.trim().charAt(0)}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setEditingInvitee(invitee)}
                          style={{ fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", font: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}
                        >
                          {invitee.name}
                          {invitee.name2 ? ` / ${invitee.name2}` : ""}
                        </button>
                        {invitee.phone && <div style={{ fontSize: 12, color: "#999" }}>{invitee.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {relTag ? (
                      <span style={{ ...pillStyle, background: relTag.bg, color: relTag.color }}>{invitee.relation}</span>
                    ) : (
                      <span style={{ color: "#bbb" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <LanguageCell invitee={invitee} projectId={projectId} defaultLanguage={defaultLanguage} enabledLanguages={languages} />
                  </td>
                  <td style={tdStyle}>
                    <AttendingCell invitee={invitee} projectId={projectId} />
                  </td>
                  <td style={tdStyle}>
                    {statusOf(invitee) === "pending" && link ? (
                      <form action={markInviteSent.bind(null, link.id, projectId)}>
                        <button
                          type="submit"
                          style={{ ...pillStyle, background: status.bg, color: status.color, border: "none", cursor: "pointer" }}
                          title="לחיצה תסמן כנשלח"
                        >
                          {status.label}
                        </button>
                      </form>
                    ) : (
                      <span style={{ ...pillStyle, background: status.bg, color: status.color }}>{status.label}</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <ProgressDots invitee={invitee} />
                  </td>
                  <td style={tdStyle}>{invitee.submission?.mediaAssets.length ?? 0}</td>
                  <td style={{ ...tdStyle, color: "#999", fontSize: 13 }} title={link?.firstViewedAt?.toLocaleString("he-IL") ?? ""}>
                    {link?.firstViewedAt ? link.firstViewedAt.toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td style={{ ...tdStyle, color: "#999", fontSize: 13 }} title={link?.lastViewedAt?.toLocaleString("he-IL") ?? ""}>
                    {link?.lastViewedAt ? link.lastViewedAt.toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td style={tdStyle}>
                    <RowActions
                      invitee={invitee}
                      projectId={projectId}
                      onPreview={() => setPreviewingInvitee(invitee)}
                      baseUrl={baseUrl}
                      celebrantNames={celebrantNames}
                      messageTemplates={messageTemplates}
                      defaultLanguage={defaultLanguage}
                    />
                  </td>
                </tr>
              );
            })}
            {invitees.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={10}>
                  אין עדיין מוזמנים.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Drawer onClose={() => setShowAdd(false)}>
          <AddInviteeForm projectId={projectId} defaultLanguage={defaultLanguage} enabledLanguages={languages} onSaved={() => setShowAdd(false)} />
        </Drawer>
      )}

      {showImport && (
        <Drawer onClose={() => setShowImport(false)}>
          <ImportInviteesFromSheet projectId={projectId} defaultLanguage={defaultLanguage} enabledLanguages={languages} onImported={() => setShowImport(false)} />
        </Drawer>
      )}

      {editingInvitee && (
        <Drawer onClose={() => setEditingInvitee(null)}>
          <EditInviteeForm projectId={projectId} invitee={editingInvitee} defaultLanguage={defaultLanguage} enabledLanguages={languages} onSaved={() => setEditingInvitee(null)} />
        </Drawer>
      )}

      {previewingInvitee && (
        <Modal onClose={() => setPreviewingInvitee(null)}>
          <AlbumPageView
            inviteeId={previewingInvitee.id}
            projectId={projectId}
            lang={toLangCode(previewingInvitee.language ?? defaultLanguage)}
            questions={questions}
            answers={Object.fromEntries((previewingInvitee.submission?.answers ?? []).map((a) => [a.questionId, a.text]))}
            dateLocation={previewingInvitee.submission?.dateLocation ?? null}
            blessingText={previewingInvitee.submission?.blessingText ?? null}
            blessingSignedBy={previewingInvitee.submission?.blessingSignedBy ?? null}
            additionalText={previewingInvitee.submission?.additionalText ?? null}
            photo={previewingInvitee.submission?.mediaAssets[0] ?? null}
            onClose={() => setPreviewingInvitee(null)}
          />
        </Modal>
      )}
    </div>
  );
}

const PROGRESS_STEPS = [
  { key: "sent", label: "נשלח" },
  { key: "viewed", label: "כניסה ראשונה" },
  { key: "answered", label: "נכתב טקסט" },
  { key: "photo", label: "התווספה תמונה" },
  { key: "submitted", label: "הוגש" },
] as const;

function ProgressDots({ invitee }: { invitee: Invitee }) {
  const link = invitee.inviteLink;
  const sub = invitee.submission;

  const done = [
    Boolean(link?.sentAt),
    Boolean(link?.firstViewedAt),
    Boolean(sub && sub.answers.length > 0),
    Boolean(sub && sub.mediaAssets.length > 0),
    Boolean(sub?.submittedAt),
  ];

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {PROGRESS_STEPS.map((step, i) => {
        const title =
          i === 1
            ? link?.firstViewedAt
              ? `נפתח לראשונה: ${link.firstViewedAt.toLocaleString("he-IL")}`
              : "טרם נפתח"
            : step.label;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && <div style={{ width: 16, height: 2, background: done[i] ? "#22c55e" : "#ddd" }} />}
            <div
              title={title}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: done[i] ? "#22c55e" : "#ddd",
                flexShrink: 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function RowActions({
  invitee,
  projectId,
  onPreview,
  baseUrl,
  celebrantNames,
  messageTemplates,
  defaultLanguage,
}: {
  invitee: Invitee;
  projectId: string;
  onPreview: () => void;
  baseUrl: string;
  celebrantNames: string;
  messageTemplates: MessageTemplates;
  defaultLanguage: string;
}) {
  const link = invitee.inviteLink;
  const personalLink = link && !link.revokedAt ? `${baseUrl}/i/${link.token}` : null;
  const effectiveLang = invitee.language ?? defaultLanguage;
  const templates = templatesForLanguage(messageTemplates, effectiveLang);
  const guestName = invitee.name.trim() + (invitee.name2 ? ` / ${invitee.name2}` : "");

  const vars = personalLink ? { guestName, celebrantNames, personalLink } : null;
  const whatsappText = vars ? applyTemplate(templates.whatsapp, vars) : null;
  const emailSubjectText = vars ? applyTemplate(templates.emailSubject, vars) : null;
  const emailBodyText = vars ? applyTemplate(templates.emailBody, vars) : null;

  const noLinkReason = "אין קישור אישי פעיל למוזמן/ת זה/ו";
  const noTemplateReason = "לא הוגדרה תבנית לשפה הזו (הגדרות הפרויקט)";
  // Album-page preview needs a real submission to show — same disabled/dimmed
  // pattern as CopyTemplateButton below (opacity + title, not hidden, so the
  // row's icon layout stays stable regardless of status).
  const noSubmissionReason = "המוזמן/ת עדיין לא שלח/ה — אין מה להציג";
  const canPreview = Boolean(invitee.submission);

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        type="button"
        onClick={canPreview ? onPreview : undefined}
        disabled={!canPreview}
        style={{ ...iconButtonStyle, opacity: canPreview ? 1 : 0.35, cursor: canPreview ? "pointer" : "default" }}
        title={canPreview ? "עיון" : noSubmissionReason}
        aria-label="עיון"
      >
        <EyeIcon />
      </button>
      <CopyTemplateButton
        icon={<LinkIcon />}
        label="העתקת קישור אישי"
        text={personalLink}
        disabledReason={noLinkReason}
      />
      <CopyTemplateButton
        icon={<WhatsAppIcon />}
        label="העתקת הודעת וואטסאפ"
        text={whatsappText}
        disabledReason={personalLink ? noTemplateReason : noLinkReason}
      />
      <CopyTemplateButton
        icon={<EnvelopeIcon />}
        label="העתקת נושא המייל"
        text={emailSubjectText}
        disabledReason={personalLink ? noTemplateReason : noLinkReason}
      />
      <CopyTemplateButton
        icon={<EnvelopeBodyIcon />}
        label="העתקת גוף המייל"
        text={emailBodyText}
        disabledReason={personalLink ? noTemplateReason : noLinkReason}
      />
      <MoreMenu invitee={invitee} projectId={projectId} />
    </div>
  );
}

// Icon button that, on hover, previews the exact final text (after
// {{guest_name}}/{{celebrant_names}}/{{personal_link}} substitution) in a
// small floating box — same visual language as MoreMenu/AddInviteeMenu's
// dropdowns elsewhere in this file (white box, border, shadow, radius), just
// triggered by hover instead of a click, and anchored above the button so it
// can't be clipped by the next table row. On click, copies that same text
// and swaps the preview for a brief "הועתק" confirmation.
function CopyTemplateButton({
  icon,
  label,
  text,
  disabledReason,
}: {
  icon: React.ReactNode;
  label: string;
  text: string | null;
  disabledReason: string;
}) {
  const [hovering, setHovering] = useState(false);
  const [copied, setCopied] = useState(false);
  const disabled = !text;

  function handleClick() {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setHovering(false);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => !disabled && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        style={{ ...iconButtonStyle, opacity: disabled ? 0.35 : 1, cursor: disabled ? "default" : "pointer" }}
        title={disabled ? disabledReason : undefined}
        aria-label={label}
      >
        {icon}
      </button>

      {hovering && !copied && text && (
        <div style={hoverPreviewStyle} role="tooltip">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 4 }}>{label}</div>
          <div>{text}</div>
        </div>
      )}

      {copied && <div style={copiedBadgeStyle}>הועתק</div>}
    </div>
  );
}

function AddInviteeMenu({ onAddSingle, onImportFromSheet }: { onAddSingle: () => void; onImportFromSheet: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={addButtonStyle}>
        + פעולות
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineEnd: 0,
            minWidth: 190,
            background: "white",
            border: "1px solid #eee",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            padding: 6,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddSingle();
            }}
            style={menuItemStyle}
          >
            הוספת מוזמן בודד
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onImportFromSheet();
            }}
            style={menuItemStyle}
          >
            ייבוא רשימה מגוגל שיטס
          </button>
        </div>
      )}
    </div>
  );
}

function MoreMenu({ invitee, projectId }: { invitee: Invitee; projectId: string }) {
  const router = useRouter();
  const link = invitee.inviteLink;
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleDelete() {
    if (!window.confirm(`למחוק לצמיתות את "${invitee.name}"? הפעולה בלתי הפיכה ותמחק גם את התשובות והתמונות שהתקבלו ממנו/ה.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteInvitee(invitee.id, projectId);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={iconButtonStyle} title="פעולות נוספות" aria-label="פעולות נוספות">
        <MoreIcon />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineEnd: 0,
            minWidth: 170,
            background: "white",
            border: "1px solid #eee",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            padding: 6,
            zIndex: 10,
          }}
        >
          {link && !link.revokedAt && (
            <form action={revokeInviteLink.bind(null, link.id, projectId)}>
              <button type="submit" style={menuItemStyle}>
                ביטול קישור
              </button>
            </form>
          )}
          {link && link.revokedAt && (
            <form action={regenerateInviteLink.bind(null, link.id, projectId)}>
              <button type="submit" style={menuItemStyle}>
                יצירת קישור חדש
              </button>
            </form>
          )}
          <button type="button" onClick={handleDelete} disabled={deleting} style={{ ...menuItemStyle, color: "#c0392b" }}>
            {deleting ? "מוחקת..." : "מחיקת מוזמן"}
          </button>
        </div>
      )}
    </div>
  );
}

const LANGUAGE_TOGGLE_OPTIONS: { value: string; label: string }[] = [
  { value: "HE", label: "עב" },
  { value: "RU", label: "רו" },
  { value: "EN", label: "en" },
];

// Picks the language(s) an invitee can be assigned to, per the UX spec:
// only the album's enabled languages are offered, with `value` (the current
// invitee's language) kept visible even if it's since been disabled for the
// project, so an existing invitee's real state is never hidden — the admin
// just can't newly select a disabled language going forward.
function inviteeLanguageOptions(enabledLanguages: string[], value: string): { value: string; label: string }[] {
  return LANGUAGE_TOGGLE_OPTIONS.filter((opt) => enabledLanguages.includes(opt.value) || opt.value === value);
}

function LanguageToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <span style={labelStyle}>שפה</span>
      <input type="hidden" name="language" value={value} />
      <div style={{ display: "flex", gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              ...languageToggleBtnStyle,
              background: value === opt.value ? "#1f1f1f" : "white",
              color: value === opt.value ? "white" : "#666",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function InlineChipMenu({
  trigger,
  options,
  onSelect,
}: {
  trigger: React.ReactNode;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSelect(value: string) {
    setOpen(false);
    setSaving(true);
    try {
      await onSelect(value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", opacity: saving ? 0.5 : 1 }}
      >
        {trigger}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineStart: 0,
            minWidth: 110,
            background: "white",
            border: "1px solid #eee",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            padding: 6,
            zIndex: 10,
          }}
        >
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => handleSelect(opt.value)} style={menuItemStyle}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendingCell({ invitee, projectId }: { invitee: Invitee; projectId: string }) {
  const router = useRouter();
  const style = invitee.attending ? ATTENDING_STYLE[invitee.attending] : ATTENDING_UNSET_STYLE;

  async function handleSelect(value: string) {
    await updateInviteeAttending(invitee.id, projectId, value as "YES" | "NO" | "MAYBE");
    router.refresh();
  }

  return (
    <InlineChipMenu
      trigger={<span style={{ ...pillStyle, background: style.bg, color: style.color }}>{style.label}</span>}
      options={[
        { value: "YES", label: "כן" },
        { value: "NO", label: "לא" },
        { value: "MAYBE", label: "אולי" },
      ]}
      onSelect={handleSelect}
    />
  );
}

function LanguageCell({
  invitee,
  projectId,
  defaultLanguage,
  enabledLanguages,
}: {
  invitee: Invitee;
  projectId: string;
  defaultLanguage: string;
  enabledLanguages: string[];
}) {
  const router = useRouter();
  const effective = invitee.language ?? defaultLanguage;
  // Same rule as LanguageToggle: only the album's enabled languages are
  // offered, plus the invitee's current language even if it's since been
  // disabled, so it stays visible/selectable-away-from rather than vanishing.
  const options = (["HE", "RU", "EN"] as const)
    .filter((v) => enabledLanguages.includes(v) || v === invitee.language)
    .map((v) => ({ value: v, label: LANGUAGE_LABEL[v] }));

  async function handleSelect(value: string) {
    await updateInviteeLanguage(invitee.id, projectId, value as "HE" | "RU" | "EN");
    router.refresh();
  }

  return (
    <InlineChipMenu
      trigger={<span style={{ color: invitee.language ? "#333" : "#aaa", textDecoration: "underline", textUnderlineOffset: 3 }}>{LANGUAGE_LABEL[effective] ?? effective}</span>}
      options={options}
      onSelect={handleSelect}
    />
  );
}

function AddInviteeForm({
  projectId,
  defaultLanguage,
  enabledLanguages,
  onSaved,
}: {
  projectId: string;
  defaultLanguage: string;
  enabledLanguages: string[];
  onSaved: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // One language -> auto-selected. Several -> preselect the album's default
  // (falling back to the first enabled one if the default itself somehow
  // isn't enabled).
  const [language, setLanguage] = useState(() =>
    enabledLanguages.length === 1 ? enabledLanguages[0] : enabledLanguages.includes(defaultLanguage) ? defaultLanguage : enabledLanguages[0] ?? ""
  );
  const options = LANGUAGE_TOGGLE_OPTIONS.filter((opt) => enabledLanguages.includes(opt.value));
  const noLanguagesAvailable = enabledLanguages.length === 0;
  // Optional photo, attached right after creation via the same admin upload
  // flow AlbumPageView already uses (sign → Cloudinary → addInviteeMediaAsset)
  // — saved as this invitee's real photo answer (Submission.mediaAssets[0]),
  // so the guest wizard shows it as already-uploaded and can keep/replace/
  // delete it with its existing functionality, no new mechanism.
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { id: inviteeId } = await addInvitee(projectId, new FormData(e.currentTarget));
      if (photoFile) {
        try {
          const signRes = await fetch("/api/admin/invitee-photo-sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviteeId, projectId }),
          });
          if (!signRes.ok) throw new Error();
          const sign = await signRes.json();

          const uploadData = new FormData();
          uploadData.append("file", photoFile);
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
          if (!uploadRes.ok) throw new Error();
          const uploaded = await uploadRes.json();

          await addInviteeMediaAsset(inviteeId, projectId, {
            cloudinaryPublicId: uploaded.public_id,
            url: uploaded.secure_url,
            width: uploaded.width,
            height: uploaded.height,
            format: uploaded.format,
          });
        } catch {
          // The invitee itself was already created successfully — per spec,
          // creating without a photo must stay possible, so a photo hiccup
          // here shouldn't undo that. Surface it distinctly and keep the
          // drawer open so the admin sees it (an unqualified onSaved() here
          // would close the drawer before the message is readable); the
          // photo can be added afterwards from the invitee's own album view.
          setError("המוזמן/ת נוצר/ה בהצלחה, אך העלאת התמונה נכשלה — אפשר להוסיף אותה אח\"כ דרך תצוגת האלבום.");
          setSubmitting(false);
          router.refresh();
          return;
        }
      }
      onSaved();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>הוספת מוזמן</h2>
      <div style={rowStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            <span style={labelStyle}>שם</span>
            <input name="name" placeholder="חובה" required style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>טלפון</span>
            <input name="phone" style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>אימייל</span>
            <input name="email" type="email" style={inputStyle} />
          </label>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            <span style={labelStyle}>שם שני (אופציונלי, לזוגות)</span>
            <input name="name2" style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>טלפון שני (אופציונלי)</span>
            <input name="phone2" style={inputStyle} />
          </label>
        </div>
      </div>
      <div>
        <span style={labelStyle}>קרבה</span>
        <RelationSelect />
      </div>
      <LanguageToggle value={language} onChange={setLanguage} options={options} />
      <label>
        <span style={labelStyle}>הערות</span>
        <textarea name="notes" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </label>
      <label>
        <span style={labelStyle}>תמונה (אופציונלי)</span>
        {/* Same accept filter as the guest wizard's own photo step
            (PhotoStep.tsx) and AlbumPageView's admin upload button — no new
            validation rules introduced. Pre-loads the invitee's photo answer
            before the link is ever sent; the guest wizard then shows it as
            already-uploaded and can keep/replace/delete it as usual. */}
        {/* No `name` attribute — the selected file is tracked in
            `photoFile` state and uploaded separately (see handleSubmit), not
            submitted as part of the addInvitee FormData. */}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          style={inputStyle}
        />
      </label>
      {noLanguagesAvailable && (
        <p style={{ color: "#b00020", fontSize: 14 }}>לא הוגדרו שפות לפרויקט זה — אי אפשר להוסיף מוזמן. עדכני את שפות הפרויקט בהגדרות.</p>
      )}
      {error && <p style={{ color: "#b00020", fontSize: 14 }}>{error}</p>}
      <button type="submit" disabled={submitting || noLanguagesAvailable} style={buttonStyle}>
        {submitting ? "מוסיפה..." : "הוספת מוזמן"}
      </button>
    </form>
  );
}

function EditInviteeForm({
  projectId,
  invitee,
  defaultLanguage,
  enabledLanguages,
  onSaved,
}: {
  projectId: string;
  invitee: Invitee;
  defaultLanguage: string;
  enabledLanguages: string[];
  onSaved: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState(invitee.language ?? defaultLanguage);
  // Keeps the invitee's current language visible/selectable-away-from even if
  // it's since been disabled for the album (see inviteeLanguageOptions).
  const options = inviteeLanguageOptions(enabledLanguages, language);
  // Same photo answer as AddInviteeForm/AlbumPageView — seeded here from the
  // invitee's real Submission.mediaAssets[0] (already loaded on this Invitee
  // type) so an existing photo shows for keep/replace/delete, matching the
  // guest wizard's own existingPhotoUrl behavior.
  const [photo, setPhoto] = useState(invitee.submission?.mediaAssets[0] ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateInvitee(invitee.id, projectId, new FormData(e.currentTarget));
      if (photoFile) {
        try {
          const signRes = await fetch("/api/admin/invitee-photo-sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviteeId: invitee.id, projectId }),
          });
          if (!signRes.ok) throw new Error();
          const sign = await signRes.json();

          const uploadData = new FormData();
          uploadData.append("file", photoFile);
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
          if (!uploadRes.ok) throw new Error();
          const uploaded = await uploadRes.json();

          // Replace, not accumulate — same rule as everywhere else a photo
          // answer is set (AlbumPageView, the real guest submission route).
          if (photo) {
            await deleteMediaAsset(photo.id, projectId);
          }
          await addInviteeMediaAsset(invitee.id, projectId, {
            cloudinaryPublicId: uploaded.public_id,
            url: uploaded.secure_url,
            width: uploaded.width,
            height: uploaded.height,
            format: uploaded.format,
          });
        } catch {
          setError("הפרטים נשמרו, אך העלאת התמונה נכשלה — אפשר לנסות שוב.");
          setSubmitting(false);
          router.refresh();
          return;
        }
      }
      onSaved();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
      setSubmitting(false);
    }
  }

  async function handleDeletePhoto() {
    if (!photo) return;
    if (!window.confirm("למחוק את התמונה הזו?")) return;
    setDeletingPhoto(true);
    setError(null);
    try {
      await deleteMediaAsset(photo.id, projectId);
      setPhoto(null);
      router.refresh();
    } catch {
      setError("מחיקת התמונה נכשלה, נסי שוב");
    } finally {
      setDeletingPhoto(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>עריכת מוזמן</h2>
      <div style={rowStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            <span style={labelStyle}>שם</span>
            <input name="name" defaultValue={invitee.name} placeholder="חובה" required style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>טלפון</span>
            <input name="phone" defaultValue={invitee.phone ?? ""} style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>אימייל</span>
            <input name="email" type="email" defaultValue={invitee.email ?? ""} style={inputStyle} />
          </label>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            <span style={labelStyle}>שם שני (אופציונלי)</span>
            <input name="name2" defaultValue={invitee.name2 ?? ""} style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>טלפון שני (אופציונלי)</span>
            <input name="phone2" defaultValue={invitee.phone2 ?? ""} style={inputStyle} />
          </label>
        </div>
      </div>
      <div>
        <span style={labelStyle}>קרבה</span>
        <RelationSelect initialValue={invitee.relation ?? ""} />
      </div>
      <LanguageToggle value={language} onChange={setLanguage} options={options} />
      <label>
        <span style={labelStyle}>הערות</span>
        <textarea name="notes" defaultValue={invitee.notes ?? ""} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </label>
      <div>
        <span style={labelStyle}>תמונה (אופציונלי)</span>
        {photo && !photoFile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={photo.url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
            <button type="button" onClick={handleDeletePhoto} disabled={deletingPhoto} style={photoActionButtonStyle}>
              {deletingPhoto ? "מוחקת..." : "מחיקת תמונה"}
            </button>
            <label style={{ ...photoActionButtonStyle, cursor: "pointer" }}>
              החלפת תמונה
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
            </label>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*,.heic,.heif"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            style={inputStyle}
          />
        )}
        {photoFile && <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>ייטען בעת השמירה: {photoFile.name}</p>}
      </div>
      {error && <p style={{ color: "#b00020", fontSize: 14 }}>{error}</p>}
      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "שומר..." : "שמירה"}
      </button>
    </form>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  // Fills the flex:1 wrapper the page gives it (stretches the frame down to
  // the viewport bottom instead of shrink-wrapping the table) — minHeight:0
  // lets it shrink below the table's natural size so the table's own
  // overflow-x wrapper below can scroll internally instead of the card
  // growing past the viewport.
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
};

const addButtonStyle: React.CSSProperties = {
  background: "#1f1f1f",
  color: "white",
  border: "none",
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  width: "fit-content",
};

const thStyle: React.CSSProperties = {
  textAlign: "right",
  padding: "0 10px 12px",
  color: "#999",
  fontSize: 12,
  fontWeight: 500,
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = { padding: "12px 10px", whiteSpace: "nowrap" };

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
};

const iconButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  padding: 0,
  border: "1px solid #eee",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
  color: "#666",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// CopyTemplateButton's hover preview — same box styling as MoreMenu/
// AddInviteeMenu's dropdowns (white/border/shadow/radius) so it reads as
// the same "small floating panel" pattern already used in this file, just
// anchored above the button (bottom: 100%) instead of below.
const hoverPreviewStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 6px)",
  insetInlineEnd: 0,
  width: 280,
  maxHeight: 260,
  overflowY: "auto",
  background: "white",
  border: "1px solid #eee",
  borderRadius: 10,
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  padding: 10,
  fontSize: 13,
  color: "#333",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  textAlign: "start",
  zIndex: 20,
};

const copiedBadgeStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 6px)",
  insetInlineEnd: 0,
  background: "#1f1f1f",
  color: "white",
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 999,
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  whiteSpace: "nowrap",
  zIndex: 20,
};

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M8.3 11.7a3 3 0 0 0 4.25 0l2-2a3 3 0 0 0-4.25-4.25l-1.1 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.7 8.3a3 3 0 0 0-4.25 0l-2 2a3 3 0 0 0 4.25 4.25l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="4.5" cy="10" r="1.3" fill="currentColor" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.3" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M4 17.5 5 14A7 7 0 1 1 8 16.5L4 17.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 5.5 10 11l7-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EnvelopeBodyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 9h9M5.5 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 10px",
  borderRadius: 6,
  fontSize: 13,
  color: "#222",
  textAlign: "start",
  border: "none",
  background: "none",
  cursor: "pointer",
  font: "inherit",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 15,
  border: "1px solid #ccc",
  borderRadius: 6,
  width: "100%",
};

const searchInputStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 13,
  border: "1px solid #ddd",
  borderRadius: 999,
  width: 200,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#333",
  marginBottom: 4,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 15,
  background: "#1f1f1f",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  width: "fit-content",
};

// Small bordered button for the photo field's "delete"/"replace" actions in
// EditInviteeForm — same weight as buttonStyle below but lighter, since these
// are secondary to the form's main "שמירה" action.
const photoActionButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  color: "#333",
  background: "white",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};

const languageToggleBtnStyle: React.CSSProperties = {
  minWidth: 40,
  height: 32,
  padding: "0 10px",
  fontSize: 13,
  fontWeight: 600,
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Drawer from "../Drawer";
import RelationSelect from "./RelationSelect";
import SubmissionPreview from "./SubmissionPreview";
import ImportInviteesFromSheet from "./ImportInviteesFromSheet";
import {
  addInvitee,
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
    dateLocation: string | null;
    mediaAssets: { id: string; url: string }[];
    answers: { id: string; questionId: string; text: string }[];
  } | null;
};

type QuestionRef = { id: string; text: string };

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
  celebrantNames: string;
  messageTemplates: MessageTemplates;
};

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
  viewed: { bg: "#e8f0fe", color: "#1a56db", label: "נפתח" },
  sent: { bg: "#fef6e0", color: "#a15c00", label: "נשלח" },
  pending: { bg: "#f1f1f1", color: "#777", label: "טרם נשלח" },
};

function statusOf(invitee: Invitee): keyof typeof STATUS_STYLE {
  if (invitee.submission) return "submitted";
  if (invitee.inviteLink?.firstViewedAt) return "viewed";
  if (invitee.inviteLink?.sentAt) return "sent";
  return "pending";
}

export default function InviteesTable({ projectId, baseUrl, invitees, questions, defaultLanguage, celebrantNames, messageTemplates }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingInvitee, setEditingInvitee] = useState<Invitee | null>(null);
  const [viewingInvitee, setViewingInvitee] = useState<Invitee | null>(null);
  const [previewingInvitee, setPreviewingInvitee] = useState<Invitee | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyLink(inviteeId: string, token: string) {
    navigator.clipboard.writeText(`${baseUrl}/i/${token}`).then(() => {
      setCopiedId(inviteeId);
      setTimeout(() => setCopiedId((v) => (v === inviteeId ? null : v)), 1500);
    });
  }

  return (
    <div style={cardStyle}>
      <div style={headerRowStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>מוזמנים ({invitees.length})</h2>
        <AddInviteeMenu onAddSingle={() => setShowAdd(true)} onImportFromSheet={() => setShowImport(true)} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={thStyle}>שם מלא</th>
              <th style={thStyle}>קרבה</th>
              <th style={thStyle}>שפה</th>
              <th style={thStyle}>מגיעה לאירוע</th>
              <th style={thStyle}>סטטוס</th>
              <th style={thStyle}>התקדמות</th>
              <th style={thStyle}>תמונות</th>
              <th style={thStyle}>כניסה ראשונה</th>
              <th style={thStyle}>כניסה אחרונה</th>
              <th style={thStyle}>קישור</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {invitees.map((invitee) => {
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
                          onClick={() => setViewingInvitee(invitee)}
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
                    <LanguageCell invitee={invitee} projectId={projectId} defaultLanguage={defaultLanguage} />
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
                    {link && !link.revokedAt ? (
                      <button type="button" onClick={() => copyLink(invitee.id, link.token)} style={iconButtonStyle} aria-label="העתקת קישור">
                        {copiedId === invitee.id ? <CheckIcon /> : <LinkIcon />}
                      </button>
                    ) : (
                      <span style={{ color: "#bbb" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <RowActions
                      invitee={invitee}
                      projectId={projectId}
                      onEdit={() => setEditingInvitee(invitee)}
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
                <td style={tdStyle} colSpan={11}>
                  אין עדיין מוזמנים.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Drawer onClose={() => setShowAdd(false)}>
          <AddInviteeForm projectId={projectId} defaultLanguage={defaultLanguage} onSaved={() => setShowAdd(false)} />
        </Drawer>
      )}

      {showImport && (
        <Drawer onClose={() => setShowImport(false)}>
          <ImportInviteesFromSheet projectId={projectId} defaultLanguage={defaultLanguage} onImported={() => setShowImport(false)} />
        </Drawer>
      )}

      {editingInvitee && (
        <Drawer onClose={() => setEditingInvitee(null)}>
          <EditInviteeForm projectId={projectId} invitee={editingInvitee} defaultLanguage={defaultLanguage} onSaved={() => setEditingInvitee(null)} />
        </Drawer>
      )}

      {viewingInvitee && (
        <Drawer onClose={() => setViewingInvitee(null)}>
          <InviteeSubmissionView invitee={viewingInvitee} questions={questions} />
        </Drawer>
      )}

      {previewingInvitee && (
        <Drawer onClose={() => setPreviewingInvitee(null)}>
          <SubmissionPreview
            inviteeId={previewingInvitee.id}
            projectId={projectId}
            inviteeName={previewingInvitee.name}
            photos={previewingInvitee.submission?.mediaAssets ?? []}
            dateLocation={previewingInvitee.submission?.dateLocation ?? null}
            answers={(previewingInvitee.submission?.answers ?? []).map((a) => ({
              questionText: questions.find((q) => q.id === a.questionId)?.text ?? "שאלה",
              text: a.text,
            }))}
          />
        </Drawer>
      )}
    </div>
  );
}

function InviteeSubmissionView({ invitee, questions }: { invitee: Invitee; questions: QuestionRef[] }) {
  const sub = invitee.submission;
  const questionById = new Map(questions.map((q) => [q.id, q.text]));
  const photoUrl = sub?.mediaAssets[0]?.url ?? null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, margin: 0 }}>
          {invitee.name}
          {invitee.name2 ? ` / ${invitee.name2}` : ""}
        </h2>
        <p style={{ fontSize: 13, color: "#999", margin: "4px 0 0" }}>מה שנשמר עד כה</p>
      </div>

      {!sub && <p style={{ color: "#999" }}>עדיין לא נשמר כלום מהמוזמן/ת הזה/ו.</p>}

      {sub && (
        <>
          {photoUrl && (
            <img src={photoUrl} alt="" style={{ width: "100%", borderRadius: 12, display: "block" }} />
          )}

          {sub.dateLocation && (
            <div>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#999", marginBottom: 6 }}>
                תאריך ומקום
              </span>
              <p style={{ margin: 0, fontSize: 14, color: "#333" }}>{sub.dateLocation}</p>
            </div>
          )}

          {sub.answers.length === 0 && !photoUrl && !sub.dateLocation && (
            <p style={{ color: "#999" }}>לא נכתב עדיין תוכן.</p>
          )}

          <div style={{ display: "grid", gap: 16 }}>
            {sub.answers.map((a) => (
              <div key={a.id}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 4 }}>
                  {questionById.get(a.questionId) ?? "שאלה"}
                </span>
                <p style={{ margin: 0, fontSize: 15, color: "#222", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{a.text}</p>
              </div>
            ))}
          </div>
        </>
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
  onEdit,
  onPreview,
  baseUrl,
  celebrantNames,
  messageTemplates,
  defaultLanguage,
}: {
  invitee: Invitee;
  projectId: string;
  onEdit: () => void;
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

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button type="button" onClick={onPreview} style={iconButtonStyle} title="עיון" aria-label="עיון">
        <EyeIcon />
      </button>
      <button type="button" onClick={onEdit} style={iconButtonStyle} title="עריכה" aria-label="עריכה">
        <PencilIcon />
      </button>
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

function LanguageToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span style={labelStyle}>שפה</span>
      <input type="hidden" name="language" value={value} />
      <div style={{ display: "flex", gap: 6 }}>
        {LANGUAGE_TOGGLE_OPTIONS.map((opt) => (
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

function LanguageCell({ invitee, projectId, defaultLanguage }: { invitee: Invitee; projectId: string; defaultLanguage: string }) {
  const router = useRouter();
  const effective = invitee.language ?? defaultLanguage;

  async function handleSelect(value: string) {
    await updateInviteeLanguage(invitee.id, projectId, value as "HE" | "RU" | "EN");
    router.refresh();
  }

  return (
    <InlineChipMenu
      trigger={<span style={{ color: invitee.language ? "#333" : "#aaa", textDecoration: "underline", textUnderlineOffset: 3 }}>{LANGUAGE_LABEL[effective] ?? effective}</span>}
      options={[
        { value: "HE", label: "עברית" },
        { value: "RU", label: "רוסית" },
        { value: "EN", label: "אנגלית" },
      ]}
      onSelect={handleSelect}
    />
  );
}

function AddInviteeForm({
  projectId,
  defaultLanguage,
  onSaved,
}: {
  projectId: string;
  defaultLanguage: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await addInvitee(projectId, new FormData(e.currentTarget));
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
      <LanguageToggle value={language} onChange={setLanguage} />
      <label>
        <span style={labelStyle}>הערות</span>
        <textarea name="notes" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </label>
      {error && <p style={{ color: "#b00020", fontSize: 14 }}>{error}</p>}
      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "מוסיפה..." : "הוספת מוזמן"}
      </button>
    </form>
  );
}

function EditInviteeForm({
  projectId,
  invitee,
  defaultLanguage,
  onSaved,
}: {
  projectId: string;
  invitee: Invitee;
  defaultLanguage: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState(invitee.language ?? defaultLanguage);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateInvitee(invitee.id, projectId, new FormData(e.currentTarget));
      onSaved();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
      setSubmitting(false);
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
      <LanguageToggle value={language} onChange={setLanguage} />
      <label>
        <span style={labelStyle}>הערות</span>
        <textarea name="notes" defaultValue={invitee.notes ?? ""} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </label>
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

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M4 10.3 8 14l8-8.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path
        d="M13.3 3.8a1.6 1.6 0 0 1 2.3 0l.6.6a1.6 1.6 0 0 1 0 2.3L6.4 16.5l-3.2.7.7-3.2 9.4-9.4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
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

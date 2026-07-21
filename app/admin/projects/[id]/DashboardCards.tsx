type Props = {
  eventDate: Date | null;
  totalParticipants: number;
  startedCount: number;
  totalPhotos: number;
  submittedCount: number;
  children?: React.ReactNode;
};

export default function DashboardCards({
  eventDate,
  totalParticipants,
  startedCount,
  totalPhotos,
  submittedCount,
  children,
}: Props) {
  const startedPct = totalParticipants > 0 ? Math.round((startedCount / totalParticipants) * 100) : 0;
  const submittedPct = totalParticipants > 0 ? Math.round((submittedCount / totalParticipants) * 100) : 0;

  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
        marginBottom: 28,
      }}
    >
      {children}

      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <IconCircle color="#1a56db" bg="#e8f0fe">
            <PeopleIcon />
          </IconCircle>
          <span style={cardLabelStyle}>מוזמנים</span>
        </div>
        <div style={cardNumberStyle}>{totalParticipants}</div>
        <Badge color="#1a56db" bg="#e8f0fe">
          {startedCount} נכנסו לדף ({startedPct}%)
        </Badge>
      </div>

      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <IconCircle color="#0f9d58" bg="#e3f8ec">
            <PhotoStackIcon />
          </IconCircle>
          <span style={cardLabelStyle}>תמונות שהועלו</span>
        </div>
        <div style={cardNumberStyle}>{totalPhotos}</div>
        <Badge color="#0f9d58" bg="#e3f8ec">
          {submittedCount} הגישו ({submittedPct}%)
        </Badge>
      </div>

      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <IconCircle color="#e2703f" bg="#fdece3">
            <CalendarIcon />
          </IconCircle>
          <span style={cardLabelStyle}>עד האירוע</span>
        </div>
        {daysUntil === null ? (
          <>
            <div style={{ ...cardNumberStyle, fontSize: 16, color: "#b5b3ae" }}>לא נקבע</div>
            <Badge color="#a15c00" bg="#fef6e0">
              אין תאריך אירוע
            </Badge>
          </>
        ) : (
          <>
            <div style={cardNumberStyle}>{daysUntil >= 0 ? daysUntil : 0}</div>
            <Badge color="#e2703f" bg="#fdece3">
              {daysUntil >= 0 ? `ימים · ${eventDate!.toLocaleDateString("he-IL")}` : "האירוע כבר עבר"}
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}

export function IconCircle({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function Badge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        marginTop: 8,
        fontSize: 11,
        fontWeight: 700,
        color,
        background: bg,
        borderRadius: 999,
        padding: "3px 9px",
      }}
    >
      {children}
    </span>
  );
}

export function ImageIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7" cy="8" r="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 14.5 7.5 10l3 3 2.5-2.5L17 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 16c0-2.5 2.2-4.3 5-4.3s5 1.8 5 4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      <path d="M12.8 11.2c2.3.3 3.7 1.9 3.7 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function PhotoStackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="4.5" y="5.5" width="12" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 13V4.7A1.2 1.2 0 0 1 3.7 3.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="9.5" r="1.1" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

export const cardHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export const cardLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#555",
};

const cardNumberStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: "#1a1a1a",
  marginTop: 10,
};

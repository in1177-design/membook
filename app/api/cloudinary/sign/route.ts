import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "../../../../lib/prisma";

// Signs the exact params the browser will send straight to Cloudinary, so
// uploads never pass through our server (keeps large files off the Next.js
// functions) while still being tied to a real, non-expired invite.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;

  if (typeof token !== "string") {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const inviteLink = await prisma.inviteLink.findUnique({
    where: { token },
    include: { invitee: { include: { project: true } } },
  });

  if (!inviteLink || inviteLink.revokedAt) {
    return NextResponse.json({ error: "הקישור אינו תקף" }, { status: 404 });
  }

  const { invitee } = inviteLink;
  if (invitee.project.status === "CLOSED") {
    return NextResponse.json({ error: "הפרויקט נסגר ולא ניתן לערוך יותר" }, { status: 403 });
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return NextResponse.json({ error: "העלאת תמונות אינה מוגדרת עדיין" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // folder + tag are per-project (for the future "download all photos" ZIP);
  // public_id is per-invitee so files never collide, regardless of the
  // original filename on the visitor's phone.
  const folder = `book-mem/${invitee.projectId}`;
  const publicId = `${invitee.id}-${timestamp}`;
  const tag = `project-${invitee.projectId}`;

  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id: publicId,
    tags: tag,
    timestamp,
  };
  const sortedString = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");
  const signature = createHash("sha1").update(sortedString + apiSecret).digest("hex");

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, publicId, tag });
}

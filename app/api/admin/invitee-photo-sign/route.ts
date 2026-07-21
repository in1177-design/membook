import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Signs admin-side uploads of an invitee's photo (e.g. pre-loading one before
// the link is ever sent). Protected by middleware (/api/admin/:path*).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const inviteeId = body?.inviteeId;
  const projectId = body?.projectId;

  if (typeof inviteeId !== "string" || typeof projectId !== "string") {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return NextResponse.json({ error: "העלאת תמונות אינה מוגדרת עדיין" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `book-mem/${projectId}`;
  const publicId = `${inviteeId}-${timestamp}`;
  const tag = `project-${projectId}`;

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

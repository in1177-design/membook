import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

// Signs admin-side uploads (project cover images) that aren't tied to an
// invite token. Protected by middleware (/api/admin/:path*), unlike the
// public /api/cloudinary/sign used by guest submissions.
export async function POST() {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return NextResponse.json({ error: "העלאת תמונות אינה מוגדרת עדיין" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "book-mem/covers";
  const publicId = randomBytes(8).toString("hex");

  const paramsToSign: Record<string, string | number> = { folder, public_id: publicId, timestamp };
  const sortedString = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");
  const signature = createHash("sha1").update(sortedString + apiSecret).digest("hex");

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, publicId });
}

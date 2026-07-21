import { NextRequest, NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "הפרויקט לא נמצא" }, { status: 404 });
  }

  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { submission: { invitee: { projectId: id } } },
    include: { submission: { include: { invitee: true } } },
  });

  if (mediaAssets.length === 0) {
    return NextResponse.json({ error: "אין עדיין תמונות בפרויקט הזה" }, { status: 404 });
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", reject);
  });

  // Filenames carry the invitee's name (not the visitor's original filename)
  // so the ZIP is browsable on its own once handed off for album design.
  const usedNames = new Set<string>();
  for (const asset of mediaAssets) {
    const res = await fetch(asset.url);
    const buffer = Buffer.from(await res.arrayBuffer());

    const safeName = asset.submission.invitee.name.replace(/[\\/:*?"<>|]/g, "_");
    const ext = asset.format ?? "jpg";
    let filename = `${safeName}.${ext}`;
    let counter = 2;
    while (usedNames.has(filename)) {
      filename = `${safeName}-${counter}.${ext}`;
      counter += 1;
    }
    usedNames.add(filename);

    archive.append(buffer, { name: filename });
  }

  archive.finalize();
  await finished;
  const zipBuffer = Buffer.concat(chunks);

  // Content-Disposition must be ASCII-only (Hebrew names need the filename*
  // RFC 5987 form); ASCII "photos.zip" is the fallback for older clients.
  const encodedName = encodeURIComponent(`${project.name}-photos.zip`);

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="photos.zip"; filename*=UTF-8''${encodedName}`,
    },
  });
}

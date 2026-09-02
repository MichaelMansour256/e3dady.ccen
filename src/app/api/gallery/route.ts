import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    // Get all top-level folders (each = one event)
    const { folders } = await cloudinary.api.root_folders();

    const events = await Promise.all(
      folders.map(async (folder: { name: string; path: string }) => {
        const { resources } = await cloudinary.search
          .expression(`folder:${folder.path}`)
          .with_field("context")
          .sort_by("created_at", "desc")
          .max_results(500)
          .execute();

        return {
          name: folder.name,
          path: folder.path,
          photos: resources.map((r: { public_id: string; secure_url: string; width: number; height: number }) => ({
            id: r.public_id,
            url: r.secure_url,
            width: r.width,
            height: r.height,
          })),
        };
      })
    );

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

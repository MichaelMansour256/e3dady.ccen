import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const { resources } = await cloudinary.search
      .expression("folder:invitations")
      .sort_by("public_id", "desc")
      .max_results(200)
      .execute();

    const invitations = resources.map((r: { public_id: string; secure_url: string }) => ({
      // public_id format: invitations/YYYY-MM-DD
      date: r.public_id.replace("invitations/", "").split("_")[0],
      url: r.secure_url,
      publicId: r.public_id,
    }));

    return NextResponse.json(invitations);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

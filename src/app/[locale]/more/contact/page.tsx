import PageHeader from "@/components/PageHeader";
import SocialLinks from "@/components/SocialLinks";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title="Contact" icon="📬" />

      <div className="flex flex-col items-center gap-6 px-6 pt-8 text-center">
        {/* Church info */}
        <div className="w-full max-w-sm rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-6 backdrop-blur-sm">
          <p className="text-base font-semibold text-white">Christ Church – Ezbet El Nakhl</p>
          <p className="mt-1 text-sm text-blue-light/70">إجتماع شباب إعدادي</p>
        </div>

        {/* Social links */}
        <div className="w-full max-w-sm rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-6 backdrop-blur-sm">
          <p className="mb-4 text-sm font-semibold text-white">Follow Us</p>
          <SocialLinks />
        </div>

        {/* All links list */}
        <div className="w-full max-w-sm flex flex-col gap-2">
          {[
            { label: "Facebook", href: "https://www.facebook.com/e3dady.ccen" },
            { label: "Instagram", href: "https://www.instagram.com/e3dady.ccen" },
            { label: "TikTok", href: "https://www.tiktok.com/@e3dady.ccen" },
            { label: "YouTube", href: "https://www.youtube.com/@e3dady_ccen" },
            { label: "Linktree", href: "https://linktr.ee/e3dady.ccen" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-blue-mid/40 bg-blue-primary/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-mid/50 active:scale-95">
              {label}
              <span className="text-blue-light/50">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

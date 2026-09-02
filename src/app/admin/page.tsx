"use client";
import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";

type Photo = { id: string; url: string; width: number; height: number };
type GalleryEvent = { name: string; path: string; photos: Photo[] };
type SpecialEvent = { id: string; title: string; titleAr: string; date: string; time: string; description?: string; descriptionAr?: string };

const inputCls = "w-full rounded-xl bg-blue-dark/60 px-4 py-2 text-white placeholder-blue-light/40 outline-none ring-1 ring-blue-mid/40 focus:ring-blue-accent text-sm";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [tab, setTab] = useState<"gallery" | "events" | "verse" | "prayer">("gallery");

  // Prayer state
  type PrayerRequest = { id: string; name: string; request: string; pray_count: number; status: string; created_at: string };
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayerFilter, setPrayerFilter] = useState<"pending" | "approved" | "rejected">("pending");

  // Gallery state
  const [folders, setFolders] = useState<GalleryEvent[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Events state
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [newEvent, setNewEvent] = useState({ title: "", titleAr: "", date: "", time: "12:30", description: "", descriptionAr: "" });

  // Verse state
  const [verseForm, setVerseForm] = useState({ book: "19", chapter: "23", verse: "1", note: "" });
  const [verseSaved, setVerseSaved] = useState(false);

  const headers = { "x-admin-password": password };

  const fetchFolders = useCallback(async () => {
    const res = await fetch("/api/gallery");
    setFolders(await res.json());
  }, []);

  const fetchSpecialEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    setSpecialEvents(Array.isArray(data) ? data : []);
  }, []);

  const fetchPrayers = useCallback(async () => {
    const res = await fetch("/api/admin/prayer", { headers });
    const data = await res.json();
    setPrayers(Array.isArray(data) ? data : []);
  }, [password]);

  useEffect(() => {
    if (authed) { fetchFolders(); fetchSpecialEvents(); fetchPrayers(); }
  }, [authed, fetchFolders, fetchSpecialEvents, fetchPrayers]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    fetch("/api/admin/auth", { method: "POST", headers }).then((r) => {
      if (r.status === 401) { setAuthError(true); return; }
      setAuthed(true);
    });
  }

  async function createFolder() {
    if (!newFolder.trim()) return;
    await fetch("/api/admin/folder", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ name: newFolder.trim() }),
    });
    setNewFolder("");
    fetchFolders();
  }

  const onDrop = useCallback(async (files: File[]) => {
    if (!selectedFolder) return alert("Select an event folder first");
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Uploading ${i + 1} / ${files.length}`);
      const fd = new FormData();
      fd.append("folder", selectedFolder);
      fd.append("files", files[i]);
      await fetch("/api/admin/upload", { method: "POST", headers, body: fd });
    }
    setUploading(false);
    setUploadProgress("");
    fetchFolders();
  }, [selectedFolder, headers, fetchFolders]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, multiple: true });

  async function deletePhoto(publicId: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch("/api/admin/delete", {
      method: "DELETE",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
    fetchFolders();
  }

  async function addSpecialEvent() {
    if (!newEvent.title || !newEvent.date || !newEvent.time) return alert("Title, date and time are required");
    await fetch("/api/admin/events", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify(newEvent),
    });
    setNewEvent({ title: "", titleAr: "", date: "", time: "12:30", description: "", descriptionAr: "" });
    fetchSpecialEvents();
  }

  async function deleteSpecialEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    await fetch("/api/admin/events", {
      method: "DELETE",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchSpecialEvents();
  }

  const currentPhotos = folders.find((e) => e.path === selectedFolder)?.photos ?? [];

  if (!authed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #1a4db5 0%, #0f1f5c 70%)" }}>
        <div className="w-full max-w-sm rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-8 backdrop-blur-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-white">Admin Login</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
              className={inputCls} />
            {authError && <p className="text-sm text-red-400">Wrong password</p>}
            <button type="submit" className="rounded-xl bg-blue-accent py-3 font-semibold text-white hover:bg-blue-mid">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-2xl font-bold text-white">🛠 Admin Dashboard</h1>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {(["gallery", "events", "verse", "prayer"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-xl py-2 text-sm font-semibold transition ${tab === t ? "bg-blue-accent text-white" : "bg-blue-primary/40 text-blue-light/70"}`}>
              {t === "gallery" ? "🖼️ Gallery" : t === "events" ? "📅 Events" : t === "verse" ? "✨ Verse" : "🙏 Prayer"}
            </button>
          ))}
        </div>

        {/* ── GALLERY TAB ── */}
        {tab === "gallery" && (
          <>
            <section className="mb-4 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
              <h2 className="mb-3 font-semibold text-white">Create Event Folder</h2>
              <div className="flex gap-2">
                <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)}
                  placeholder="Event name (e.g. Camp 2025)" className={inputCls} />
                <button onClick={createFolder}
                  className="rounded-xl bg-blue-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-mid shrink-0">
                  Create
                </button>
              </div>
            </section>

            <section className="mb-4 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
              <h2 className="mb-3 font-semibold text-white">Upload Photos</h2>
              <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className={`${inputCls} mb-3`}>
                <option value="">— Select event folder —</option>
                {folders.map((e) => <option key={e.path} value={e.path}>{e.name}</option>)}
              </select>
              <div {...getRootProps()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 cursor-pointer transition ${isDragActive ? "border-blue-accent bg-blue-accent/10" : "border-blue-mid/40 hover:border-blue-accent/60"}`}>
                <input {...getInputProps()} />
                <span className="text-3xl mb-2">📸</span>
                <p className="text-sm text-blue-light/70">{isDragActive ? "Drop photos here…" : "Drag & drop or tap to select"}</p>
              </div>
              {uploading && <p className="mt-2 text-center text-sm text-blue-accent animate-pulse">{uploadProgress}</p>}
            </section>

            {selectedFolder && (
              <section className="rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
                <h2 className="mb-3 font-semibold text-white">
                  {folders.find((e) => e.path === selectedFolder)?.name} — {currentPhotos.length} photos
                </h2>
                {currentPhotos.length === 0 ? (
                  <p className="text-sm text-blue-light/50">No photos yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {currentPhotos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl group">
                        <Image src={photo.url} alt="" fill className="object-cover" sizes="33vw" />
                        <button onClick={() => deletePhoto(photo.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-2xl">
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* ── PRAYER TAB ── */}
        {tab === "prayer" && (
          <section className="rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
            <h2 className="mb-3 font-semibold text-white">🙏 Prayer Requests</h2>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {(["pending", "approved", "rejected"] as const).map((f) => (
                <button key={f} onClick={() => setPrayerFilter(f)}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                    prayerFilter === f ? "bg-blue-accent text-white" : "bg-blue-dark/40 text-blue-light/60"
                  }`}>
                  {f === "pending" ? `⏳ Pending (${prayers.filter(p => p.status === "pending").length})` :
                   f === "approved" ? `✅ Approved` : `❌ Rejected`}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {prayers.filter((p) => p.status === prayerFilter).length === 0 ? (
                <p className="text-sm text-blue-light/50 text-center py-4">No {prayerFilter} requests</p>
              ) : (
                prayers.filter((p) => p.status === prayerFilter).map((prayer) => (
                  <div key={prayer.id} dir="rtl"
                    className="rounded-xl bg-blue-dark/40 p-4 border border-blue-mid/20">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{prayer.name}</p>
                        <p className="text-xs text-blue-light/40">
                          {new Date(prayer.created_at).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        prayer.status === "pending" ? "bg-yellow-400/20 text-yellow-400" :
                        prayer.status === "approved" ? "bg-green-400/20 text-green-400" :
                        "bg-red-400/20 text-red-400"
                      }`}>{prayer.status}</span>
                    </div>
                    <p className="text-sm text-white/80 mb-3 leading-relaxed">{prayer.request}</p>
                    <div className="flex gap-2">
                      {prayer.status !== "approved" && (
                        <button onClick={async () => {
                          await fetch("/api/admin/prayer", { method: "PATCH", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ id: prayer.id, status: "approved" }) });
                          fetchPrayers();
                        }} className="flex-1 rounded-lg bg-green-500/20 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/30">
                          ✅ Approve
                        </button>
                      )}
                      {prayer.status !== "rejected" && (
                        <button onClick={async () => {
                          await fetch("/api/admin/prayer", { method: "PATCH", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ id: prayer.id, status: "rejected" }) });
                          fetchPrayers();
                        }} className="flex-1 rounded-lg bg-red-500/20 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30">
                          ❌ Reject
                        </button>
                      )}
                      <button onClick={async () => {
                        await fetch("/api/admin/prayer", { method: "DELETE", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ id: prayer.id }) });
                        fetchPrayers();
                      }} className="rounded-lg bg-blue-dark/60 px-3 py-1.5 text-xs text-blue-light/50 hover:text-red-400">
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ── VERSE TAB ── */}
        {tab === "verse" && (
          <section className="rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
            <h2 className="mb-3 font-semibold text-white">✨ Verse of the Week</h2>
            <div className="flex flex-col gap-2">
              <select value={verseForm.book} onChange={(e) => setVerseForm((p) => ({ ...p, book: e.target.value }))} className={inputCls} dir="rtl">
                {BIBLE_BOOKS.map((b) => (
                  <option key={b.nr} value={String(b.nr)}>{b.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input type="number" min={1} placeholder="Chapter" value={verseForm.chapter}
                  onChange={(e) => setVerseForm((p) => ({ ...p, chapter: e.target.value }))} className={`${inputCls} flex-1`} />
                <input type="number" min={1} placeholder="Verse" value={verseForm.verse}
                  onChange={(e) => setVerseForm((p) => ({ ...p, verse: e.target.value }))} className={`${inputCls} flex-1`} />
              </div>
              <input placeholder="ملاحظة (اختياري)" value={verseForm.note} dir="rtl"
                onChange={(e) => setVerseForm((p) => ({ ...p, note: e.target.value }))} className={inputCls} />
              <button onClick={async () => {
                const book = BIBLE_BOOKS.find((b) => b.nr === Number(verseForm.book));
                await fetch("/api/admin/verse", {
                  method: "POST",
                  headers: { ...headers, "content-type": "application/json" },
                  body: JSON.stringify({ book: Number(verseForm.book), bookName: book?.name, chapter: Number(verseForm.chapter), verse: Number(verseForm.verse), note: verseForm.note }),
                });
                setVerseSaved(true);
                setTimeout(() => setVerseSaved(false), 2000);
              }} className="rounded-xl bg-blue-accent py-2 text-sm font-semibold text-white hover:bg-blue-mid">
                {verseSaved ? "✅ Saved!" : "Save Verse"}
              </button>
            </div>
          </section>
        )}

        {/* ── EVENTS TAB ── */}
        {tab === "events" && (
          <>
            <section className="mb-4 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
              <h2 className="mb-3 font-semibold text-white">Add Special Event</h2>
              <div className="flex flex-col gap-2">
                <input placeholder="Title (English)" value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))} className={inputCls} />
                <input placeholder="العنوان (عربي)" value={newEvent.titleAr}
                  onChange={(e) => setNewEvent((p) => ({ ...p, titleAr: e.target.value }))} className={inputCls} dir="rtl" />
                <div className="flex gap-2">
                  <input type="date" value={newEvent.date}
                    onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))} className={`${inputCls} flex-1`} />
                  <input type="time" value={newEvent.time}
                    onChange={(e) => setNewEvent((p) => ({ ...p, time: e.target.value }))} className={`${inputCls} w-32`} />
                </div>
                <input placeholder="Description (English)" value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))} className={inputCls} />
                <input placeholder="الوصف (عربي)" value={newEvent.descriptionAr}
                  onChange={(e) => setNewEvent((p) => ({ ...p, descriptionAr: e.target.value }))} className={inputCls} dir="rtl" />
                <button onClick={addSpecialEvent}
                  className="rounded-xl bg-blue-accent py-2 text-sm font-semibold text-white hover:bg-blue-mid">
                  Add Event
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
              <h2 className="mb-3 font-semibold text-white">Special Events ({specialEvents.length})</h2>
              {specialEvents.length === 0 ? (
                <p className="text-sm text-blue-light/50">No special events yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {specialEvents.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-xl bg-blue-dark/40 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{e.title}</p>
                        <p className="text-xs text-blue-light/50">{e.date} · {e.time}</p>
                      </div>
                      <button onClick={() => deleteSpecialEvent(e.id)} className="text-red-400 text-lg hover:text-red-300">🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

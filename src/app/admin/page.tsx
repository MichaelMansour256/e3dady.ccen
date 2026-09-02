"use client";
import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

type Photo = { id: string; url: string; width: number; height: number };
type Event = { name: string; path: string; photos: Photo[] };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const headers = { "x-admin-password": password };

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/gallery");
    const data = await res.json();
    setEvents(data);
  }, []);

  useEffect(() => { if (authed) fetchEvents(); }, [authed, fetchEvents]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // We verify by making a test request
    fetch("/api/admin/folder", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ name: "__test_auth__" }),
    }).then((r) => {
      if (r.status === 401) { setAuthError(true); return; }
      setAuthed(true);
      // Delete the test folder silently
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
    fetchEvents();
  }

  const onDrop = useCallback(async (files: File[]) => {
    if (!selectedFolder) return alert("Select an event folder first");
    setUploading(true);
    setUploadProgress(`Uploading 0 / ${files.length}`);

    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append("folder", selectedFolder);
      fd.append("files", files[i]);
      await fetch("/api/admin/upload", { method: "POST", headers, body: fd });
      setUploadProgress(`Uploading ${i + 1} / ${files.length}`);
    }

    setUploading(false);
    setUploadProgress("");
    fetchEvents();
  }, [selectedFolder, headers, fetchEvents]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, multiple: true,
  });

  async function deletePhoto(publicId: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch("/api/admin/delete", {
      method: "DELETE",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
    fetchEvents();
  }

  const currentPhotos = events.find((e) => e.path === selectedFolder)?.photos ?? [];

  // Login screen
  if (!authed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #1a4db5 0%, #0f1f5c 70%)" }}>
        <div className="w-full max-w-sm rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-8 backdrop-blur-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-white">Admin Login</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
              className="rounded-xl bg-blue-dark/60 px-4 py-3 text-white placeholder-blue-light/40 outline-none ring-1 ring-blue-mid/40 focus:ring-blue-accent"
            />
            {authError && <p className="text-sm text-red-400">Wrong password</p>}
            <button type="submit"
              className="rounded-xl bg-blue-accent py-3 font-semibold text-white transition hover:bg-blue-mid">
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
        <h1 className="mb-6 text-2xl font-bold text-white">🛠 Admin — Gallery</h1>

        {/* Create event folder */}
        <section className="mb-6 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
          <h2 className="mb-3 font-semibold text-white">Create Event Folder</h2>
          <div className="flex gap-2">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Event name (e.g. Camp 2025)"
              className="flex-1 rounded-xl bg-blue-dark/60 px-4 py-2 text-white placeholder-blue-light/40 outline-none ring-1 ring-blue-mid/40 focus:ring-blue-accent text-sm"
            />
            <button onClick={createFolder}
              className="rounded-xl bg-blue-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-mid">
              Create
            </button>
          </div>
        </section>

        {/* Select folder + upload */}
        <section className="mb-6 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
          <h2 className="mb-3 font-semibold text-white">Upload Photos</h2>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="mb-3 w-full rounded-xl bg-blue-dark/60 px-4 py-2 text-white outline-none ring-1 ring-blue-mid/40 focus:ring-blue-accent text-sm">
            <option value="">— Select event folder —</option>
            {events.map((e) => (
              <option key={e.path} value={e.path}>{e.name}</option>
            ))}
          </select>

          <div {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition cursor-pointer ${
              isDragActive ? "border-blue-accent bg-blue-accent/10" : "border-blue-mid/40 hover:border-blue-accent/60"
            }`}>
            <input {...getInputProps()} />
            <span className="text-3xl mb-2">📸</span>
            <p className="text-sm text-blue-light/70">
              {isDragActive ? "Drop photos here…" : "Drag & drop photos or tap to select"}
            </p>
          </div>

          {uploading && (
            <p className="mt-2 text-center text-sm text-blue-accent animate-pulse">{uploadProgress}</p>
          )}
        </section>

        {/* Photos in selected folder */}
        {selectedFolder && (
          <section className="rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4">
            <h2 className="mb-3 font-semibold text-white">
              {events.find((e) => e.path === selectedFolder)?.name} — {currentPhotos.length} photos
            </h2>
            {currentPhotos.length === 0 ? (
              <p className="text-sm text-blue-light/50">No photos yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {currentPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl group">
                    <Image src={photo.url} alt="" fill className="object-cover" sizes="33vw" />
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-2xl">
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

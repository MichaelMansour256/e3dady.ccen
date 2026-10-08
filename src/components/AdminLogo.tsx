"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef } from "react";

const LONG_PRESS_MS = 3500;
const MOVE_THRESHOLD_PX = 12;

export default function AdminLogo({
  src,
  alt,
  shortName,
}: {
  src: string;
  alt: string;
  shortName: string;
}) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  function clearPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPointRef.current = null;
  }

  function cancelPress() {
    clearPress();
  }

  function startPress(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    clearPress();
    startPointRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    timerRef.current = setTimeout(() => {
      clearPress();
      router.push("/admin");
    }, LONG_PRESS_MS);
  }

  function trackPress(event: React.PointerEvent<HTMLDivElement>) {
    const start = startPointRef.current;
    if (!start) return;

    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (moved > MOVE_THRESHOLD_PX) cancelPress();
  }

  return (
    <div
      className="relative h-40 w-40 select-none touch-manipulation"
      onPointerDown={startPress}
      onPointerMove={trackPress}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onLostPointerCapture={cancelPress}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      aria-label={`${shortName} logo`}
    >
      <div className="absolute inset-0 rounded-full bg-blue-accent/25 blur-2xl scale-125" />
      <div className="relative h-full w-full overflow-hidden rounded-full shadow-2xl shadow-blue-accent/40 ring-4 ring-blue-accent/50">
        <Image
          src={src}
          alt={alt}
          width={160}
          height={160}
          className="h-full w-full object-cover"
          priority
          draggable={false}
        />
      </div>
    </div>
  );
}

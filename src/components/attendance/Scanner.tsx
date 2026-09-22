/**
 * Camera QR scanner for /admin/attendance/scan.
 *
 * • Uses the native BarcodeDetector API where it exists (Android Chrome) and
 *   falls back to jsQR + a canvas so iPhone Safari works too.
 * • Camera permission is requested only after the servant taps "تشغيل الكاميرا".
 * • `onToken` receives a validated token; the page decides what to do with it
 *   (record attendance). This component never talks to the API itself.
 * • When the camera is unavailable or denied, the page's manual-entry field keeps
 *   the flow usable.
 */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { extractCheckinToken } from "@/lib/checkin-token";
import { Banner, primaryBtn, subtleBtn } from "./ui";

type CameraState = "idle" | "starting" | "running" | "denied" | "unavailable" | "error";

interface DetectedBarcode {
  rawValue?: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

type JsQrFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst" }
) => { data: string } | null;

/** jsQR is ~250KB: load it only when the camera is actually used. */
let jsQrPromise: Promise<JsQrFn | null> | null = null;
function loadJsQr(): Promise<JsQrFn | null> {
  if (!jsQrPromise) {
    jsQrPromise = import("jsqr")
      .then((mod) => (mod as { default?: JsQrFn }).default ?? (mod as unknown as JsQrFn))
      .catch(() => null);
  }
  return jsQrPromise;
}

export default function QrScanner({
  onToken,
  cooldownMs = 2500,
  paused = false,
}: {
  onToken: (token: string) => void;
  /** Ignore the same code again for this long (prevents instant re-scans). */
  cooldownMs?: number;
  /** Parent sets this while it is displaying a result. */
  paused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastTokenRef = useRef("");
  const lastTokenAtRef = useRef(0);
  const pausedRef = useRef(paused);

  const [state, setState] = useState<CameraState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  const handleValue = useCallback(
    (raw: string) => {
      const token = extractCheckinToken(raw);
      if (!token) return;
      const now = Date.now();
      if (token === lastTokenRef.current && now - lastTokenAtRef.current < cooldownMs) return;
      lastTokenRef.current = token;
      lastTokenAtRef.current = now;
      try {
        navigator.vibrate?.(60); // short "code captured" feedback where supported
      } catch {
        /* not supported */
      }
      onToken(token);
    },
    [cooldownMs, onToken]
  );

  const start = useCallback(async () => {
    if (runningRef.current) return;
    setMessage(null);
    setState("starting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      setMessage("المتصفح لا يدعم تشغيل الكاميرا. استخدم الإدخال اليدوي بالأسفل.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setState("denied");
        setMessage(
          "تم رفض إذن الكاميرا. افتح إعدادات المتصفح وامنح الإذن، أو استخدم الإدخال اليدوي."
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setState("unavailable");
        setMessage("لا توجد كاميرا متاحة على هذا الجهاز. استخدم الإدخال اليدوي بالأسفل.");
      } else {
        setState("error");
        setMessage("تعذّر تشغيل الكاميرا. جرّب مرة أخرى أو استخدم الإدخال اليدوي.");
      }
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setState("error");
      return;
    }

    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    try {
      await video.play();
    } catch {
      /* iOS autoplay quirks — the loop below waits for readyState anyway */
    }

    runningRef.current = true;
    setState("running");

    const detectorCtor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
      .BarcodeDetector;
    const detector = detectorCtor ? new detectorCtor({ formats: ["qr_code"] }) : null;

    const schedule = (delay: number) => {
      if (!runningRef.current) return;
      timerRef.current = window.setTimeout(tick, delay);
    };

    const tick = async () => {
      const v = videoRef.current;
      if (!runningRef.current || !v) return;

      if (pausedRef.current || v.readyState < 2) {
        schedule(200);
        return;
      }

      try {
        if (detector) {
          const codes = await detector.detect(v);
          const value = codes[0]?.rawValue;
          if (value) handleValue(value);
          schedule(250);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        if (!canvas || !ctx || !v.videoWidth) {
          schedule(250);
          return;
        }

        // Downscale before decoding: faster, and plenty for a printed QR code.
        const width = 480;
        const height = Math.round((v.videoHeight / v.videoWidth) * width) || 480;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(v, 0, 0, width, height);

        const jsQR = await loadJsQr();
        if (jsQR) {
          const image = ctx.getImageData(0, 0, width, height);
          const result = jsQR(image.data, width, height, { inversionAttempts: "dontInvert" });
          if (result?.data) handleValue(result.data);
        }
      } catch {
        /* a frame failed to decode — keep scanning */
      }

      schedule(detector ? 250 : 150);
    };

    schedule(150);
  }, [facing, handleValue]);

  useEffect(() => () => stop(), [stop]);

  const shouldRestartRef = useRef(false);

  const switchCamera = useCallback(() => {
    shouldRestartRef.current = runningRef.current;
    if (runningRef.current) stop();
    setFacing((prev) => (prev === "environment" ? "user" : "environment"));
  }, [stop]);

  // Bring the stream back up on the other camera after a switch.
  useEffect(() => {
    if (!shouldRestartRef.current) return;
    shouldRestartRef.current = false;
    const timer = window.setTimeout(() => void start(), 80);
    return () => window.clearTimeout(timer);
  }, [facing, start]);
}

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-blue-mid/40 bg-black/60">
        <video
          ref={videoRef}
          className="h-[46vh] max-h-96 w-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {state === "running" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-48 w-48 rounded-2xl border-4 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {state !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <div className="text-4xl" aria-hidden>
              📷
            </div>
            <p className="px-6 text-sm text-blue-light/70">
              {state === "starting" ? "جارٍ تشغيل الكاميرا…" : "الكاميرا متوقفة"}
            </p>
          </div>
        )}

        {/* Off-screen canvas used by the jsQR fallback */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {message && <Banner tone="warning">{message}</Banner>}

      <div className="flex flex-wrap gap-2">
        {state === "running" ? (
          <button type="button" onClick={stop} className={subtleBtn}>
            ⏹️ إيقاف الكاميرا
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void start()}
            disabled={state === "starting"}
            className={primaryBtn}
          >
            {state === "starting" ? "جارٍ التشغيل…" : "▶️ تشغيل الكاميرا"}
          </button>
        )}
        <button type="button" onClick={switchCamera} className={subtleBtn}>
          🔄 {facing === "environment" ? "الكاميرا الأمامية" : "الكاميرا الخلفية"}
        </button>
      </div>
    </div>
  );
}

